import { mdiAccountOutline } from "@adaptive-ds/mdi/mdiAccountOutline.js"
import { mdiCogOutline } from "@adaptive-ds/mdi/mdiCogOutline.js"
import { mdiLogout } from "@adaptive-ds/mdi/mdiLogout.js"
import { Link } from "@tanstack/solid-router"
import { For, Show } from "solid-js"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { appNameClient } from "#src/app/text/appName.ts"
import { urlUserProfileMe, urlUserProfileMeEdit } from "#src/auth/url/pageRouteAuth.ts"
import { ttt } from "#ui/i18n/ttt.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { CorvuPopover } from "#ui/interactive/popover/CorvuPopover.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { LogoImageText } from "#ui/static/logo/LogoImageText.jsx"
import { AppThemeSegmentedControl } from "./AppThemeSegmentedControl.tsx"
import type { AppShellState } from "./appShellStateCreate.ts"
import { type JSX } from "@solidjs/web";

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "?"
}

/** Minimal session override for the no-auth shell demo; the real app never passes it. */
export interface AppSidebarDemoUser {
  readonly profile: { readonly name: string; readonly email?: string | null }
}

export function AppSidebarContent(p: {
  state: AppShellState
  headerAction?: JSX.Element
  /** Desktop icon rail. Only the desktop shell passes this; the mobile drawer omits it and always renders expanded. */
  collapsed?: () => boolean
  /** Demo-only fake user; defaults to the real session so the app is byte-identical. */
  user?: () => AppSidebarDemoUser | undefined
  /** Demo-only sign-out no-op; defaults to the real logout. */
  onSignOut?: () => void
  /** Demo-only nav-highlight override; when absent the location-derived item wins. */
  activeHref?: string
}) {
  const isCollapsed = () => p.collapsed?.() ?? false
  const user = () => p.user?.() ?? p.state.user()
  const activeHref = () => p.activeHref ?? p.state.activeNavigationHref()
  function signOut() {
    if (p.onSignOut) p.onSignOut()
    else p.state.logout()
  }
  return (
    <div class="flex min-h-0 flex-1 flex-col">
      <div
        class={`flex h-11 shrink-0 items-center gap-2 ${isCollapsed() ? "justify-center px-2" : "justify-between px-4"}`}
      >
        <Show when={!isCollapsed()}>
          <LogoImageText
            to={urlOverview()}
            logoText={appNameClient()}
            logoTextClass="truncate text-sm font-semibold"
            class="min-w-0 flex-1"
          />
        </Show>
        {p.headerAction}
      </div>

      <nav aria-label={ttt("Main navigation")} class="px-2 pt-2">
        <Show when={!isCollapsed()}>
          <p class="px-2 pb-1 text-xs font-semibold text-muted-foreground">{ttt("Navigation")}</p>
        </Show>
        <ul class="flex flex-col gap-1">
          <For each={p.state.navigation()}>
            {(item) => (
              <li>
                <Link
                  to={item.href}
                  onClick={p.state.profileClose}
                  aria-current={activeHref() === item.href ? "page" : undefined}
                  title={isCollapsed() ? item.label : undefined}
                  aria-label={isCollapsed() ? item.label : undefined}
                  class={`focus-ring flex h-7 items-center gap-2 rounded px-2 text-sm text-muted-foreground hover:bg-hover hover:text-foreground aria-[current=page]:bg-hover aria-[current=page]:font-medium aria-[current=page]:text-foreground${isCollapsed() ? " justify-center" : ""}`}
                >
                  <Icon path={item.icon} class="size-4 shrink-0 text-muted-foreground" />
                  <Show when={!isCollapsed()}>
                    <span class="truncate">{item.label}</span>
                  </Show>
                </Link>
              </li>
            )}
          </For>
        </ul>
      </nav>

      <footer class="mt-auto border-t border-border p-2">
        <Show when={user()}>
          {(user) => (
            <CorvuPopover
              buttonChildren={
                <Show
                  when={!isCollapsed()}
                  fallback={
                    <span
                      title={user().profile.name}
                      aria-label={user().profile.name}
                      class="flex items-center justify-center"
                    >
                      <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-hover text-xs font-semibold text-foreground">
                        {initialsOf(user().profile.name)}
                      </span>
                    </span>
                  }
                >
                  <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-hover text-xs font-semibold text-foreground">
                    {initialsOf(user().profile.name)}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-left text-sm font-semibold">{user().profile.name}</span>
                </Show>
              }
              variant="ghost"
              class={
                isCollapsed()
                  ? "w-full justify-center px-2 py-1 hover:bg-hover"
                  : "w-full justify-start gap-2 rounded px-2 py-1 text-left hover:bg-hover"
              }
              innerClass="w-max min-w-64 max-w-[calc(100vw-16px)]"
            >
              <div class="flex flex-col gap-4">
                <div class="min-w-0">
                  <p class="m-0 truncate text-sm font-semibold">{user().profile.name}</p>
                  <p class="m-0 truncate text-xs text-muted-foreground">{user().profile.email ?? "—"}</p>
                </div>
                <div class="flex flex-col gap-2">
                  <AppThemeSegmentedControl />
                  <LinkButtonInternal
                    to={urlUserProfileMe()}
                    icon={mdiAccountOutline}
                    variant={buttonVariant.outline}
                    class="min-h-11 w-full justify-start gap-2 no-underline hover:no-underline"
                  >
                    {ttt("Account")}
                  </LinkButtonInternal>
                  <LinkButtonInternal
                    to={urlUserProfileMeEdit()}
                    icon={mdiCogOutline}
                    variant={buttonVariant.outline}
                    class="min-h-11 w-full justify-start gap-2 no-underline hover:no-underline"
                  >
                    {ttt("Settings")}
                  </LinkButtonInternal>
                  <ButtonIcon
                    icon={mdiLogout}
                    variant={buttonVariant.outline}
                    onClick={signOut}
                    class="min-h-11 w-full justify-center gap-2"
                  >
                    {ttt("Sign out")}
                  </ButtonIcon>
                </div>
              </div>
            </CorvuPopover>
          )}
        </Show>
      </footer>
    </div>
  )
}
