import type { SocialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { socialProviderButtonProps } from "#src/auth/ui/sign_in/social/SocialProviderButtonProps.ts"
import { urlAuthProvider } from "#src/auth/url/urlAuthProvider.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { capitalizeFirstLetter } from "#utils/text/capitalizeFirstLetter.js"

export interface SocialLoginButtonProps extends MayHaveClass {
  provider: SocialLoginProvider
}

export function SocialLoginButton(p: SocialLoginButtonProps) {
  const props = socialProviderButtonProps[p.provider]
  const { mdiIconPath } = props
  const currentUrl = urlSignInRedirectUrl()
  const text = "Sign in with " + capitalizeFirstLetter(p.provider)
  const url = urlAuthProvider(p.provider, currentUrl)
  return (
    <LinkButtonExternal
      href={url}
      icon={mdiIconPath}
      variant={buttonVariant.outline}
      class={p.class}
      aria-label={text}
    >
      {text}
    </LinkButtonExternal>
  )
}
