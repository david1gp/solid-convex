import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { appNameClient } from "#src/app/text/appName.ts"
import { type AuthLegalAgreeVariant, authLegalAgreeVariant } from "#src/auth/ui/sign_in/legal/authLegalAgreeVariant.tsx"
import { AuthLegalAgree } from "#src/auth/ui/sign_in/legal/AuthLegalAgree.tsx"
import { LogoImageText } from "#ui/static/logo/LogoImageText.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"

export interface AuthSplitLayoutProps extends MayHaveChildrenAndClass {
  legalVariant?: AuthLegalAgreeVariant
}

/** Shared offers-style split layout for all auth pages (no single wrapper existed; auth routes render standalone).
 * Dark panel uses arbitrary bg-[#191919]/text-[#f7f7f5] tokens: no house token equals #191919 in light mode
 * (it is only the dark-mode background), and the panel must stay dark in both themes.
 * Right side uses bg-surface so it adapts via tokens. Normal page scroll; the panel sticks on lg. */
export function AuthSplitLayout(p: AuthSplitLayoutProps) {
  return (
    <div class={classMerge("grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(360px,5fr)_7fr]", p.class)}>
      <aside class="flex flex-col gap-6 bg-[#191919] p-6 text-[#f7f7f5] lg:sticky lg:top-0 lg:h-dvh lg:p-10">
        <LogoImageText
          to={urlOverview()}
          logoText={appNameClient()}
          logoTextClass="text-xl font-semibold text-[#f7f7f5]"
          class="justify-start"
        />
        <div class="flex flex-col gap-3 lg:my-auto">
          <p class="text-xs font-semibold uppercase tracking-widest text-[#a09f9b]">{appNameClient()}</p>
          <p class="text-xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
            <span class="text-[#529de9]">Adaptive Convex Auth</span>
            <span>
              {" "}
              is a lightweight template for <span class="text-[#529de9]">Auth</span> built for{" "}
            </span>
            <span class="text-[#529de9]">Convex</span> and <span class="text-[#529de9]">Solid.js</span>
          </p>
        </div>
        <AuthLegalAgree variant={p.legalVariant ?? authLegalAgreeVariant.signIn} class="hidden text-xs lg:block" />
      </aside>
      <div class="bg-surface">
        <div class="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-8 lg:py-12">{p.children}</div>
      </div>
    </div>
  )
}
