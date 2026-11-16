import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import styles from "./LoaderSpin4Square.module.css"

/**
 * https://dev.to/afif/i-made-100-css-loaders-for-your-next-project-4eje
 */
export function LoaderSpin4Square(p: MayHaveClass) {
  return <div class={cn(p.class, styles.LoaderSpin4Square)} />
}
