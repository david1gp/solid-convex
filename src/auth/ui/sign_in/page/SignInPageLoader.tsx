import { lazy } from "solid-js"
import { signInPageLoaderStateCreate } from "#src/auth/ui/sign_in/page/signInPageLoaderStateCreate.ts"

export function SignInPageLoader() {
  signInPageLoaderStateCreate()
  return <SignInPageAsync />
}

const SignInPageAsync = lazy(() =>
  import("#src/auth/ui/sign_in/page/SignInPage.tsx").then((c) => ({
    default: c.SignInPage,
  })),
)
