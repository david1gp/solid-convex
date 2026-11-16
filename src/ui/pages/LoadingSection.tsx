import { ttc, ttc1 } from "#src/app/i18n/ttc.ts"
import styles from "#src/ui/loaders/AnimateFadeIn.module.css"
import { RandomLoader } from "#src/ui/loaders/RandomLoader.tsx"
import { classesCardWrapperBorderDark } from "#ui/static/card/classesCardWrapper.ts"
import { SeparatorWithText } from "#ui/static/separator/SeparatorWithText.jsx"
import { cn } from "cn"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"

export interface LoadingSectionProps extends MayHaveId, MayHaveChildrenAndClass, MayHaveInnerClass {
  loadingText?: string
  loadingSubject?: string
  loaderClass?: string
}

export function LoadingSection(p: LoadingSectionProps) {
  return (
    <section
      id={p.id}
      class={cn(
        classesCardWrapperBorderDark,
        styles.animateFadeIn2s,
        "min-h-60", // h
        "flex flex-col items-center gap-4",
        p.class,
      )}
    >
      <SeparatorWithText>
        <h2 class={"text-3xl my-2"}>{getTitle(p.loadingText, p.loadingSubject)}</h2>
      </SeparatorWithText>
      <RandomLoader class={p.loaderClass} />
    </section>
  )
}

function getTitle(title?: string, titleSubject?: string): string {
  if (title) return title
  if (titleSubject) return ttc1("Loading [X]", titleSubject)
  return ttc("Loading...")
}
