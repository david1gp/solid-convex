import { mdiEye } from "@adaptive-ds/mdi/mdiEye.js"
import { mdiEyeOff } from "@adaptive-ds/mdi/mdiEyeOff.js"
import { mdiTranslateVariant } from "@adaptive-ds/mdi/mdiTranslateVariant.js"
import { Show } from "solid-js"
import type { Language } from "#src/app/i18n/language.ts"
import { languageGetText } from "#src/app/i18n/languageGetText.ts"
import { type Visibility, visibility } from "#src/resource/model_field/visibility.ts"
import { visibilityGetText } from "#src/resource/model_field/visibilityGetText.ts"
import { BadgeSoft } from "#src/ui/badge/BadgeSoft.tsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface MetaSectionTechnicalProps extends MayHaveClass, MayHaveChildren {
  visibility?: Visibility
  language?: Language
}

export function MetaSectionDisplay(p: MetaSectionTechnicalProps) {
  return (
    <div class={cn("flex flex-wrap gap-4", p.class)}>
      <Show when={p.visibility}>{(getVisibility) => <VisibilityBadge visibility={getVisibility()} />}</Show>
      <Show when={p.language}>{(getLanguage) => <LanguageBadge language={getLanguage()} />}</Show>
      {p.children}
    </div>
  )
}

interface VisibilityBadgeProps extends MayHaveClass {
  visibility: Visibility
}

function VisibilityBadge(p: VisibilityBadgeProps) {
  const v = p.visibility
  const text = visibilityGetText(v)
  return (
    <BadgeSoft>
      <Icon path={v === visibility.public ? mdiEye : mdiEyeOff} />
      <span>{text}</span>
    </BadgeSoft>
  )
}

interface LanguageBadgeProps extends MayHaveClass {
  language: Language
}

function LanguageBadge(p: LanguageBadgeProps) {
  const l = p.language
  const text = languageGetText(l)
  return (
    <BadgeSoft>
      <Icon path={mdiTranslateVariant} />
      <span>{text}</span>
    </BadgeSoft>
  )
}
