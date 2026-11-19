import { onSettled as onMount } from "solid-js"
import { signInLogic } from "#src/auth/ui/sign_in/logic/signInLogic.ts"

export function signInPageLoaderStateCreate() {
  onMount(() => {
    signInLogic()
  })

  return {}
}
