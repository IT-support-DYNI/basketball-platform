import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

/*
 * Cloudflare R2 (S3-compatible) — see ARCHITECTURE.md §1 and §4.
 * The browser uploads directly to R2 using a short-lived presigned
 * URL issued here; the file itself never passes through the Next.js
 * function. Swapping this file for a different provider (e.g. Mux,
 * post-MVP) doesn't require changing any callers — they only ever
 * see { uploadUrl, publicUrl }.
 */

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage isn't configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (see .env.example)."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set (see .env.example).");
  return bucket;
}

function getPublicBase() {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error("R2_PUBLIC_BASE_URL is not set (see .env.example).");
  return base.replace(/\/$/, "");
}

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  publicUrl: string;
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

  return { key, uploadUrl, publicUrl: `${getPublicBase()}/${key}` };
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
