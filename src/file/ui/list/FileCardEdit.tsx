import { omit } from "solid-js"
import type { HasFileModel } from "#src/file/model/HasFileModel.ts"
import { FileCardView } from "#src/file/ui/list/FileCardView.tsx"
import { urlFileEdit, urlFileRemove } from "#src/file/url/urlFile.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface FileCardEditProps extends HasResourceId, HasFileModel, MayHaveClass, MayHaveChildren {}

export function FileCardEdit(p: FileCardEditProps) {
  const rest = omit(p, "resourceId")
  return (
    <FileCardView {...rest}>
      <LinkButtonIconOnlyInternal
        icon={formModeIcon.edit}
        to={urlFileEdit(p.resourceId, rest.file.fileId)}
        variant={buttonVariant.ghost}
        title={getFormModeTitle(formMode.edit, "File")}
      />
      <LinkButtonIconOnlyInternal
        icon={formModeIcon.remove}
        to={urlFileRemove(p.resourceId, rest.file.fileId)}
        variant={buttonVariant.ghost}
        title={getFormModeTitle(formMode.remove, "File")}
      />
    </FileCardView>
  )
}
