import { Match, Show, Switch } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { ProjectListSection } from "#src/project/ui/ProjectListSection.tsx"
import type { projectListSectionStateCreate } from "#src/project/ui/projectListSectionStateCreate.ts"
import { teamDetailPageStateCreate } from "#src/team/ui/teamDetailPageStateCreate.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { TabsTop } from "#ui/interactive/tabs/TabsTop.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamDetailPage(p: {
  demo?: {
    detail: ReturnType<typeof teamDetailPageStateCreate>
    projects: ReturnType<typeof projectListSectionStateCreate>
  }
}) {
  const state = p.demo?.detail ?? teamDetailPageStateCreate()
  return (
    <PageWrapper>
      <section class="space-y-6">
        <LinkButtonInternal to={state.listHref()} icon={appIcons.back}>
          Back to teams
        </LinkButtonInternal>
        <Show when={state.loading()}>
          <p role="status" class="text-sm text-muted-foreground">
            Loading team…
          </p>
        </Show>
        <Show when={state.error()}>
          <p role="alert" class="text-destructive">
            {state.error()}
          </p>
        </Show>
        <Show when={state.team()}>
          {(team) => (
            <>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h1 class="text-2xl font-bold">{team().name}</h1>
                <div class="flex flex-wrap items-center gap-2">
                  <LinkButtonInternal to={state.editHref()} icon={appIcons.edit}>
                    Edit team
                  </LinkButtonInternal>
                  <ButtonIcon
                    icon={appIcons.delete}
                    variant={buttonVariant.outlineRed}
                    onClick={() => state.deleteDialogOpen.set(true)}
                  >
                    Delete team
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
                        <Show when={team().description}>
                          <p class="text-sm whitespace-pre-wrap break-words">{team().description}</p>
                        </Show>
                        <dl class="grid gap-2">
                          <dt class="text-xs text-muted-foreground">Organization</dt>
                          <dd class="text-sm">{state.orgName() ?? state.orgHandle() ?? team().orgId}</dd>
                          <dt class="text-xs text-muted-foreground">Created</dt>
                          <dd class="text-sm">{team().createdAt}</dd>
                          <dt class="text-xs text-muted-foreground">Last updated</dt>
                          <dd class="text-sm">{team().updatedAt}</dd>
                        </dl>
                      </div>
                    </Match>
                    <Match when={tab === "projects"}>
                      <ProjectListSection
                        orgHandle={state.orgHandle()}
                        teamId={team().teamId}
                        demoState={p.demo?.projects}
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
