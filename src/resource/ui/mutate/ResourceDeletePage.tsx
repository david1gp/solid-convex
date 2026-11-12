import { useParams } from "@tanstack/solid-router"
import { For, Match, Show, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavResource } from "#src/app/nav/NavResource.tsx"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { resourceDeletePageStateCreate } from "#src/resource/ui/mutate/resourceDeletePageStateCreate.ts"
import { urlResourceRemove } from "#src/resource/url/urlResource.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export interface ResourceDeletePageProps {
  demo?: { resourceId: string; resource: ResourceModel; form: ResourceFormStateManagement }
}

export function ResourceDeletePage(p: ResourceDeletePageProps) {
  const params = useParams({ strict: false })
  const resourceId = () => p.demo?.resourceId ?? params().resourceId

  const state = resourceDeletePageStateCreate({
    resourceId: () => resourceId() ?? "",
    demo: () => p.demo,
  })

  return (
    <Switch>
      <Match when={!resourceId()}>
        <ErrorPage title={ttc("Missing :resourceId in path")} />
      </Match>
      <Match when={resourceId()}>
        <PageWrapper>
          <Show when={!p.demo}>
            <NavResource
              getResourcePageTitle={() => `Delete ${state.title() || "Resource"}`}
              resourceId={resourceId()!}
            >
              <NavLinkButton href={urlResourceRemove(resourceId()!)} isActive={true}>
                {ttc("Remove")}
              </NavLinkButton>
            </NavResource>
          </Show>

          <div class="max-w-xl mx-auto space-y-6 pt-6">
            <header class="space-y-1">
              <h1 class="text-2xl font-bold text-destructive">Delete Resource</h1>
              <p class="text-sm text-muted-foreground">Review the exact data effects and confirm permanent deletion.</p>
            </header>

            <Show when={state.isLoading()}>
              <div class="rounded-md border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground space-y-2">
                <p class="animate-pulse font-medium">Loading deletion preview…</p>
                <p class="text-xs">Checking linked file relationships and storage status.</p>
              </div>
            </Show>

            <Show when={state.errorMessage()}>
              {(err) => (
                <div
                  role="alert"
                  class="rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
                >
                  <p class="font-semibold">Unable to load deletion preview</p>
                  <p class="mt-1 text-xs">{err()}</p>
                </div>
              )}
            </Show>

            <Show when={!state.isLoading() && !state.errorMessage()}>
              <div role="alert" class="rounded-md border border-warning/20 bg-warning-soft px-4 py-3 text-sm space-y-2">
                <div class="flex items-start gap-2">
                  <span class="text-lg font-bold select-none leading-none" aria-hidden="true">
                    ⚠️
                  </span>
                  <div class="space-y-1 flex-1">
                    <h2 class="text-sm font-semibold text-warning leading-tight">Legacy Standalone Deletion Warning</h2>
                    <p class="text-sm text-muted-foreground leading-relaxed">
                      This action permanently removes the resource record and unlinks its associated files. Attached
                      file records and R2 storage objects are NOT deleted and remain intact.
                    </p>
                    <p class="text-xs font-semibold text-warning">
                      Unlinking is permanent, but file storage is preserved.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Exact Data Effect
                  </h3>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <For each={state.effects()}>
                    {(item) => (
                      <div class="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                        <div class="flex flex-col">
                          <span class="text-muted-foreground">{item.label}</span>
                          <span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                            {item.status}
                          </span>
                        </div>
                        <span class="font-semibold tabular-nums text-foreground">{item.count}</span>
                      </div>
                    )}
                  </For>
                </div>

                <Show when={state.isTruncated()}>
                  <p class="text-xs text-warning font-semibold" role="alert">
                    * Warning: Linked file count exceeds limit (100) and was truncated. Deletion is blocked to prevent
                    untracked relationships.
                  </p>
                </Show>
              </div>

              <div class="space-y-2 pt-2 border-t border-border">
                <label for="resource-delete-confirm-input" class="block text-xs font-semibold text-foreground">
                  Type <strong class="font-bold underline">{state.title() || "DELETE"}</strong> or{" "}
                  <strong class="font-bold underline">DELETE</strong> to confirm:
                </label>
                <input
                  id="resource-delete-confirm-input"
                  type="text"
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-destructive"
                  placeholder={state.confirmationPlaceholder()}
                  value={state.typedConfirmation.get()}
                  onInput={(e) => state.typedConfirmation.set(e.currentTarget.value)}
                  disabled={state.isSubmitting.get()}
                />
                <Show when={state.typedConfirmation.get().length > 0 && !state.isTypedConfirmationValid()}>
                  <p class="text-xs text-destructive">Input does not match the name or "DELETE".</p>
                </Show>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant={buttonVariant.outline}
                  onClick={state.onCancel}
                  disabled={state.isSubmitting.get()}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={buttonVariant.filledRed}
                  onClick={state.onConfirm}
                  disabled={!state.canConfirm()}
                >
                  {state.isSubmitting.get() ? "Deleting…" : "Permanently Delete"}
                </Button>
              </div>
            </Show>
          </div>
        </PageWrapper>
      </Match>
    </Switch>
  )
}
