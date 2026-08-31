import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { InjectDrizzle } from "@nest-native/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, notInArray } from "drizzle-orm";
import { StorageConfig } from "../../configs/storage.config.js";
import { files } from "../database/drizzle.schema.js";
import type { DrizzleClient } from "../database/drizzle.type.js";
import { takeFirst, takeFirstOrThrow } from "../database/drizzle.utils.js";
import type { FileStatus, FileVisibility } from "../database/tables/files.table.js";
import { StorageTransport } from "./storage.transport.js";
import { cacheControlHeaders, type CreateUploadInput } from "./storage.types.js";
import {
  assertByteSize,
  bucketFor,
  contentDisposition,
  sanitizeOriginalFilename,
} from "./storage.utils.js";

const HIDDEN_STATUSES: FileStatus[] = ["failed", "deleted"];

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly transport: StorageTransport,
    @InjectDrizzle() private readonly drizzle: DrizzleClient,
    @Inject(StorageConfig.KEY) private readonly storageConfig: ConfigType<typeof StorageConfig>,
  ) {}

  async onModuleInit() {
    if (this.storageConfig.provision) {
      try {
        await this.transport.bootstrap();
      } catch (error) {
        this.logger.warn(
          `Storage bootstrap failed. Local uploads may not work: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  async createUpload(input: CreateUploadInput) {
    const contentType = input.contentType.toLowerCase();
    const originalFilename = sanitizeOriginalFilename(input.originalFilename);
    const { policy } = input;

    if (!policy.contentTypes.includes(contentType)) {
      throw new BadRequestException(`Content type ${contentType} is not allowed for this upload`);
    }

    assertByteSize(input.byteSize, policy.maxByteSize);

    const key = createId();
    const bucket = bucketFor(policy.visibility, this.storageConfig);

    const file = await this.drizzle
      .insert(files)
      .values({
        key,
        bucket,
        contentType,
        byteSize: input.byteSize,
        maxByteSize: policy.maxByteSize,
        originalFilename,
        ownerId: input.ownerId,
        visibility: policy.visibility,
        status: "pending",
      })
      .returning()
      .then(takeFirstOrThrow);

    const upload = await this.transport.signPut({
      bucket,
      key,
      contentType,
      cacheControl: cacheControlHeaders[policy.visibility],
      byteSize: input.byteSize,
      expiresInSeconds: this.storageConfig.putExpiresInSeconds,
    });

    return { file, upload };
  }

  async completeUpload(fileId: string, ownerId: string) {
    const file = await this.findOwnedFile(fileId, ownerId);

    if (file.status === "ready") return this.withUrl(file);
    if (file.status !== "pending") {
      throw new BadRequestException("This upload can no longer be completed");
    }

    const object = await this.transport.head(file.bucket, file.key);
    if (!object) {
      throw new BadRequestException("Nothing was uploaded for this file");
    }

    try {
      if (file.byteSize != null && object.byteSize !== file.byteSize) {
        throw new BadRequestException("Uploaded object size does not match the declared size");
      }

      assertByteSize(object.byteSize, file.maxByteSize);

      if (object.contentType && object.contentType.toLowerCase() !== file.contentType) {
        throw new BadRequestException("Uploaded object content type does not match the file");
      }
    } catch (error) {
      await this.failUpload(file);
      throw error;
    }

    const completed = await this.drizzle
      .update(files)
      .set({
        status: "ready",
        byteSize: object.byteSize,
        checksum: object.checksum,
      })
      .where(and(eq(files.id, file.id), eq(files.status, "pending")))
      .returning()
      .then(takeFirst);

    if (completed) return this.withUrl(completed);

    const raced = await this.findOwnedFile(fileId, ownerId);
    if (raced.status === "ready") return this.withUrl(raced);

    throw new BadRequestException("This upload can no longer be completed");
  }

  async presignDownload(
    fileId: string,
    ownerId: string,
    disposition: "inline" | "attachment" = "inline",
  ) {
    const file = await this.findReadyFile(fileId, ownerId);

    if (file.visibility === "public") {
      throw new BadRequestException("Public files are available at a permanent URL");
    }

    return this.transport.signGet({
      bucket: file.bucket,
      key: file.key,
      contentType: file.contentType,
      contentDisposition: contentDisposition(file.originalFilename, disposition),
      expiresInSeconds: this.storageConfig.getExpiresInSeconds,
    });
  }

  async find(fileId: string, ownerId: string) {
    return this.withUrl(await this.findReadyFile(fileId, ownerId));
  }

  async delete(fileId: string, ownerId: string) {
    const file = await this.findOwnedFile(fileId, ownerId);

    await this.transport.delete(file.bucket, file.key);

    return this.drizzle
      .update(files)
      .set({ status: "deleted" })
      .where(eq(files.id, file.id))
      .returning()
      .then(takeFirstOrThrow);
  }

  private withUrl<T extends { key: string; visibility: FileVisibility; status: FileStatus }>(
    file: T,
  ) {
    return {
      ...file,
      url:
        file.status === "ready" && file.visibility === "public"
          ? this.transport.publicObjectUrl(file.key)
          : undefined,
    };
  }

  private async findReadyFile(fileId: string, ownerId: string) {
    const file = await this.findOwnedFile(fileId, ownerId);
    if (file.status !== "ready") {
      throw new NotFoundException("The requested file was not found.");
    }
    return file;
  }

  private async findOwnedFile(fileId: string, ownerId: string) {
    const file = await this.drizzle
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.ownerId, ownerId),
          notInArray(files.status, HIDDEN_STATUSES),
        ),
      )
      .limit(1)
      .then(takeFirst);

    if (!file) {
      throw new NotFoundException("The requested file was not found.");
    }

    return file;
  }

  private async failUpload(file: { id: string; bucket: string; key: string }) {
    await this.transport.delete(file.bucket, file.key);
    await this.drizzle
      .update(files)
      .set({ status: "failed" })
      .where(and(eq(files.id, file.id), eq(files.status, "pending")));
  }
}
