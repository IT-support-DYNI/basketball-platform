import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

/*
 * S3-compatible object storage — see ARCHITECTURE.md §1 and §4. Works
 * against Cloudflare R2, Backblaze B2, or any other S3-compatible
 * provider without code changes; only STORAGE_ENDPOINT (and the
 * R2_ACCOUNT_ID fallback below, kept for anyone already on R2) differ.
 *
 * The bucket is treated as private, always — playback goes through
 * short-lived signed GET URLs (getPlaybackUrl) rather than a public
 * bucket URL. Several free-tier providers gate public buckets behind
 * a payment method or a one-time fee; a private bucket has no such
 * requirement anywhere, and it's the better default for a youth
 * sports org's videos regardless — nothing sits at a guessable
 * permanent public URL.
 */

function getClient() {
  const endpoint = process.env.STORAGE_ENDPOINT || (
    process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined
  );
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Object storage isn't configured — set STORAGE_ENDPOINT (or R2_ACCOUNT_ID for R2), R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (see .env.example)."
    );
  }

  return new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // The SDK's newer default (WHEN_SUPPORTED) bakes an x-amz-checksum-* /
    // x-amz-sdk-checksum-algorithm claim into every request — including
    // presigned URLs — which is an AWS-S3-specific extension most
    // S3-compatible providers (B2, R2, MinIO) don't honor the same way,
    // and rejects the request with a bare 403 that browsers then
    // misreport as a CORS failure (no CORS headers on error responses).
    // WHEN_REQUIRED only adds a checksum when an operation mandates one.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set (see .env.example).");
  return bucket;
}

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
}

/** folder is e.g. "videos" or "player-photos" — kept out of the caller's control to avoid arbitrary paths. */
export async function createPresignedUpload(
  folder: "videos" | "video-thumbnails" | "player-photos",
  contentType: string
): Promise<PresignedUpload> {
  const client = getClient();
  const bucket = getBucket();
  const key = `${folder}/${randomUUID()}`;

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  return { key, uploadUrl };
}

/** A short-lived signed GET URL for playback/download — generated fresh on every request, never stored. */
export async function getPlaybackUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
