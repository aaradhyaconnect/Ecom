import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT!;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function uploadImage(
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string
): Promise<string> {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${publicUrl}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  const s3 = getClient();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export async function listImages(prefix?: string): Promise<string[]> {
  const s3 = getClient();
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    })
  );
  return (result.Contents ?? []).map((obj) => obj.Key!).filter(Boolean);
}

export function getPublicUrl(key: string): string {
  return `${publicUrl}/${key}`;
}

export function keyFromUrl(url: string): string | null {
  if (!url.startsWith(publicUrl)) return null;
  return url.slice(publicUrl.length + 1);
}
