import { Show } from "solid-js"
import { language } from "#src/app/i18n/language.ts"
import { languageGetText } from "#src/app/i18n/languageGetText.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AssignmentTargetSelector } from "#src/assignment/ui/AssignmentTargetSelector.tsx"
import { addKeyboardListenerAlt } from "#src/auth/ui/sign_up/form/addKeyboardListenerAlt.ts"
import { resourceMetaSectionGetText } from "#src/resource/model_field/resourceMetaSectionGetText.ts"
import { resourceType } from "#src/resource/model_field/resourceType.ts"
import { resourceTypeGetText } from "#src/resource/model_field/resourceTypeGetText.ts"
import { visibility } from "#src/resource/model_field/visibility.ts"
import { visibilityGetText } from "#src/resource/model_field/visibilityGetText.ts"
import { ResourceFormFiles } from "#src/resource/ui/form/ResourceFormFiles.tsx"
import { ResourceFormImage } from "#src/resource/ui/form/ResourceFormImage.tsx"
import { resourceFormConfig, resourceFormField } from "#src/resource/ui/form/resourceFormField.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { urlResourceRemove } from "#src/resource/url/urlResource.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { isDevEnv } from "#src/utils/env/isDevEnv.ts"
import { CheckSingle } from "#ui/input/check/CheckSingle.jsx"
import { type FormMode, formMode, getFormModeButtonTitle, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { LabelPseudo } from "#ui/input/label/LabelPseudo.jsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface HasResourceFormStateManagement {
  sm: ResourceFormStateManagement
}
export interface ResourceFormProps extends MayHaveClass, HasResourceFormStateManagement {
  resourceId?: string
  mode: FormMode
  showFiles?: boolean
  showImageUpload?: boolean
  removeHref?: string
}

export function ResourceForm(p: ResourceFormProps) {
  if (isDevEnv() && p.showImageUpload !== false) {
    addKeyboardListenerAlt("t", p.sm.fillTestData)
  }
  return (
    <main
      class={classMerge(
        //
        "grid md:grid-cols-[max-content_1fr] gap-12",
        p.class,
      )}
    >
      <div class="flex flex-wrap justify-between mt-6 mb-2 col-span-full">
        <h1 class="text-2xl font-bold">{getResourceTitle(p.mode)}</h1>
        {p.mode === formMode.edit && (
          <LinkButtonInternal
            to={p.removeHref ?? urlResourceRemove(p.sm.serverState.get().resource.resourceId)}
            icon={formModeIcon.remove}
            variant={buttonVariant.link}
          >
            {ttc("Remove")}
          </LinkButtonInternal>
        )}
      </div>
      <form class="contents" onSubmit={p.sm.handleSubmit}>
        {/* General */}
        <section class="contents">
          <h2 class="text-2xl font-semibold mb-4 text-muted-foreground">{resourceMetaSectionGetText("general")}</h2>
          <div class="space-y-4">
            <NameField sm={p.sm} />
            {showTechnicalId() && p.mode === formMode.add && <ResourceIdField sm={p.sm} />}
            <DescriptionField sm={p.sm} />
            <TypeField sm={p.sm} />
          </div>
        </section>

        {/* Display */}
        <section class="contents">
          <h2 class="text-2xl font-semibold mb-4 text-muted-foreground">{resourceMetaSectionGetText("display")}</h2>
          <div class="space-y-4">
            <VisibilityField sm={p.sm} />
            <LanguageField sm={p.sm} />
          </div>
        </section>

        {/* Hierarchy Assignment */}
        <section class="contents">
          <h2 class="text-2xl font-semibold mb-4 text-muted-foreground">{ttc("Hierarchy Assignment")}</h2>
          <div class="space-y-4">
            <AssignmentTargetSelector valueSignal={p.sm.state.assignment} />
          </div>
        </section>

        {p.showFiles !== false && (
          <section class="contents">
            <h2 class="text-2xl font-semibold mb-4 text-muted-foreground">{ttc("Files")}</h2>
            <ResourceFormFiles sm={p.sm} />
          </section>
        )}

        {/* Image */}
        <section class="contents">
          <h2 class="text-2xl font-semibold mb-4 text-muted-foreground">{resourceMetaSectionGetText("image")}</h2>
          <ResourceFormImage sm={p.sm} showUpload={p.showImageUpload} />
        </section>

        <div class="hidden md:flex" />
        <ButtonIcon
          type="submit"
          size={buttonSize.lg}
          icon={formModeIcon[p.mode]}
          variant={
            p.mode === formMode.remove || p.sm.hasErrors() ? buttonVariant.filledRed : buttonVariant.filledIndigo
          }
          isLoading={p.sm.isSubmitting.get()}
          class="w-full"
        >
          {p.sm.isSubmitting.get() ? ttc("Saving...") : getFormModeButtonTitle(p.mode, ttc("Resource"))}
        </ButtonIcon>
      </form>
    </main>
  )
}

