import type { Component } from "solid-js"
import { omit } from "solid-js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

export interface CodeBlockProps extends ComponentProps<"pre"> {
  data: string | object | unknown[]
}

/** Preformatted block rendering text or JSON data. */
export const CodeBlock: Component<CodeBlockProps> = (p) => {
  const rest = omit(p, "class", "data")
  return (
    <pre
      class={cn("p-2 rounded-lg text-sm whitespace-pre-wrap wrap-anywhere bg-slate-100 dark:bg-slate-900", p.class)}
      {...rest}
    >
      {getCodeContent(p.data)}
    </pre>
  )
}

function getCodeContent(data: CodeBlockProps["data"]): string {
  if (typeof data === "string") return data
  return JSON.stringify(data, null, 2)
}
