import {
  type ObjectMetadata,
  type PresignedRequest,
  type SignGetInput,
  type SignPutInput,
} from './storage.types.js';

export abstract class StorageTransport {
  abstract publicObjectUrl(key: string): string;

  abstract bootstrap(): Promise<void>;

  abstract head(bucket: string, key: string): Promise<ObjectMetadata | null>;

  abstract delete(bucket: string, key: string): Promise<void>;

  abstract signPut(input: SignPutInput): Promise<PresignedRequest>;

  abstract signGet(input: SignGetInput): Promise<PresignedRequest>;
}
