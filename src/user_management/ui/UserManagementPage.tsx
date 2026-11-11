import { For, Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { UserManagementRolesDialog } from "#src/user_management/ui/UserManagementRolesDialog.tsx"
import { UserRoleCheckMultipleField } from "#src/user_management/ui/UserRoleCheckMultipleField.tsx"
import { UserTeamCheckMultipleField } from "#src/user_management/ui/UserTeamCheckMultipleField.tsx"
import { userManagementPageStateCreate } from "#src/user_management/ui/userManagementPageStateCreate.ts"
import { CheckSingle } from "#ui/input/check/CheckSingle.tsx"
import { Button } from "#ui/interactive/button/Button.tsx"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.tsx"

export function UserManagementPage() {
  const state = userManagementPageStateCreate()

  return (
    <PageWrapper>
      <div class="px-2 sm:px-4 py-6 space-y-6">
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">User Management</h1>
            <p class="text-sm text-muted-foreground">
              Manage Zitadel user project roles and team assignments. User account lifecycle is managed in Zitadel.
            </p>
          </div>
          <Show when={state.isAdmin()}>
            <div class="flex items-center gap-2">
              <Button variant={buttonVariant.outline} onClick={state.syncUsers} disabled={state.isSyncing()}>
                {state.isSyncing() ? "Syncing…" : "Refresh from Zitadel"}
              </Button>
            </div>
          </Show>
        </header>

        <Show when={state.syncStatus()}>
          <div role="status" class="p-3 bg-muted text-foreground text-sm rounded-md border border-border">
            {state.syncStatus()}
          </div>
        </Show>

        <Show when={state.syncError()}>
          <div
            role="alert"
            class="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20"
          >
            {state.syncError()}
          </div>
        </Show>

        <Show
          when={state.isAdmin() && !state.listError().includes("Admin")}
          fallback={
            <div
              role="alert"
              class="p-8 text-center space-y-3 rounded-lg border border-destructive/30 bg-destructive/5"
            >
              <h2 class="text-xl font-bold text-destructive">Access Denied</h2>
              <p class="text-muted-foreground text-sm">
                Admin authorization required. You do not have permission to view or manage Zitadel users.
              </p>
            </div>
          }
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <section class="lg:col-span-5 border border-border rounded-lg p-4 space-y-4 bg-card">
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-semibold">Users</h2>
                <Show when={state.pagination.loading()}>
                  <span class="text-xs text-muted-foreground animate-pulse">Loading…</span>
                </Show>
              </div>

              <Show when={state.listError()}>
                <p role="alert" class="text-sm text-destructive">
                  {state.listError()}
                </p>
              </Show>

              <CheckSingle
                id="user-management-role-filter"
                valueSignal={state.roleFilter}
                getOptions={() => [...state.roleFilterOptions()]}
                valueText={(role) => (role === "all" ? "All" : role)}
                disallowDeselection
              />

              <Show
                when={state.visibleUsers().length > 0}
                fallback={
                  <Show when={!state.pagination.loading()}>
                    <p class="text-sm text-muted-foreground py-4 text-center">
                      No users found. Try refreshing from Zitadel.
                    </p>
                  </Show>
                }
              >
                <ul class="divide-y divide-border -mx-4">
                  <For each={state.visibleUsers()}>
                    {(user) => {
                      const isSelected = () => state.selectedUserId() === user.userId
                      return (
                        <li class="flex items-stretch gap-1 px-1">
                          <button
                            type="button"
                            onClick={() => state.selectUser(user.userId)}
                            class={`flex-1 min-w-0 text-left px-4 py-3 transition-colors hover:bg-muted/50 flex flex-col gap-1 ${
                              isSelected() ? "bg-muted font-medium border-l-4 border-primary pl-3" : ""
                            }`}
                          >
                            <div class="flex justify-between items-center gap-2">
                              <span class="text-sm font-medium truncate">
                                {user.displayName || user.username || user.email || user.userId}
                              </span>
                              <span class="text-xs text-muted-foreground font-mono shrink-0">
                                {user.teamIds.length} {user.teamIds.length === 1 ? "team" : "teams"}
                              </span>
                            </div>
                            <div class="flex justify-between items-center gap-2">
                              <span class="text-xs text-muted-foreground truncate">
                                {user.email || user.preferredLoginName || user.userId}
                              </span>
                              <div class="flex gap-1 shrink-0">
                                <For each={user.roles}>
                                  {(role) => (
                                    <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted-foreground/20 text-foreground">
                                      {role}
                                    </span>
                                  )}
                                </For>
                              </div>
                            </div>
                          </button>
                          <div class="flex items-center shrink-0">
                            <ButtonIconOnly
                              title={`Edit roles for ${user.displayName || user.username || user.email || user.userId}`}
                              icon={appIcons.edit}
                              variant={buttonVariant.ghost}
                              onClick={() => state.rolesDialog.openEdit(user)}
                              disabled={state.rolesDialog.isUpdating(user.userId)}
                              aria-label={`Edit roles for ${user.displayName || user.username || user.email || user.userId}`}
                            />
                          </div>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </Show>
              <UserManagementRolesDialog dialog={state.rolesDialog} members={state.users} />

              <Show when={state.pagination.canPrevious() || state.pagination.canNext()}>
                <div class="flex justify-between items-center pt-2 border-t border-border">
                  <Button
                    variant={buttonVariant.outline}
                    onClick={state.pagination.previous}
                    disabled={!state.pagination.canPrevious()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant={buttonVariant.outline}
                    onClick={state.pagination.next}
                    disabled={!state.pagination.canNext()}
                  >
                    Next
                  </Button>
                </div>
              </Show>
            </section>

            <section class="lg:col-span-7 border border-border rounded-lg p-6 bg-card space-y-6">
              <Show
                when={state.selectedUser()}
                fallback={
                  <div class="py-12 text-center text-muted-foreground space-y-2">
                    <p class="text-base font-medium">No user selected</p>
                    <p class="text-sm">
                      Select a user from the list to view and manage their role and team assignments.
                    </p>
                  </div>
                }
              >
                {(user) => (
                  <div class="space-y-6">
                    <div class="border-b border-border pb-4 flex justify-between items-start gap-4">
                      <div>
                        <h2 class="text-xl font-bold">
                          {user().displayName || user().username || user().email || "User Assignments"}
                        </h2>
                        <dl class="mt-2 text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            <span class="font-medium text-foreground">Zitadel ID: </span>
                            <span class="font-mono">{user().userId}</span>
                          </div>
                          <Show when={user().email}>
                            <div>
                              <span class="font-medium text-foreground">Email: </span>
                              <span>{user().email}</span>
                            </div>
                          </Show>
                          <Show when={user().username}>
                            <div>
                              <span class="font-medium text-foreground">Username: </span>
                              <span>{user().username}</span>
                            </div>
                          </Show>
                          <Show when={user().syncedAt}>
                            <div>
                              <span class="font-medium text-foreground">Last synced: </span>
                              <span>{user().syncedAt}</span>
                            </div>
                          </Show>
                        </dl>
                      </div>
                      <Button variant={buttonVariant.ghost} onClick={state.deselectUser}>
                        Close
                      </Button>
                    </div>

                    <div class="space-y-6">
                      <UserRoleCheckMultipleField
                        id="user-roles"
                        rolesSignal={state.rolesSignal}
                        label="Project Roles"
                        subtitle="Assign roles (user, member, admin) authoritative in Zitadel project grants."
                        disabled={state.isSaving()}
                      />

                      <UserTeamCheckMultipleField
                        id="user-teams"
                        teamIdsSignal={state.teamIdsSignal}
                        options={state.teamOptions()}
                        label="Team Assignments"
                        subtitle="Assign user to organizations' teams stored in Zitadel user metadata."
                        disabled={state.isSaving()}
                      />

                      <Show when={state.hasMoreTeams()}>
                        <div class="pt-1">
                          <Button
                            variant={buttonVariant.outline}
                            onClick={state.loadMoreTeams}
                            disabled={state.isSaving()}
                          >
                            Load more teams
                          </Button>
                        </div>
                      </Show>
                    </div>

                    <Show when={state.saveStatus()}>
                      <div
                        role="status"
                        class="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm rounded-md border border-emerald-500/20"
                      >
                        {state.saveStatus()}
                      </div>
                    </Show>

                    <Show when={state.saveError()}>
                      <div
                        role="alert"
                        class="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 space-y-2"
                      >
                        <p class="font-medium">{state.saveError()}</p>
                        <Show when={state.partialFailure()}>
                          {(pf) => (
                            <div class="text-xs border-t border-destructive/20 pt-2 space-y-1">
                              <p class="font-semibold">Partial Write Details:</p>
                              <Show when={pf().rolesUpdated && !pf().teamIdsUpdated}>
                                <p>• Role grants were successfully updated in Zitadel.</p>
                                <p class="text-destructive">
                                  • Team IDs metadata update failed ({pf().teamIdsError}). Please retry saving.
                                </p>
                              </Show>
                              <Show when={!pf().rolesUpdated && pf().teamIdsUpdated}>
                                <p>• Team IDs metadata was successfully updated in Zitadel.</p>
                                <p class="text-destructive">
                                  • Role grants update failed ({pf().rolesError}). Please retry saving.
                                </p>
                              </Show>
                            </div>
                          )}
                        </Show>
                      </div>
                    </Show>

                    <div class="flex items-center gap-3 pt-4 border-t border-border">
                      <Button
                        variant={buttonVariant.contrast}
                        onClick={state.saveAssignments}
                        disabled={state.isSaving()}
                      >
                        {state.isSaving() ? "Saving Assignments…" : "Save Assignments"}
                      </Button>
                      <Button variant={buttonVariant.outline} onClick={state.resetForm} disabled={state.isSaving()}>
                        Reset Form
                      </Button>
                    </div>
                  </div>
                )}
              </Show>
            </section>
          </div>
        </Show>
      </div>
    </PageWrapper>
  )
}
