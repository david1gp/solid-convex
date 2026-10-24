import type { HasFileId } from "#src/file/model_field/HasFileId.ts"
import { FileForm } from "#src/file/ui/form/FileForm.tsx"
import { fileFormStateManagement } from "#src/file/ui/form/fileFormStateManagement.ts"
import { type FileComponentProps, FileLoader } from "#src/file/ui/mutate/FileLoader.tsx"
import { fileMutateStateCreate } from "#src/file/ui/mutate/fileMutateStateCreate.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import type { HasFormModeMutate } from "#ui/input/form/formModeMutate.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface FileMutateProps extends HasFileId, HasResourceId, HasFormModeMutate, MayHaveClass {}

export function FileMutate(p: FileMutateProps) {
  function FileComponent(wp: FileComponentProps) {
    fileMutateStateCreate({ file: () => wp.file })
    return <FileMutateForm fileId={p.fileId} resourceId={p.resourceId} mode={p.mode} {...wp} />
  }
  return <FileLoader fileId={p.fileId} FileComponent={FileComponent} />
}

interface FileMutateFormProps extends HasFileId, HasResourceId, HasFormModeMutate, FileComponentProps, MayHaveClass {}

function FileMutateForm(p: FileMutateFormProps) {
  const sm = fileFormStateManagement(p.mode, p.file)
  return <FileForm fileId={p.file.fileId} resourceId={p.resourceId} mode={p.mode} sm={sm} />
}
