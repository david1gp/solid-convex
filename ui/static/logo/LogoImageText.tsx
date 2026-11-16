import type { ComponentProps } from "solid-js"
import { type ButtonVariant, buttonVariant } from "#ui/interactive/button/buttonCva.js"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Img } from "#ui/static/img/Img.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface LogoImageTextProps extends MayHaveClass {
  /** Typed internal route to navigate to; defaults to `"/"`. */
  to?: ComponentProps<typeof LinkButtonInternal>["to"]
  logoUrl?: string
  imageClass?: string
  logoText: string
  logoTextClass?: string
  variant?: ButtonVariant
}

/** Clickable logo image link with accompanying text. */
export function LogoImageText(p: LogoImageTextProps) {
  return (
    <LinkButtonInternal to={p.to ?? "/"} variant={p.variant ?? buttonVariant.ghost} class={cn("flex gap-1.5", p.class)}>
      <Img src={p.logoUrl ?? "/logo.svg"} alt={"Logo"} zoomIn={false} class={cn("size-7 mr-1", p.imageClass)} />
      <span class={cn("text-2xl font-bold", p.logoTextClass)}>{p.logoText}</span>
    </LinkButtonInternal>
  )
}
