import { type LoadingPageTexts, loadingPageTextsDefault } from "#ui/static/loaders/LoadingPageTexts.js"
import { RandomLoader } from "#ui/static/loaders/RandomLoader.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface LoadingPageProps extends MayHaveClass {
  loadingItem?: string
  texts?: LoadingPageTexts
}

/** Full-page loading state with heading and animated loader. */
export function LoadingPage(p: LoadingPageProps) {
  const texts = p.texts ?? loadingPageTextsDefault

  return (
    <div class={cn("flex w-full items-center justify-center", p.class)}>
      <div class={"flex flex-col items-center m-10"}>
        <h1 class={"text-3xl"}>{texts.loading(p.loadingItem)}</h1>
        <RandomLoader class={"m-4"} />
      </div>
    </div>
  )
}
