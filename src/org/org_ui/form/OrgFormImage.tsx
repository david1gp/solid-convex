import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { UploadAreaImage } from "#src/file/ui/upload_image/UploadAreaImage.tsx"
import { orgFormConfig, orgFormField } from "#src/org/org_ui/form/orgFormField.ts"
import { orgFormImageStateCreate } from "#src/org/org_ui/form/orgFormImageStateCreate.ts"
import type { OrgFormStateManagement } from "#src/org/org_ui/form/orgFormStateManagement.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { Label } from "#ui/input/label/Label.jsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"

interface HasOrgFormStateManagement {
  sm: OrgFormStateManagement
  demo?: boolean
}

export function OrgFormImage(p: HasOrgFormStateManagement) {
  const state = orgFormImageStateCreate(() => p.sm)

  return (
    <div class="space-y-4">
      <Show when={state.hasImageUrl()}>
        <div class="flex flex-col gap-2 max-w-sm">
          <img src={p.sm.state.image.get()} alt="Organization logo preview" class="w-full" />
          <ButtonIcon icon={appIcons.delete} variant={buttonVariant.outline} class="" onClick={state.imageRemove}>
            {ttc("Remove image")}
          </ButtonIcon>
        </div>
      </Show>

      <Show when={!state.hasImageUrl() && !p.demo}>
        <div class="flex flex-col gap-2">
          <Label>{ttc("Upload an image directly")}</Label>
          <UploadAreaImage
            hasUploaded={state.hasUploaded}
            info={state.uploadInfo}
            error={state.uploadError}
            onUploadSuccess={(data) => state.imageChange(data.url)}
            class={classesCard}
          />
        </div>
      </Show>

      <FormFieldInput
        config={orgFormConfig.image}
        value={p.sm.state.image.get()}
        error={p.sm.errors.image.get()}
        mode={p.sm.mode}
        onInput={state.imageChange}
        onBlur={(value) => p.sm.validateOnChange(orgFormField.image)(value)}
      />
    </div>
  )
}
