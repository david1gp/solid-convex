import { mdiArrowLeft } from "@adaptive-ds/mdi/mdiArrowLeft.js"
import { mdiTrashCanOutline } from "@adaptive-ds/mdi/mdiTrashCanOutline.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlUserProfileMe } from "#src/auth/url/pageRouteAuth.ts"
import { UploadAreaImage } from "#src/file/ui/upload_image/UploadAreaImage.tsx"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"
import { userProfileMeImagePageStateCreate } from "./userProfileMeImagePageStateCreate.ts"

export function UserProfileMeImageView(p: {
  stateFactory?: typeof userProfileMeImagePageStateCreate
  profileHref?: string
}) {
  const state = (p.stateFactory ?? userProfileMeImagePageStateCreate)()
  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-4">{ttc("Change Profile Image")}</h1>
      <div class="rounded-md border border-border bg-background p-4 sm:p-5">
        <div class="space-y-6">
          <Show when={state.hasImage()}>
            <div class="flex flex-col gap-2 max-w-sm">
              <img src={state.image()} alt="Profile preview" class="w-full rounded-md" />
              <ButtonIcon
                icon={mdiTrashCanOutline}
                variant={buttonVariant.outline}
                disabled={state.loading()}
                onClick={state.remove}
              >
                {ttc("Remove image")}
              </ButtonIcon>
            </div>
          </Show>
          <Show when={!state.hasImage()}>
            <div class="flex flex-col gap-2">
              <UploadAreaImage
                hasUploaded={state.hasUploaded}
                info={state.uploadInfo}
                error={state.uploadError}
                onUploadSuccess={state.uploadSuccess}
                onFileSelect={state.selectFile}
                class={classesCard}
              />
            </div>
          </Show>
        </div>
        <p role="status">{state.message()}</p>
        <div class="mt-6 flex justify-start">
          <LinkButtonInternal icon={mdiArrowLeft} to={p.profileHref ?? urlUserProfileMe()} variant={buttonVariant.link}>
            {ttc("Back to Profile")}
          </LinkButtonInternal>
        </div>
      </div>
    </div>
  )
}
