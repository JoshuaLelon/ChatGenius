import { generatePresignedUploadUrl, generateFileKey } from "./s3"

const ALLOWED_FILE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
}

export async function uploadFile(file: File): Promise<{ url: string; name: string }> {
  const fileType = file.type as keyof typeof ALLOWED_FILE_TYPES
  
  if (!ALLOWED_FILE_TYPES[fileType]) {
    throw new Error("Unsupported file type")
  }

  const extension = ALLOWED_FILE_TYPES[fileType]
  const key = generateFileKey(`${file.name}.${extension}`)
  const presignedUrl = await generatePresignedUploadUrl(key, fileType)

  // Upload the file using the presigned URL
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": fileType,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to upload file")
  }

  // Return the file URL (without the presigned parameters)
  const baseUrl = presignedUrl.split("?")[0]
  return {
    url: baseUrl,
    name: file.name,
  }
} 