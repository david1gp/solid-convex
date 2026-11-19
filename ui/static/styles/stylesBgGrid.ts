import { type JSX } from "@solidjs/web";

export const stylesBgGrid = {
  "background-image": `linear-gradient(to right, #aeaeae69 1px, transparent 1px),
        linear-gradient(to bottom, #aeaeae69 1px, transparent 1px)`,
  "background-size": "16px 16px",
} as const satisfies JSX.CSSProperties
