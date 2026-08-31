import { type FileStatus, type FileVisibility } from '../database/tables/files.table.js';

export type { FileStatus, FileVisibility };

export type UploadPolicy = {
  visibility: FileVisibility;
  maxByteSize: number;
  contentTypes: readonly string[];
};

export type CreateUploadInput = {
  policy: UploadPolicy;
  contentType: string;
  originalFilename: string;
  ownerId: string;
  byteSize: number;
};

export type ObjectMetadata = {
  contentType?: string;
  byteSize: number;
  checksum?: string;
};

export type SignPutInput = {
  bucket: string;
  key: string;
  contentType: string;
  cacheControl: string;
  byteSize: number;
  expiresInSeconds: number;
};

export type SignGetInput = {
  bucket: string;
  key: string;
  expiresInSeconds: number;
  contentType?: string;
  contentDisposition?: string;
};

export type PresignedRequest = {
  url: string;
  method: 'GET' | 'PUT';
  headers?: Record<string, string>;
  expiresAt: Date;
};

export const cacheControlHeaders = {
  public: 'public, max-age=31536000, immutable',
  private: 'private, max-age=31536000, immutable',
} as const satisfies Record<FileVisibility, string>;
