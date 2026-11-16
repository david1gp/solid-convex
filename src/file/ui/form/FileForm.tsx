import { Show } from "solid-js"
import { language } from "#src/app/i18n/language.ts"
import { languageGetText } from "#src/app/i18n/languageGetText.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AssignmentTargetSelector } from "#src/assignment/ui/AssignmentTargetSelector.tsx"
import { addKeyboardListenerAlt } from "#src/auth/ui/sign_up/form/addKeyboardListenerAlt.ts"
import type { HasFileId } from "#src/file/model_field/HasFileId.ts"
import { fileFormConfig, fileFormField } from "#src/file/ui/form/fileFormField.ts"
import type { FileFormStateManagement, FormModeEditOrDelete } from "#src/file/ui/form/fileFormStateManagement.ts"
import { urlFileRemove } from "#src/file/url/urlFile.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { isDevEnv } from "#src/utils/env/isDevEnv.ts"
import { CheckSingle } from "#ui/input/check/CheckSingle.jsx"
import { type FormMode, formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { LabelPseudo } from "#ui/input/label/LabelPseudo.jsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface HasFileFormStateManagement {
  sm: FileFormStateManagement
}

export interface FileFormProps extends HasResourceId, HasFileId, HasFileFormStateManagement, MayHaveClass {
  mode: FormModeEditOrDelete
}

export function FileForm(p: FileFormProps) {
  if (isDevEnv()) {
    addKeyboardListenerAlt("t", p.sm.fillTestData)
  }
  return (
    <section class={cn("px-2 sm:px-4 pb-10", "text-gray-900 dark:text-gray-100", p.class)}>
      <div class="flex flex-wrap justify-between mt-6 mb-2">
        <h1 class="text-2xl font-bold">{getFileTitle(p.mode)}</h1>
        {p.mode === formMode.edit && (
          <LinkButtonInternal
            to={urlFileRemove(p.resourceId, p.fileId)}
            icon={formModeIcon.remove}
            variant={buttonVariant.link}
          >
            {ttc("Remove")}
          </LinkButtonInternal>
        )}
      </div>
      <form class="space-y-4" onSubmit={p.sm.handleSubmit}>
        <FileNameField sm={p.sm} />
        <LanguageField sm={p.sm} />
        <div class="space-y-2">
          <AssignmentTargetSelector
            valueSignal={p.sm.state.assignment}
            disabled={() => p.sm.mode === formMode.remove}
          />
        </div>
        <ButtonIcon
          type="submit"
          isLoading={p.sm.isSubmitting.get()}
          icon={formModeIcon[p.mode]}
          variant={
            p.mode === formMode.remove || p.sm.hasErrors() ? buttonVariant.filledRed : buttonVariant.filledIndigo
          }
          class="w-full"
        >
          {p.sm.isSubmitting.get() ? ttc("Saving...") : getFileTitle(p.mode)}
        </ButtonIcon>
      </form>
    </section>
  )
}

function FileNameField(p: HasFileFormStateManagement) {
  return (
    <FormFieldInput
      config={fileFormConfig.displayName}
      value={p.sm.state.displayName.get()}
      error={p.sm.errors.displayName.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.displayName.set(value)
        p.sm.validateOnChange(fileFormField.displayName)(value)
      }}
      onBlur={(value) => p.sm.validateOnChange(fileFormField.displayName)(value)}
    />
  )
}

function LanguageField(p: HasFileFormStateManagement) {
  return (
    <div class="flex flex-col gap-2">
      <LabelPseudo>{ttc("Language")}</LabelPseudo>
      <CheckSingle
        valueSignal={p.sm.state.language}
        getOptions={() => Object.values(language)}
        valueText={languageGetText}
        disabled={p.sm.mode === formMode.remove}
        innerClass="flex flex-wrap gap-2"
        optionClass="bg-gray-50"
      />
      <Show when={p.sm.errors.language.get()}>
        <p class="text-destructive">{p.sm.errors.language.get()}</p>
      </Show>
    </div>
  )
}

function getFileTitle(mode: FormMode): string {
  return getFormModeTitle(mode, ttc("File"))
}
