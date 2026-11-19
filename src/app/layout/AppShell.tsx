import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { appNameClient } from "#src/app/text/appName.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Sidebar } from "#ui/interactive/sidebar/Sidebar.jsx"
import { SidebarToggle } from "#ui/interactive/sidebar/SidebarToggle.jsx"
import { LogoImageText } from "#ui/static/logo/LogoImageText.jsx"
import { ttt } from "#ui/i18n/ttt.ts"
import { AppSidebarCollapseToggle } from "./AppSidebarCollapseToggle.tsx"
import { AppSidebarContent, type AppSidebarDemoUser } from "./AppSidebarContent.tsx"
import {
  appSidebarCollapsedInit,
  appSidebarCollapsedSignal,
  appSidebarCollapsedToggle,
} from "./appSidebarCollapsedSignal.ts"
import { appShellStateCreate } from "./appShellStateCreate.ts"
import { type JSX } from "@solidjs/web"

/** Eventoren-style app shell: sidebar navigation with user popover, no top navbar. */
export function AppShell(p: {
  children: JSX.Element
  /** Demo-only fake user, passed through to the sidebar; the real app never passes it. */
  user?: () => AppSidebarDemoUser | undefined
  /** Demo-only sign-out no-op, passed through to the sidebar. */
  onSignOut?: () => void
  /** Demo-only nav-highlight override, passed through to the sidebar. */
  activeHref?: string
}) {
  const state = appShellStateCreate()
  appSidebarCollapsedInit()
  const collapsed = () => appSidebarCollapsedSignal.get()

  return (
    <div class="flex min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:text-foreground"
      >
        {ttt("Skip to content")}
      </a>
      <Sidebar
        state={state.sidebarState}
        title="Main navigation"
        titleClass="sr-only"
        desktopChildren={
          <aside
            class={`sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface md:flex${collapsed() ? " md:w-12" : ""}`}
          >
            <AppSidebarContent
              state={state}
              collapsed={collapsed}
              user={p.user}
              onSignOut={p.onSignOut}
              activeHref={p.activeHref}
              headerAction={<AppSidebarCollapseToggle collapsed={collapsed} onToggle={appSidebarCollapsedToggle} />}
            />
          </aside>
        }
        mobileChildren={
          <AppSidebarContent state={state} user={p.user} onSignOut={p.onSignOut} activeHref={p.activeHref} />
        }
      />
      <div class="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar: logo + sidebar toggle (part of the sidebar pattern). */}
        <div class="sticky top-0 z-20 flex h-11 items-center justify-between gap-2 border-b border-border bg-surface px-4 md:hidden">
          <LogoImageText
            to={urlOverview()}
            logoText={appNameClient()}
            logoTextClass="truncate text-sm font-semibold"
            class="min-w-0 flex-1"
          />
          <SidebarToggle {...state.sidebarState} variant={buttonVariant.ghost} />
        </div>
        <div id="main-content" class="min-w-0 flex-1">
          {p.children}
        </div>
      </div>
    </div>
  )
}
