import { omit } from "solid-js"
import { LinkLikeNavText } from "#src/app/nav/links/LinkLikeNavText.tsx"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { appNameClient } from "#src/app/text/appName.ts"
import { LogoImageText } from "#ui/static/logo/LogoImageText.jsx"
import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface NavAuthProps extends MayHaveChildren, MayHaveClass {
  title: string
}

/** Slim centered header for unauthenticated auth pages (no sidebar there). */
export function NavAuth(p: NavAuthProps) {
  const rest = omit(p, "title", "children")
  return (
    <header class={cn("mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 pt-10", rest.class)}>
      <LogoImageText to={urlOverview()} logoText={appNameClient()} logoTextClass="text-xl font-semibold" />
      <LinkLikeNavText isActive={false} class="p-0 text-lg">
        {p.title}
      </LinkLikeNavText>
      {p.children}
    </header>
  )
}
