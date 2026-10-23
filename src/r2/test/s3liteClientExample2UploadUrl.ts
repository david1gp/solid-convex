import { S3Client } from "@bradenmacdonald/s3-lite-client"
import { createResult, createResultError, type PromiseResult } from "#result"
import { envR2AccessKeyIdResult } from "#src/app/env/private/envR2AccessKeyIdResult.ts"
import { envR2AccountIdResult } from "#src/app/env/private/envR2AccountIdResult.ts"
import { envR2BucketNameResult } from "#src/app/env/private/envR2BucketNameResult.ts"
import { envR2SecretAccessKeyResult } from "#src/app/env/private/envR2SecretAccessKeyResult.ts"

const accessKeyIdResult = envR2AccessKeyIdResult()
if (!accessKeyIdResult.success) {
  console.error(accessKeyIdResult)
  process.exit(1)
}
const accessKeyId = accessKeyIdResult.data

const accessKeySecretResult = envR2SecretAccessKeyResult()
if (!accessKeySecretResult.success) {
  console.error(accessKeySecretResult)
  process.exit(2)
}
const accessKeySecret = accessKeySecretResult.data

const bucketNameResult = envR2BucketNameResult()
if (!bucketNameResult.success) {
  console.error(bucketNameResult)
  process.exit(3)
}
const bucket = bucketNameResult.data

const accountIdResult = envR2AccountIdResult()
if (!accountIdResult.success) {
  console.error(accountIdResult)
  process.exit(4)
}
const accountId = accountIdResult.data

const s3 = new S3Client({
  endPoint: `https://${accountId}.r2.cloudflarestorage.com`,
  accessKey: accessKeyId,
  secretKey: accessKeySecret,
  region: "auto",
  bucket: bucket,
  pathStyle: true,
})

async function generateUploadUrl(customKey?: string) {
  const key = customKey ?? crypto.randomUUID()
  const url = await s3.getPresignedUrl("PUT", key, {
    expirySeconds: 3600,
  })
  return { key, url }
}

async function uploadFile(url: string, data: Uint8Array, contentType: string): PromiseResult<void> {
  const op = "uploadFile"
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: new Blob([data.buffer as ArrayBuffer]),
  })
  if (!response.ok) {
    return createResultError(op, `Upload failed: ${response.status} ${response.statusText}`)
  }
  return createResult(undefined)
}

async function downloadFile(url: string): PromiseResult<{ data: Uint8Array; contentType: string }> {
  const op = "downloadFile"
  const response = await fetch(url)
  if (!response.ok) {
    return createResultError(op, `Download failed: ${response.status} ${response.statusText}`)
  }
  const data = new Uint8Array(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") ?? "application/octet-stream"
  return createResult({ data, contentType })
}

async function main(): PromiseResult<void> {
  console.log("Downloading test image...")
  const downloaded = await downloadFile("https://picsum.photos/seed/picsum/200/300")
  if (!downloaded.success) return downloaded
  const { data, contentType } = downloaded.data
  console.log(`Downloaded: ${data.length} bytes, type: ${contentType}`)

  console.log("\nGenerating upload URL...")
  const { key, url } = await generateUploadUrl()
  console.log("Key:", key)
  console.log("URL:", url)

  console.log("\nUploading...")
  const uploadedResult = await uploadFile(url, data, contentType)
  if (!uploadedResult.success) return uploadedResult
  console.log("Upload complete!")

  console.log("\nVerifying upload...")
  const uploaded = await s3.getObject(key)
  console.log("Uploaded file size:", (await uploaded.arrayBuffer()).byteLength, "bytes")
  return createResult(undefined)
}

const result = await main()
if (!result.success) {
  console.error(result)
  process.exit(1)
}
