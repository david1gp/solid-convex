import { mdiAccountPlus } from "@adaptive-ds/mdi/mdiAccountPlus.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavAuth } from "#src/app/nav/NavAuth.tsx"
import { SignInPageContent } from "#src/auth/ui/sign_in/page/SignInPageContent.tsx"
import { SignUpButtonLink } from "#src/auth/ui/sign_in/page/SignUpButtonLink.tsx"
import { classesBgGray } from "#ui/classes/classesBg.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"

interface SignInPageContent2Props extends MayHaveClass, MayHaveInnerClass {}

export function SignInPage(p: SignInPageContent2Props) {
  return (
    <LayoutWrapperDemo title={ttc("Sign In")}>
      <div class={classArr("min-h-dvh w-full", classesBgGray, p.class)}>
        <NavAuth title={ttc("Sign In")}>
          <SignUpButtonLink variant={buttonVariant.link} icon={mdiAccountPlus} iconRight="" />
        </NavAuth>
        <SignInPageContent class={p.innerClass} />
      </div>
    </LayoutWrapperDemo>
  )
}
