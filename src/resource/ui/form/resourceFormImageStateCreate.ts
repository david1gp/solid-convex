import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { resourceFormField } from "#src/resource/ui/form/resourceFormField.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function resourceFormImageStateCreate(p: { sm: () => ResourceFormStateManagement }) {
  const uploadInfo = createSignalObject<UploadAreaFileInfo | null>(null)
  const uploadError = createSignalObject<string | null>(null)

  function hasUploaded() {
    return !!uploadInfo.get()
  }

  function hasImageUrl() {
    return !!p.sm().state.image.get()
  }

  function handleRemoveImage() {
    p.sm().state.image.set("")
    p.sm().validateOnChange(resourceFormField.image)("")
  }

  function handleUploadSuccess(url: string) {
    p.sm().state.image.set(url)
    p.sm().validateOnChange(resourceFormField.image)(url)
  }

  function handleInput(value: string) {
    p.sm().state.image.set(value)
    p.sm().validateOnChange(resourceFormField.image)(value)
  }

  function handleBlur(value: string) {
    p.sm().validateOnChange(resourceFormField.image)(value)
  }

  return {
    uploadInfo,
    uploadError,
    hasUploaded,
    hasImageUrl,
    handleRemoveImage,
    handleUploadSuccess,
    handleInput,
    handleBlur,
  }
}
