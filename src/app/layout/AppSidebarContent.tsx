import { mdiAccountOutline } from "@adaptive-ds/mdi/mdiAccountOutline.js"
import { mdiCogOutline } from "@adaptive-ds/mdi/mdiCogOutline.js"
import { mdiLogout } from "@adaptive-ds/mdi/mdiLogout.js"
import { Link } from "@tanstack/solid-router"
import { For, type JSX, Show } from "solid-js"
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

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "?"
}

export function AppSidebarContent(p: {
  state: AppShellState
  headerAction?: JSX.Element
  /** Desktop icon rail. Only the desktop shell passes this; the mobile drawer omits it and always renders expanded. */
  collapsed?: () => boolean
}) {
  const isCollapsed = () => p.collapsed?.() ?? false
  return (
    <div class="flex min-h-full flex-1 flex-col gap-6">
      <div class={`flex items-center gap-2 ${isCollapsed() ? "justify-center" : "justify-between"}`}>
        <Show when={!isCollapsed()}>
          <LogoImageText
            to={urlOverview()}
            logoText={appNameClient()}
            logoTextClass="text-lg font-semibold"
            class="focus-ring min-w-0 px-2"
          />
        </Show>
        {p.headerAction}
      </div>

      <nav aria-label={ttt("Main navigation")} class="pt-5">
        <Show when={!isCollapsed()}>
          <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            {ttt("Navigation")}
          </p>
        </Show>
        <ul class="flex flex-col gap-1">
          <For each={p.state.navigation()}>
            {(item) => (
              <li>
                <Link
                  to={item.href}
                  onClick={p.state.profileClose}
                  aria-current={p.state.activeNavigationHref() === item.href ? "page" : undefined}
                  title={isCollapsed() ? item.label : undefined}
                  aria-label={isCollapsed() ? item.label : undefined}
                  class={`focus-ring flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
                    p.state.activeNavigationHref() === item.href
                      ? "bg-brand-soft text-brand-accent"
                      : "text-content-muted hover:bg-surface-muted hover:text-content"
                  }${isCollapsed() ? " justify-center px-2" : ""}`}
                >
                  <Icon path={item.icon} class="size-5 shrink-0" />
                  <Show when={!isCollapsed()}>
                    <span class="truncate">{item.label}</span>
                  </Show>
                </Link>
              </li>
            )}
          </For>
        </ul>
      </nav>

      <footer class="mt-auto pt-5">
        <Show when={p.state.user()}>
          {(user) => (
            <CorvuPopover
              buttonChildren={
                <Show
                  when={!isCollapsed()}
                  fallback={
                    <span title={user().profile.name} aria-label={user().profile.name} class="flex items-center justify-center">
                      <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-content">
                        {initialsOf(user().profile.name)}
                      </span>
                    </span>
                  }
                >
                  <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-content">
                    {initialsOf(user().profile.name)}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-left text-sm font-semibold">{user().profile.name}</span>
                </Show>
              }
              variant="ghost"
              class={
                isCollapsed()
                  ? "min-h-11 w-full justify-center rounded-control bg-surface-base/80 p-2 dark:bg-slate-800/60"
                  : "min-h-11 w-full justify-start gap-3 rounded-control bg-surface-base/80 p-3 text-left dark:bg-slate-800/60"
              }
              innerClass="w-max min-w-64 max-w-[calc(100vw-16px)]"
            >
              <div class="flex flex-col gap-4">
                <div class="min-w-0">
                  <p class="m-0 truncate text-sm font-semibold">{user().profile.name}</p>
                  <p class="m-0 truncate text-xs text-content-muted">{user().profile.email ?? "—"}</p>
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
                    onClick={p.state.logout}
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
