import { isDevEnv } from "#src/utils/env/isDevEnv.ts"
import { classInvertBlack } from "#ui/static/img/classInvertBlack.ts"
import { Img } from "#ui/static/img/Img.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface RandomIllustrationFromArrProps extends MayHaveClass {
  images: string[]
  addIndex?: number
  alt: string
}

export function RandomIllustrationFromArr(p: RandomIllustrationFromArrProps) {
  const i = getIndex(p.images.length, p.addIndex)
  const src = p.images[i]
  if (!src) return null
  return (
    <Img
      alt={p.alt}
      src={src}
      class={cn(
        "select-none pointer-events-none", // ignore mouse
        classInvertBlack, // illustrations
        "w-full mx-auto", // w
        p.class,
      )}
    />
  )
}

function getIndex(max: number, addIndex = 0) {
  const date = new Date()
  const i = ((isDevEnv() ? date.getMilliseconds() : date.getHours()) + addIndex) % max
  return i
}
