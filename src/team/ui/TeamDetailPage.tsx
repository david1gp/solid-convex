import { Show } from "solid-js"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { ProjectListSection } from "#src/project/ui/ProjectListSection.tsx"
import { teamDetailPageStateCreate } from "#src/team/ui/teamDetailPageStateCreate.ts"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamDetailPage() {
  const state = teamDetailPageStateCreate()
  return (
    <PageWrapper>
      <section class="px-2 sm:px-4 py-6 space-y-6">
        <LinkButtonInternal to={state.listHref()}>Back to teams</LinkButtonInternal>
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
                  <LinkButtonInternal to={state.editHref()}>Edit team</LinkButtonInternal>
                  <Button variant={buttonVariant.outlineRed} onClick={() => state.deleteDialogOpen.set(true)}>
                    Delete team
                  </Button>
                </div>
              </div>
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
              <ProjectListSection orgHandle={state.orgHandle()} teamId={team().teamId} />
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
