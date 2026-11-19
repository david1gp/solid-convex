import { For } from "solid-js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface PsProps extends MayHaveClass {
  text: string
}

export function Ps(p: PsProps) {
  return <For each={p.text.split("\n")}>{(line) => <p class={p.class}>{line}</p>}</For>
}
