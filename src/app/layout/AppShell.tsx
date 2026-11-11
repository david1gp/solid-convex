import type { JSX } from "solid-js"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { appNameClient } from "#src/app/text/appName.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Sidebar } from "#ui/interactive/sidebar/Sidebar.jsx"
import { SidebarToggle } from "#ui/interactive/sidebar/SidebarToggle.jsx"
import { LogoImageText } from "#ui/static/logo/LogoImageText.jsx"
import { AppSidebarCollapseToggle } from "./AppSidebarCollapseToggle.tsx"
import { AppSidebarContent } from "./AppSidebarContent.tsx"
import {
  appSidebarCollapsedInit,
  appSidebarCollapsedSignal,
  appSidebarCollapsedToggle,
} from "./appSidebarCollapsedSignal.ts"
import { appShellStateCreate } from "./appShellStateCreate.ts"

/** Eventoren-style app shell: sidebar navigation with user popover, no top navbar. */
export function AppShell(p: { children: JSX.Element }) {
  const state = appShellStateCreate()
  appSidebarCollapsedInit()
  const collapsed = () => appSidebarCollapsedSignal.get()

  return (
    <div class="flex min-h-dvh bg-surface-base text-content">
      <Sidebar
        state={state.sidebarState}
        title="Main navigation"
        titleClass="sr-only"
        desktopChildren={
          <aside
            class={`sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto bg-surface-muted/50 p-4 md:flex dark:bg-slate-900/50 ${
              collapsed() ? "w-[76px]" : "w-64"
            }`}
          >
            <AppSidebarContent
              state={state}
              collapsed={collapsed}
              headerAction={
                <AppSidebarCollapseToggle collapsed={collapsed} onToggle={appSidebarCollapsedToggle} />
              }
            />
          </aside>
        }
        mobileChildren={<AppSidebarContent state={state} />}
      />
      <div class="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar: logo + sidebar toggle (part of the sidebar pattern). */}
        <div class="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border-subtle bg-surface-base/90 px-4 py-2 backdrop-blur-xl md:hidden">
          <LogoImageText to={urlOverview()} logoText={appNameClient()} logoTextClass="text-base font-semibold" />
          <SidebarToggle {...state.sidebarState} variant={buttonVariant.ghost} />
        </div>
        <div class="min-w-0 flex-1">{p.children}</div>
      </div>
    </div>
  )
}
