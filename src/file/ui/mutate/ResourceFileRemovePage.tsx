import { useParams } from "@tanstack/solid-router"
import { For, Match, Show, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavFile } from "#src/app/nav/NavFile.tsx"
import { resourceFileRemovePageStateCreate } from "#src/file/ui/mutate/resourceFileRemovePageStateCreate.ts"
import { urlFileRemove } from "#src/file/url/urlFile.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ResourceFileRemovePage() {
  const params = useParams({ strict: false })
  const resourceId = () => params().resourceId
  const fileId = () => params().fileId

  const state = resourceFileRemovePageStateCreate({
    resourceId: () => resourceId() ?? "",
    fileId: () => fileId() ?? "",
  })

  return (
    <Switch>
      <Match when={!resourceId()}>
        <ErrorPage title={ttc("Missing :resourceId in path")} />
      </Match>
      <Match when={!fileId()}>
        <ErrorPage title={ttc("Missing :fileId in path")} />
      </Match>
      <Match when={true}>
        <PageWrapper>
          <NavFile
            resourceId={resourceId()!}
            fileId={fileId()!}
            getFilePageTitle={() => `Delete ${state.displayName() || "File"}`}
          >
            <NavLinkButton href={urlFileRemove(resourceId()!, fileId()!)} isActive={true}>
              {ttc("Remove")}
            </NavLinkButton>
          </NavFile>

          <div class="max-w-xl mx-auto space-y-6 pt-6">
            <header class="space-y-1">
              <h1 class="text-2xl font-bold text-destructive">Delete File</h1>
              <p class="text-sm text-muted-foreground">Review the exact data effects and confirm permanent deletion.</p>
            </header>

            <Show when={state.isLoading()}>
              <div class="rounded-lg border border-border-subtle bg-muted/30 p-6 text-center text-sm text-muted-foreground space-y-2">
                <p class="animate-pulse font-medium">Loading deletion preview…</p>
                <p class="text-xs">Checking file metadata and storage status.</p>
              </div>
            </Show>

            <Show when={state.errorMessage()}>
              {(err) => (
                <div
                  role="alert"
                  class="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                >
                  <p class="font-semibold">Unable to load deletion preview</p>
                  <p class="mt-1 text-xs">{err()}</p>
                </div>
              )}
            </Show>

            <Show when={!state.isLoading() && !state.errorMessage()}>
              <div
                role="alert"
                class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 space-y-2"
              >
                <div class="flex items-start gap-2">
                  <span class="text-lg font-bold select-none leading-none" aria-hidden="true">
                    ⚠️
                  </span>
                  <div class="space-y-1 flex-1">
                    <h2 class="text-sm font-bold text-amber-800 dark:text-amber-300 leading-tight">
                      Legacy Standalone Deletion Warning
                    </h2>
                    <p class="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                      This action permanently removes the file metadata record and unlinks it from the resource. The
                      underlying R2 storage object is NOT deleted and remains intact.
                    </p>
                    <p class="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Metadata removal is permanent, but file storage is preserved.
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
                      <div class="flex items-center justify-between rounded-md border border-border-subtle bg-muted/40 px-3 py-2 text-sm">
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
              </div>

              <div class="space-y-2 pt-2 border-t border-border-subtle">
                <label for="file-delete-confirm-input" class="block text-xs font-semibold text-foreground">
                  Type <strong class="font-bold underline">{state.displayName() || "DELETE"}</strong> or{" "}
                  <strong class="font-bold underline">DELETE</strong> to confirm:
                </label>
                <input
                  id="file-delete-confirm-input"
                  type="text"
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-destructive"
                  placeholder={state.confirmationPlaceholder()}
                  value={state.typedConfirmation.get()}
                  onInput={(e) => state.typedConfirmation.set(e.currentTarget.value)}
                  disabled={state.isSubmitting.get()}
                />
                <Show when={state.typedConfirmation.get().length > 0 && !state.isTypedConfirmationValid()}>
                  <p class="text-xs text-destructive">Input does not match the name or "DELETE".</p>
                </Show>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
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
