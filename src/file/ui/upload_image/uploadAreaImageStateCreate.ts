import type { UploadStatus } from "#src/file/model_field/uploadStatus.ts"
import type { uploadHandlerImage } from "#src/file/ui/upload_image/uploadHandlerImage.tsx"
import { generateId12 } from "#utils/ran/generateId12.js"
import type { UploadAreaImageProps } from "./UploadAreaImage.tsx"
import { type JSX } from "@solidjs/web";

export function uploadAreaImageStateCreate(
  p: UploadAreaImageProps,
  upload: typeof uploadHandlerImage,
  imageError: () => string,
) {
  const generatedId = generateId12()
  function status(): UploadStatus {
    if (p.error?.get()) return "error"
    if (p.info.get()) return "uploading"
    if (p.hasUploaded()) return "uploaded"
    return "empty"
  }
  const fileChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = async (e) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      p.error?.set(imageError())
      return
    }
    if (p.onFileSelect) {
      await p.onFileSelect(file)
      return
    }
    await upload({
      resourceId: p.resourceId,
      assignment: p.assignment,
      file,
      uploadInfo: p.info,
      uploadError: p.error,
      onUploadSuccess: p.onUploadSuccess,
    })
  }
  return { id: () => p.id ?? generatedId, status, fileChange }
}
