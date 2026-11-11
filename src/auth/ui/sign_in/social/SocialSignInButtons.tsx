import { mdiGithub } from "@adaptive-ds/mdi/mdiGithub.js"
import { mdiGoogle } from "@adaptive-ds/mdi/mdiGoogle.js"
import { socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { urlAuthProvider } from "#src/auth/url/urlAuthProvider.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { capitalizeFirstLetter } from "#utils/text/capitalizeFirstLetter.js"

interface SocialSignInButtonProps extends MayHaveClass {
  provider: keyof typeof socialLoginProvider
}

function SocialSignInButton(p: SocialSignInButtonProps) {
  const providerConfig = socialLoginProvider[p.provider]
  const currentUrl = urlSignInRedirectUrl()
  const url = urlAuthProvider(p.provider, currentUrl)
  const iconPath = p.provider === "google" ? mdiGoogle : mdiGithub
  const text = `Sign in with ${capitalizeFirstLetter(p.provider)}`

  return (
    <LinkButtonExternal
      href={url}
      icon={iconPath}
      variant={buttonVariant.filledIndigo}
      class={classMerge(
        "justify-start",
        p.provider === "google" ? "bg-red-500 hover:bg-red-600" : "bg-gray-800 hover:bg-gray-900",
        "text-white",
      )}
      aria-label={text}
    >
      {text}
    </LinkButtonExternal>
  )
}

export function SocialSignInButtons() {
  return (
    <div class="space-y-4">
      <SocialSignInButton provider="google" />
      <SocialSignInButton provider="github" />
    </div>
  )
}
