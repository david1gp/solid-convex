import type { ComponentProps } from "@solidjs/web"

export type MayHaveChildren = { children?: ComponentProps<"button">["children"] }
