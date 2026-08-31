import { INestApplication, Inject, Injectable, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import openapiTS from "openapi-typescript";
import { astToString, type OpenAPI3 } from "openapi-typescript/dist/index.js";
import ts from "typescript";
import { type ConfigType } from "@nestjs/config";
import { OpenApiConfig } from "../../configs/openapi.confg.js";

@Injectable()
export class OpenApiService {
  private readonly logger = new Logger(OpenApiService.name);

  constructor(
    @Inject(OpenApiConfig.KEY) private readonly openApiConfig: ConfigType<typeof OpenApiConfig>,
  ) {}

  setup(app: INestApplication) {
    const config = new DocumentBuilder()
      .setTitle(this.openApiConfig.title)
      .setDescription(this.openApiConfig.description)
      .setVersion(this.openApiConfig.version)
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
      "/openapi",
      apiReference({
        sources: [
          { content: document, title: this.openApiConfig.title },
          { url: "/better-auth/open-api/generate-schema", title: "BetterAuth" },
        ],
      }),
    );

    return document;
  }

  generateTypesInBackground(document: OpenAPIObject): void {
    void this.generateTypes(document).catch((error: unknown) => {
      this.logger.error("Failed to generate OpenAPI types", error);
    });
  }

  async generateTypes(document: OpenAPIObject): Promise<boolean> {
    const contents = await this.buildTypeDefinitions(document);

    if (!(await this.haveTypeDefinitionsChanged(contents))) {
      return false;
    }

    const outputPath = this.openApiConfig.outputPath;
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, contents, "utf8");
    this.logger.log(`Generated OpenAPI types at ${outputPath}`);
    return true;
  }

  private async buildTypeDefinitions(document: OpenAPIObject): Promise<string> {
    const blobType = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Blob"));
    const nullType = ts.factory.createLiteralTypeNode(ts.factory.createNull());
    const ast = await openapiTS(document as OpenAPI3, {
      transform(schema) {
        if (schema.format !== "binary") {
          return;
        }

        return schema.nullable ? ts.factory.createUnionTypeNode([blobType, nullType]) : blobType;
      },
    });

    return astToString(ast);
  }

  private async haveTypeDefinitionsChanged(nextContents: string): Promise<boolean> {
    const outputPath = this.openApiConfig.outputPath;

    try {
      await access(outputPath);
      const currentContents = await readFile(outputPath, "utf8");
      return currentContents !== nextContents;
    } catch {
      return true;
    }
  }
}
