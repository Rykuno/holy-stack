import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Logger } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { type StorageConfig } from "../../../configs/storage.config.js";
import { StorageTransport } from "../storage.transport.js";
import {
  type ObjectMetadata,
  type PresignedRequest,
  type SignGetInput,
  type SignPutInput,
} from "../storage.types.js";

export class S3Transport extends StorageTransport {
  private readonly logger = new Logger(S3Transport.name);
  private readonly client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly corsOrigins: string[];
  private readonly publicBaseUrl: string;

  constructor(storageConfig: ConfigType<typeof StorageConfig>) {
    super();
    this.publicBucket = storageConfig.publicBucket;
    this.privateBucket = storageConfig.privateBucket;
    this.corsOrigins = storageConfig.corsOrigins;
    this.publicBaseUrl = publicBaseUrl(storageConfig);
    this.client = new S3Client({
      region: storageConfig.region,
      endpoint: storageConfig.url,
      forcePathStyle: storageConfig.forcePathStyle,
      credentials: {
        accessKeyId: storageConfig.accessKey,
        secretAccessKey: storageConfig.secretKey,
      },
    });
  }

  publicObjectUrl(key: string): string {
    const path = key
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${this.publicBaseUrl}/${path}`;
  }

  async bootstrap(): Promise<void> {
    await this.ensureBucket(this.privateBucket);
    await this.ensureBucket(this.publicBucket);
    await this.ensureCors(this.privateBucket);
    await this.ensureCors(this.publicBucket);
    await this.ensurePublicRead(this.publicBucket);
  }

  async head(bucket: string, key: string): Promise<ObjectMetadata | null> {
    try {
      const object = await this.client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      return {
        contentType: object.ContentType,
        byteSize: object.ContentLength ?? 0,
        checksum: object.ChecksumSHA256,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async signPut(input: SignPutInput): Promise<PresignedRequest> {
    const headers: Record<string, string> = {
      "Content-Type": input.contentType,
      "Cache-Control": input.cacheControl,
      "Content-Length": String(input.byteSize),
    };

    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        ContentLength: input.byteSize,
      }),
      { expiresIn: input.expiresInSeconds },
    );

    return {
      url,
      method: "PUT",
      headers,
      expiresAt: expiresAt(input.expiresInSeconds),
    };
  }

  async signGet(input: SignGetInput): Promise<PresignedRequest> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ResponseContentType: input.contentType,
        ResponseContentDisposition: input.contentDisposition,
      }),
      { expiresIn: input.expiresInSeconds },
    );

    return {
      url,
      method: "GET",
      expiresAt: expiresAt(input.expiresInSeconds),
    };
  }

  private async ensureBucket(bucket: string): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (!isNotFound(error)) throw error;

      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      } catch (createError) {
        if (!isBucketAlreadyExists(createError)) throw createError;
      }
    }
  }

  private async ensureCors(bucket: string): Promise<void> {
    if (this.corsOrigins.length === 0) return;

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "HEAD"],
                AllowedOrigins: this.corsOrigins,
                ExposeHeaders: ["ETag", "Content-Type", "Content-Length"],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Could not set bucket CORS. Browser uploads to ${bucket} may fail: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async ensurePublicRead(bucket: string): Promise<void> {
    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicRead",
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          }),
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Could not set public read policy on ${bucket}. Public object URLs may 403: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

function publicBaseUrl(storageConfig: ConfigType<typeof StorageConfig>): string {
  if (storageConfig.publicUrl) return trimTrailingSlash(storageConfig.publicUrl);

  if (storageConfig.url && storageConfig.forcePathStyle) {
    return `${trimTrailingSlash(storageConfig.url)}/${storageConfig.publicBucket}`;
  }

  return `https://${storageConfig.publicBucket}.s3.${storageConfig.region}.amazonaws.com`;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function expiresAt(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey" ||
    candidate.name === "NoSuchBucket" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

function isBucketAlreadyExists(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string };
  return candidate.name === "BucketAlreadyOwnedByYou" || candidate.name === "BucketAlreadyExists";
}
