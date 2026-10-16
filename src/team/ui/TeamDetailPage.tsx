import { Match, Show, Switch } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { ProjectListSection } from "#src/project/ui/ProjectListSection.tsx"
import { teamDetailPageStateCreate } from "#src/team/ui/teamDetailPageStateCreate.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { TabsTop } from "#ui/interactive/tabs/TabsTop.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamDetailPage() {
  const state = teamDetailPageStateCreate()
  return (
    <PageWrapper>
      <section class="px-2 sm:px-4 py-6 space-y-6">
        <LinkButtonInternal to={state.listHref()} icon={appIcons.back}>
          Back to teams
        </LinkButtonInternal>
        <Show when={state.loading()}>
          <p role="status">Loading team…</p>
        </Show>
        <Show when={state.error()}>
          <p role="alert" class="text-destructive">
            {state.error()}
          </p>
        </Show>
        <Show when={state.team()}>
          {(team) => (
            <>
              <div class="flex justify-between items-center gap-4">
                <h1 class="text-2xl font-bold">{team().name}</h1>
                <div class="flex items-center gap-2">
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
                      <div class="space-y-4">
                        <Show when={team().description}>
                          <p class="whitespace-pre-wrap break-words">{team().description}</p>
                        </Show>
                        <dl class="text-sm text-muted-foreground grid gap-2">
                          <dt>Organization</dt>
                          <dd>{state.orgName() ?? state.orgHandle() ?? team().orgId}</dd>
                          <dt>Created</dt>
                          <dd>{team().createdAt}</dd>
                          <dt>Last updated</dt>
                          <dd>{team().updatedAt}</dd>
                        </dl>
                      </div>
                    </Match>
                    <Match when={tab === "projects"}>
                      <ProjectListSection orgHandle={state.orgHandle()} teamId={team().teamId} />
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
