import { ttc } from "#src/app/i18n/ttc.ts"
import { SignInPageContent } from "#src/auth/ui/sign_in/page/SignInPageContent.tsx"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"

interface SignInPageContent2Props extends MayHaveClass, MayHaveInnerClass {}

export function SignInPage(p: SignInPageContent2Props) {
  return (
    <LayoutWrapperDemo title={ttc("Sign In")}>
      <SignInPageContent class={cn(p.class, p.innerClass)} />
    </LayoutWrapperDemo>
  )
}
