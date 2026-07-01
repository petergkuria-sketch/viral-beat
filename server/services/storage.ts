import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3-compatible object storage (AWS S3, Cloudflare R2, MinIO…). Configured via
// env; when unset, the app gracefully falls back to the document-reference model.
const BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "";
const REGION = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
const ENDPOINT = process.env.S3_ENDPOINT || undefined;         // set for R2/MinIO
const ACCESS = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
const SECRET = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";

export function isStorageConfigured(): boolean {
  return !!(BUCKET && ACCESS && SECRET);
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      forcePathStyle: !!ENDPOINT, // R2/MinIO need path-style addressing
      credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
    });
  }
  return _client;
}

/** Presigned PUT for a direct browser upload (5 min TTL). */
export async function createUploadUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 });
}

/** Presigned GET so admins can view a private document (5 min TTL). */
export async function createDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 300 });
}
