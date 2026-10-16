import { Match, Show, Switch } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { NoteListSection } from "#src/note/ui/NoteListSection.tsx"
import { projectDetailPageStateCreate } from "#src/project/ui/projectDetailPageStateCreate.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { TabsTop } from "#ui/interactive/tabs/TabsTop.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectDetailPage() {
  const state = projectDetailPageStateCreate()
  return (
    <PageWrapper>
      <section class="px-2 sm:px-4 py-6 space-y-6">
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
          <p role="status">Loading project…</p>
        </Show>
        <Show when={state.error()}>
          <p role="alert" class="text-destructive">
            {state.error()}
          </p>
        </Show>
        <Show when={state.project()}>
          {(project) => (
            <>
              <div class="flex justify-between items-center gap-4">
                <h1 class="text-2xl font-bold">{project().name}</h1>
                <div class="flex items-center gap-2">
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
                      <div class="space-y-4">
                        <Show when={project().description}>
                          <p class="whitespace-pre-wrap break-words">{project().description}</p>
                        </Show>
                        <dl class="text-sm text-muted-foreground grid gap-2">
                          <dt>Team</dt>
                          <dd>{state.teamId() ?? project().teamId}</dd>
                          <dt>Organization</dt>
                          <dd>{state.orgHandle() ?? project().orgId}</dd>
                          <dt>Created</dt>
                          <dd>{project().createdAt}</dd>
                          <dt>Last updated</dt>
                          <dd>{project().updatedAt}</dd>
                        </dl>
                      </div>
                    </Match>
                    <Match when={tab === "notes"}>
                      <NoteListSection
                        orgHandle={state.orgHandle()}
                        teamId={state.teamId() ?? project().teamId}
                        projectId={project().projectId}
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
