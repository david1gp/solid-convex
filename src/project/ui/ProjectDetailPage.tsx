import { Match, Show, Switch } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { NoteListSection } from "#src/note/ui/NoteListSection.tsx"
import type { noteListSectionStateCreate } from "#src/note/ui/noteListSectionStateCreate.ts"
import { projectDetailPageStateCreate } from "#src/project/ui/projectDetailPageStateCreate.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { TabsTop } from "#ui/interactive/tabs/TabsTop.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectDetailPage(p: {
  demo?: {
    detail: ReturnType<typeof projectDetailPageStateCreate>
    notes: ReturnType<typeof noteListSectionStateCreate>
  }
}) {
  const state = p.demo?.detail ?? projectDetailPageStateCreate()
  return (
    <PageWrapper>
      <section class="space-y-6">
        <div class="flex gap-2">
          <LinkButtonInternal to={state.listHref()} icon={appIcons.back}>
            Back to projects
          </LinkButtonInternal>
          <Show when={state.teamHref()}>
            <LinkButtonInternal to={state.teamHref()!} icon={appIcons.team}>
              Back to team
            </LinkButtonInternal>
          </Show>
        </div>
        <Show when={state.loading()}>
          <p role="status" class="text-sm text-muted-foreground">
            Loading project…
          </p>
        </Show>
        <Show when={state.error()}>
          <p role="alert" class="text-destructive">
            {state.error()}
          </p>
        </Show>
        <Show when={state.project()}>
          {(project) => (
            <>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h1 class="text-2xl font-bold">{project().name}</h1>
                <div class="flex flex-wrap items-center gap-2">
                  <LinkButtonInternal to={state.editHref()} icon={appIcons.edit}>
                    Edit project
                  </LinkButtonInternal>
                  <ButtonIcon
                    icon={appIcons.delete}
                    variant={buttonVariant.outlineRed}
                    onClick={() => state.deleteDialogOpen.set(true)}
                  >
                    Delete project
                  </ButtonIcon>
                </div>
              </div>
              <TabsTop
                valueSignal={state.selectedTab}
                getOptions={state.tabOptions}
                valueText={state.tabText}
                valueIcon={state.tabIcon}
                class="mb-6 rounded-md p-1"
                valueChildren={(tab) => (
                  <Switch>
                    <Match when={tab === "details"}>
                      <div class="rounded-md border border-border bg-background p-4 sm:p-5 space-y-4">
                        <Show when={project().description}>
                          <p class="text-sm whitespace-pre-wrap break-words">{project().description}</p>
                        </Show>
                        <dl class="grid gap-2">
                          <dt class="text-xs text-muted-foreground">Team</dt>
                          <dd class="text-sm">{state.teamId() ?? project().teamId}</dd>
                          <dt class="text-xs text-muted-foreground">Organization</dt>
                          <dd class="text-sm">{state.orgHandle() ?? project().orgId}</dd>
                          <dt class="text-xs text-muted-foreground">Created</dt>
                          <dd class="text-sm">{project().createdAt}</dd>
                          <dt class="text-xs text-muted-foreground">Last updated</dt>
                          <dd class="text-sm">{project().updatedAt}</dd>
                        </dl>
                      </div>
                    </Match>
                    <Match when={tab === "notes"}>
                      <NoteListSection
                        orgHandle={state.orgHandle()}
                        teamId={state.teamId() ?? project().teamId}
                        projectId={project().projectId}
                        demoState={p.demo?.notes}
                      />
                    </Match>
                  </Switch>
                )}
              />
            </>
          )}
        </Show>
        <HierarchyDeleteDialog
          target={state.deleteTarget}
          isOpen={state.deleteDialogOpen}
          dialogKey="delete"
          onSuccess={state.onDeleteSuccess}
        />
      </section>
    </PageWrapper>
  )
}