function showTechnicalId() {
  return false
}

function NameField(p: HasResourceFormStateManagement) {
  return (
    <FormFieldInput
      config={resourceFormConfig.name}
      value={p.sm.state.name.get()}
      error={p.sm.errors.name.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.name.set(value)
        p.sm.validateOnChange(resourceFormField.name)(value)
      }}
      onBlur={(value) => p.sm.validateOnChange(resourceFormField.name)(value)}
    />
  )
}

function ResourceIdField(p: HasResourceFormStateManagement) {
  return (
    <FormFieldInput
      config={resourceFormConfig.resourceId}
      value={p.sm.state.resourceId.get()}
      error={p.sm.errors.resourceId.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.resourceId.set(value)
        p.sm.validateOnChange(resourceFormField.resourceId)(value)
      }}
      onBlur={(value) => p.sm.validateOnChange(resourceFormField.resourceId)(value)}
    />
  )
}

function DescriptionField(p: HasResourceFormStateManagement) {
  return (
    <FormFieldInput
      config={resourceFormConfig.description}
      value={p.sm.state.description.get()}
      error={p.sm.errors.description.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.description.set(value)
        p.sm.validateOnChange(resourceFormField.description)(value)
      }}
      onBlur={(value) => p.sm.validateOnChange(resourceFormField.description)(value)}
    />
  )
}

// 1. General Fields

function TypeField(p: HasResourceFormStateManagement) {
  return (
    <div class="flex flex-col gap-2">
      <LabelPseudo>{ttc("Type")}</LabelPseudo>
      <CheckSingle
        valueSignal={p.sm.state.type}
        getOptions={() => Object.values(resourceType)}
        valueText={resourceTypeGetText}
        disabled={p.sm.mode === formMode.remove}
        innerClass="flex flex-wrap gap-2"
        optionClass="bg-gray-50"
        disallowDeselection={true}
      />
      <Show when={p.sm.errors.type.get()}>
        <p class="text-destructive">{p.sm.errors.type.get()}</p>
      </Show>
    </div>
  )
}

function LanguageField(p: HasResourceFormStateManagement) {
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
        disallowDeselection={true}
      />
      <Show when={p.sm.errors.language.get()}>
        <p class="text-destructive">{p.sm.errors.language.get()}</p>
      </Show>
    </div>
  )
}

// 2. Display Fields

function VisibilityField(p: HasResourceFormStateManagement) {
  return (
    <div class="flex flex-col gap-2">
      <LabelPseudo>{ttc("Visibility")}</LabelPseudo>
      <CheckSingle
        valueSignal={p.sm.state.visibility}
        getOptions={() => Object.values(visibility)}
        valueText={visibilityGetText}
        disabled={p.sm.mode === formMode.remove}
        innerClass="flex flex-wrap gap-2"
        optionClass="bg-gray-50"
        disallowDeselection={true}
      />
      <Show when={p.sm.errors.visibility.get()}>
        <p class="text-destructive">{p.sm.errors.visibility.get()}</p>
      </Show>
    </div>
  )
}

function getResourceTitle(mode: FormMode): string {
  return getFormModeTitle(mode, ttc("Resource"))
}
