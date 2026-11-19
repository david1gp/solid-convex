import { mdiCheckboxMarkedOutline } from "@adaptive-ds/mdi/mdiCheckboxMarkedOutline.js"
import { mdiChevronDown } from "@adaptive-ds/mdi/mdiChevronDown.js"
import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import { mdiContentCopy } from "@adaptive-ds/mdi/mdiContentCopy.js"
import { mdiPencil } from "@adaptive-ds/mdi/mdiPencil.js"
import { mdiPlus } from "@adaptive-ds/mdi/mdiPlus.js"
import { mdiRefresh } from "@adaptive-ds/mdi/mdiRefresh.js"
import { mdiTrashCanOutline } from "@adaptive-ds/mdi/mdiTrashCanOutline.js"
import { For, Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { userProfileMeApiKeysPageStateCreate } from "#src/auth/ui/profile_me/userProfileMeApiKeysPageStateCreate.ts"
import { DateView } from "#src/ui/date/DateView.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"

export function UserProfileMeApiKeysContent(p: { stateFactory: typeof userProfileMeApiKeysPageStateCreate }) {
  const state = p.stateFactory()
  return (
    <main class="max-w-2xl mx-auto space-y-6">
      <h1 class="text-3xl font-bold">{ttc("API Keys")}</h1>
      <p class="text-muted-foreground">
        {ttc("Use API keys for programmatic access. Keep credentials secret; they can only be shown once.")}
      </p>

      <Show when={state.credential()}>
        {(value) => (
          <section
            class="ph-no-capture rounded-md border border-border bg-background p-4 sm:p-5 space-y-3"
            aria-live="polite"
          >
            <h2 class="text-sm font-semibold">{ttc("Your new API key")}</h2>
            <p class="text-sm text-muted-foreground">{ttc("Copy this credential now. It will not be shown again.")}</p>
            <code class="block break-all select-all rounded-md bg-hover p-3 text-sm">{value()}</code>
            <div class="flex gap-2">
              <ButtonIcon icon={mdiContentCopy} variant={buttonVariant.filledIndigo} onClick={state.copy}>
                {ttc("Copy key")}
              </ButtonIcon>
              <ButtonIcon icon={mdiCheckboxMarkedOutline} variant={buttonVariant.outline} onClick={state.dismiss}>
                {ttc("Done")}
              </ButtonIcon>
            </div>
          </section>
        )}
      </Show>

      <Show when={!state.credential()}>
        <section class="rounded-md border border-border bg-background p-4 sm:p-5 space-y-4">
          <h2 class="text-sm font-semibold">{ttc("Create API key")}</h2>
          <form class="space-y-4" onSubmit={state.create}>
            <label class="block space-y-1">
              <span class="text-sm font-medium">{ttc("Name")}</span>
              <input
                class="block w-full rounded-md border border-input bg-background p-2 text-sm"
                type="text"
                required
                maxlength={80}
                value={state.name()}
                onInput={(e) => state.nameChange(e.currentTarget.value)}
              />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium">{ttc("Expiry")}</span>
              <div class="relative w-full min-w-0">
                <select
                  class="block w-full appearance-none rounded-md border border-input bg-background py-2 pl-2.5 pr-10 text-sm"
                  value={state.expiryPreset()}
                  onChange={(e) => state.expiryChange(e.currentTarget.value)}
                >
                  <option value="never">{ttc("No expiry")}</option>
                  <option value="1-day">{ttc("1 day")}</option>
                  <option value="1-week">{ttc("1 week")}</option>
                  <option value="1-month">{ttc("1 month")}</option>
                  <option value="1-year">{ttc("1 year")}</option>
                  <option value="2-years">{ttc("2 years")}</option>
                  <option value="3-years">{ttc("3 years")}</option>
                </select>
                <Icon
                  path={mdiChevronDown}
                  class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </label>
            <ButtonIcon icon={mdiPlus} type="submit" variant={buttonVariant.filledIndigo} disabled={state.busy()}>
              {ttc("Create key")}
            </ButtonIcon>
          </form>
        </section>
      </Show>

      <Show when={state.error()}>
        {(message) => (
          <p role="alert" class="text-sm text-danger">
            {message()}
          </p>
        )}
      </Show>

      <section class="space-y-4">
        <h2 class="text-sm font-semibold text-muted-foreground">{ttc("Your keys")}</h2>
        <Show when={state.listError()}>{(message) => <p role="alert">{message()}</p>}</Show>
        <Show when={state.page()} fallback={!state.listError() && <p>{ttc("Loading API keys...")}</p>}>
          {(page) => (
            <Show when={page().page.length > 0} fallback={<p>{ttc("No API keys yet")}</p>}>
              <div class="space-y-3">
                <For each={page().page}>
                  {(key) => (
                    <article class="rounded-md border border-border bg-background p-4 sm:p-5 space-y-2">
                      <Show when={state.editingId() === key.id} fallback={<h3 class="font-semibold">{key.name}</h3>}>
                        <form class="space-y-2" onSubmit={state.saveEdit}>
                          <label class="block space-y-1">
                            <span class="text-sm font-medium">{ttc("Name")}</span>
                            <input
                              class="block w-full rounded-md border border-input bg-background p-2 text-sm"
                              type="text"
                              required
                              maxlength={80}
                              value={state.editName()}
                              onInput={(e) => state.editNameChange(e.currentTarget.value)}
                            />
                          </label>
                          <Show when={state.editError()}>
                            {(message) => (
                              <p role="alert" class="text-sm text-danger">
                                {message()}
                              </p>
                            )}
                          </Show>
                          <div class="flex gap-2">
                            <ButtonIcon
                              icon={mdiCheckboxMarkedOutline}
                              type="submit"
                              variant={buttonVariant.filledIndigo}
                              disabled={state.busy()}
                            >
                              {ttc("Save")}
                            </ButtonIcon>
                            <ButtonIcon
                              icon={mdiClose}
                              type="button"
                              variant={buttonVariant.outline}
                              disabled={state.busy()}
                              onClick={state.cancelEdit}
                            >
                              {ttc("Cancel")}
                            </ButtonIcon>
                          </div>
                        </form>
                      </Show>
                      <code>{key.maskedCredential}</code>
                      <p>
                        {ttc("Created")}: <DateView date={key.createdAt} />
                      </p>
                      <p>
                        {ttc("Expires")}:{" "}
                        <Show when={key.expiresAt} fallback={ttc("Never")}>
                          {(date) => <DateView date={date()} />}
                        </Show>
                      </p>
                      <p>
                        {ttc("Status")}:{" "}
                        {key.status === "active"
                          ? ttc("Active")
                          : key.status === "revoked"
                            ? ttc("Revoked")
                            : ttc("Expired")}
                      </p>
                      <div class="flex gap-2 flex-wrap">
                        <Show when={state.editingId() !== key.id}>
                          <ButtonIcon
                            icon={mdiPencil}
                            type="button"
                            variant={buttonVariant.outline}
                            disabled={state.busy() || !!state.credential()}
                            onClick={() => state.edit(key)}
                          >
                            {ttc("Edit")}
                          </ButtonIcon>
                        </Show>
                        <Show when={key.status === "active"}>
                          <ButtonIcon
                            icon={mdiRefresh}
                            variant={buttonVariant.outline}
                            disabled={state.busy() || state.editingId() === key.id || !!state.credential()}
                            onClick={() => state.rotate(key)}
                          >
                            {ttc("Rotate")}
                          </ButtonIcon>
                          <ButtonIcon
                            icon={mdiTrashCanOutline}
                            variant={buttonVariant.outline}
                            disabled={state.busy() || state.editingId() === key.id || !!state.credential()}
                            onClick={() => state.revoke(key)}
                          >
                            {ttc("Revoke")}
                          </ButtonIcon>
                        </Show>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </Show>
          )}
        </Show>
        <PaginationControls
          page={state.pageNumber}
          canPrevious={state.canPrevious}
          canNext={state.canNext}
          previous={state.previous}
          next={state.next}
          loading={state.loading}
        />
      </section>
    </main>
  )
}
