import { ttc } from "#src/app/i18n/ttc.ts"
import { LayoutWrapperAuth } from "#src/app/layout/LayoutWrapperAuth.tsx"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavUserProfile } from "#src/app/nav/NavUserProfile.tsx"
import { userSessionGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { urlUserProfileMe, urlUserProfileMeEdit } from "#src/auth/url/pageRouteAuth.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import { cn } from "cn"
import { UserProfileMeEditForm } from "./UserProfileMeEditForm.js"
import { userProfileMeEditFormStateManagement } from "./userProfileMeEditFormState.js"
import { userProfileMeEditViewStateCreate } from "./userProfileMeEditViewStateCreate.ts"

export function UserProfileMeEditPage() {
  return (
    <LayoutWrapperAuth>
      <PageWrapper>
        <NavUserProfile
          childrenLeft={
            <>
              <NavBreadcrumbSeparator />
              <NavLinkButton href={urlUserProfileMe()} isActive={false}>
                {ttc("My Profile")}
              </NavLinkButton>
              <NavBreadcrumbSeparator />
              <NavLinkButton href={urlUserProfileMeEdit()} isActive={true}>
                {ttc("Edit")}
              </NavLinkButton>
            </>
          }
        />
        <UserProfileMeEditView profile={userSessionGet().profile} />
      </PageWrapper>
    </LayoutWrapperAuth>
  )
}

export function UserProfileMeEditView(p: {
  profile: Pick<ReturnType<typeof userSessionGet>["profile"], "name" | "bio" | "url">
  onSave?: (sm: ReturnType<typeof userProfileMeEditFormStateManagement>) => void
  cancelHref?: string
}) {
  const state = userProfileMeEditViewStateCreate(() => p)

  return (
    <div class={cn("max-w-4xl mx-auto px-4 py-8")}>
      <h1 class="text-3xl font-bold mb-4">{ttc("Edit Profile")}</h1>
      <UserProfileMeEditForm sm={state.sm} onSave={p.onSave} cancelHref={p.cancelHref} />
    </div>
  )
}
