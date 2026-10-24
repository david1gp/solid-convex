import { mdiTrashCanOutline } from "@adaptive-ds/mdi/mdiTrashCanOutline.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { UploadAreaImage } from "#src/file/ui/upload_image/UploadAreaImage.tsx"
import { resourceFormConfig } from "#src/resource/ui/form/resourceFormField.ts"
import { resourceFormImageStateCreate } from "#src/resource/ui/form/resourceFormImageStateCreate.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { Label } from "#ui/input/label/Label.jsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"

interface HasResourceFormStateManagement {
  sm: ResourceFormStateManagement
  showUpload?: boolean
}

export function ResourceFormImage(p: HasResourceFormStateManagement) {
  const state = resourceFormImageStateCreate({ sm: () => p.sm })

  return (
    <div class="space-y-4">
      <Show when={state.hasImageUrl()}>
        <div class="flex flex-col gap-2 max-w-sm">
          <img src={p.sm.state.image.get()} alt="Preview" class="w-full" />
          <ButtonIcon
            icon={mdiTrashCanOutline}
            variant={buttonVariant.outline}
            class=""
            onClick={state.handleRemoveImage}
          >
            {ttc("Remove image")}
          </ButtonIcon>
        </div>
      </Show>

      <Show when={p.showUpload !== false && !state.hasImageUrl()}>
        <div class="flex flex-col gap-2">
          <Label>{ttc("Upload an image directly")}</Label>
          <UploadAreaImage
            resourceId={p.sm.state.resourceId.get()}
            hasUploaded={state.hasUploaded}
            info={state.uploadInfo}
            error={state.uploadError}
            onUploadSuccess={(data) => state.handleUploadSuccess(data.url)}
            class={classesCard}
          />
        </div>
      </Show>

      <FormFieldInput
        config={resourceFormConfig.image}
        value={p.sm.state.image.get()}
        error={p.sm.errors.image.get()}
        mode={p.sm.mode}
        onInput={state.handleInput}
        onBlur={state.handleBlur}
      />
    </div>
  )
}
