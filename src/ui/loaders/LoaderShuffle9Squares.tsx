import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import styles from "./LoaderShuffle9Squares.module.css"

/**
 * https://dev.to/afif/adding-100-css-loaders-to-the-collection-of-500-css-loaders-2a3p
 */
export function LoaderShuffle9Squares(p: MayHaveClass) {
  return <div class={cn(p.class, styles.LoaderShuffle9Squares)} />
}
