import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import crypto from "crypto"

export function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials")
  }

  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  contentType: string
): Promise<{ url: string }> {
  const bucketName = process.env.R2_BUCKET_NAME
  let publicBaseUrl = process.env.R2_PUBLIC_BASE_URL

  if (!bucketName || !publicBaseUrl) {
    throw new Error("Missing R2 bucket configuration (R2_BUCKET_NAME or R2_PUBLIC_BASE_URL)")
  }

  // Normalize public base URL
  publicBaseUrl = publicBaseUrl.replace(/\/$/, "")

  // Validate allowed MIME types
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}`)
  }

  // Generate safe object key
  const extMatch = filename.match(/\.[0-9a-z]+$/i)
  const ext = extMatch ? extMatch[0].toLowerCase() : ""
  const randomId = crypto.randomBytes(16).toString("hex")
  
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  
  const objectKey = `uploads/${year}/${month}/${randomId}${ext}`

  const client = getS3Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return {
    url: `${publicBaseUrl}/${objectKey}`
  }
}
