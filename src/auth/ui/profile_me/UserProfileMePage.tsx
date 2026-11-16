import { mdiKeyOutline } from "@adaptive-ds/mdi/mdiKeyOutline.js"
import { mdiLocationExit } from "@adaptive-ds/mdi/mdiLocationExit.js"
import { mdiLockReset } from "@adaptive-ds/mdi/mdiLockReset.js"
import { mdiSquareEditOutline } from "@adaptive-ds/mdi/mdiSquareEditOutline.js"
import { Link } from "@tanstack/solid-router"
import { Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { LayoutWrapperAuth } from "#src/app/layout/LayoutWrapperAuth.tsx"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavUserProfile } from "#src/app/nav/NavUserProfile.tsx"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import { UserProfileForm } from "#src/auth/ui/profile/UserProfileForm.tsx"
import {
  type UserProfileFormStateManagement,
  userProfileFormStateManagement,
} from "#src/auth/ui/profile/userProfileFormState.ts"
import { userSessionGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { urlUserProfileMe, urlUserProfileMeApiKeys, urlUserProfileMeEdit } from "#src/auth/url/pageRouteAuth.ts"
import { orgNameGet } from "#src/org/org_ui/orgNameRecordSignal.ts"
import { urlOrgLeave, urlOrgView } from "#src/org/org_url/urlOrg.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { capitalizeFirstLetter } from "#utils/text/capitalizeFirstLetter.js"
import { userProfileMeViewStateCreate } from "./userProfileMeViewStateCreate.ts"

export function UserProfileMePage() {
  return (
    <LayoutWrapperAuth>
      <PageWrapper>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <NavUserProfile
            class="mb-0"
            childrenLeft={
              <>
                <NavBreadcrumbSeparator />
                <NavLinkButton href={urlUserProfileMe()} isActive={true}>
                  {ttc("My Profile")}
                </NavLinkButton>
              </>
            }
          />
          <div class="flex items-center gap-2">
            <LinkButtonInternal
              to={urlUserProfileMeApiKeys()}
              icon={mdiKeyOutline}
              variant={buttonVariant.outline}
              class="min-h-9 gap-2 text-sm"
            >
              {ttc("API Keys")}
            </LinkButtonInternal>
            <LinkButtonInternal
              to={urlUserProfileMeEdit()}
              icon={mdiSquareEditOutline}
              variant={buttonVariant.outline}
              class="min-h-9 gap-2 text-sm"
            >
              {ttc("Edit Profile")}
            </LinkButtonInternal>
          </div>
        </div>
        <UserProfileMeView profile={userSessionGet().profile} />
        {/* <PageContent /> */}
      </PageWrapper>
    </LayoutWrapperAuth>
  )
}

function PageContent1() {
  const mode = formMode.view
  const sm: UserProfileFormStateManagement = userProfileFormStateManagement(mode, {})
  sm.loadData(userSessionGet().profile)
  return <UserProfileForm sm={sm} mode={mode} class="max-w-4xl mx-auto" />
}

export function UserProfileMeView(p: {
  profile: UserProfile
  hrefs?: { image: string; edit: string; email: string; password: string; apiKeys: string }
}) {
  const state = userProfileMeViewStateCreate(() => p)
  return (
    <div class={cn("max-w-2xl mx-auto", "space-y-6")}>
      <ProfileSectionImage image={p.profile.image} name={p.profile.name} href={state.hrefs().image} demo={!!p.hrefs} />
      <ProfileSectionInfo userProfile={p.profile} editHref={state.hrefs().edit} demo={!!p.hrefs} />
      <ProfileSectionEmail email={p.profile.email} emailHref={state.hrefs().email} />
      <ProfileSectionOrg orgHandle={p.profile.orgHandle} orgRole={p.profile.orgRole} demo={!!p.hrefs} />
      <ProfileSectionActions passwordHref={state.hrefs().password} apiKeysHref={state.hrefs().apiKeys} />
    </div>
  )
}

interface ProfileSectionImageProps extends MayHaveClass {
  image?: string
  name: string
  href: string
  demo?: boolean
}

function ProfileSectionImage(p: ProfileSectionImageProps) {
  return (
    <div class="flex justify-center -mb-7">
      <Dynamic
        component={p.demo ? Link : "a"}
        to={p.demo ? p.href : undefined}
        href={p.href}
        class={cn("group relative w-32 h-32 rounded-full overflow-hidden border-4 border-border", "z-10", p.class)}
      >
        {p.image ? (
          <img src={p.image} alt={ttc("Profile picture")} class="w-full h-full object-cover" />
        ) : (
          <div class="w-full h-full bg-hover flex items-center justify-center">
            <span class="text-3xl font-bold text-muted-foreground">{p.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon path={mdiSquareEditOutline} class="w-8 h-8 fill-white text-white" />
        </div>
      </Dynamic>
    </div>
  )
}

function ProfileSectionInfo(p: {
  userProfile: Pick<UserProfile, "name" | "bio" | "url">
  editHref: string
  demo?: boolean
}) {
  return (
    <section id="info" class="rounded-md border border-border bg-background p-4 sm:p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-foreground">{p.userProfile.name}</h2>
        <LinkButtonIconOnlyInternal to={p.editHref} icon={mdiSquareEditOutline} variant={buttonVariant.link} />
      </div>

      {p.userProfile.bio && <p class="text-sm text-muted-foreground whitespace-pre-wrap">{p.userProfile.bio}</p>}

      {p.userProfile.url && !p.demo && (
        <a
          href={p.userProfile.url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline break-all"
        >
          {p.userProfile.url}
        </a>
      )}
    </section>
  )
}

function ProfileSectionEmail(p: { email?: string; emailHref: string }) {
  return (
    <section id="email" class="rounded-md border border-border bg-background p-4 sm:p-5">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-muted-foreground font-medium">{ttc("Email")}</span>
          <p class="text-sm">{p.email ?? ""}</p>
        </div>
        <LinkButtonIconOnlyInternal to={p.emailHref} icon={mdiSquareEditOutline} variant={buttonVariant.link} />
      </div>
    </section>
  )
}

function ProfileSectionOrg(p: { orgHandle?: string; orgRole?: string; demo?: boolean }) {
  return (
    <section id="org" class="rounded-md border border-border bg-background p-4 sm:p-5">
      <Show
        when={p.orgHandle}
        fallback={
          <div>
            <span class="text-xs text-muted-foreground font-medium">{ttc("Organization")}</span>
            <p class="text-sm">{ttc("None")}</p>
            <p class="text-sm text-muted-foreground mt-1">{ttc("You are not part of any organization")}</p>
          </div>
        }
      >
        {(orgHandle) => {
          const orgName = orgNameGet(orgHandle())
          return (
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span class="text-xs text-muted-foreground font-medium">{ttc("Organization")}</span>
                <br />
                <div class="flex flex-wrap gap-2">
                  <LinkButtonInternal
                    to={p.demo ? pageDemoHref("/org/:orgHandle", { orgHandle: orgHandle() }) : urlOrgView(orgHandle())}
                    variant={buttonVariant.link}
                    class="pl-0"
                  >
                    {orgName ?? orgHandle()}
                  </LinkButtonInternal>
                  {p.orgRole && <p class="text-sm text-muted-foreground py-2">{capitalizeFirstLetter(p.orgRole)}</p>}
                </div>
              </div>
              <Show when={!p.demo}>
                <LinkButtonIconOnlyInternal
                  to={urlOrgLeave(orgHandle())}
                  icon={mdiLocationExit}
                  variant={buttonVariant.link}
                />
              </Show>
            </div>
          )
        }}
      </Show>
    </section>
  )
}

function ProfileSectionActions(p: { passwordHref: string; apiKeysHref: string }) {
  return (
    <section id="actions" class="rounded-md border border-border bg-background p-4 sm:p-5 space-y-4">
      <h3 class="text-sm font-semibold">{ttc("Account Actions")}</h3>
      <div class={classArr("flex flex-wrap gap-3")}>
        <LinkButtonInternal
          to={p.apiKeysHref}
          icon={mdiKeyOutline}
          variant={buttonVariant.outline}
          class="min-h-10 justify-start gap-2"
        >
          {ttc("API Keys")}
        </LinkButtonInternal>
        <LinkButtonInternal
          to={p.passwordHref}
          icon={mdiLockReset}
          variant={buttonVariant.outline}
          class="min-h-10 justify-start gap-2"
        >
          {ttc("Change Password")}
        </LinkButtonInternal>
      </div>
    </section>
  )
}
