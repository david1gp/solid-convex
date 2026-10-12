import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { appNameClient } from "#src/app/text/appName.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Sidebar } from "#ui/interactive/sidebar/Sidebar.jsx"
import { SidebarToggle } from "#ui/interactive/sidebar/SidebarToggle.jsx"
import { LogoImageText } from "#ui/static/logo/LogoImageText.jsx"
import { AppSidebarContent } from "./AppSidebarContent.tsx"
import { appShellStateCreate } from "./appShellStateCreate.ts"

/** Eventoren-style app shell: sidebar navigation with user popover, no top navbar. */
export function AppShell(p: { children: JSX.Element }) {
  const state = appShellStateCreate()

  return (
    <div class="flex min-h-dvh bg-surface-base text-content">
      <Sidebar
        state={state.sidebarState}
        title="Main navigation"
        titleClass="sr-only"
        desktopChildren={
          <aside class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-surface-muted/50 p-4 md:flex dark:bg-slate-900/50">
            <AppSidebarContent state={state} />
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
        <Show when={!state.sidebarState.isMobile.get()}>
          <SidebarToggle
            {...state.sidebarState}
            variant="outline"
            class="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20 min-h-12 min-w-12 rounded-xl border-0 bg-white/80 text-content shadow-sm shadow-slate-900/10 backdrop-blur-xl hover:bg-white/90 max-md:hidden dark:bg-slate-900/80 dark:shadow-black/20 dark:hover:bg-slate-800/90"
          />
        </Show>
      </div>
    </div>
  )
}
