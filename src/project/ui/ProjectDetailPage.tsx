import { Show } from "solid-js"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { NoteListSection } from "#src/note/ui/NoteListSection.tsx"
import { projectDetailPageStateCreate } from "#src/project/ui/projectDetailPageStateCreate.ts"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectDetailPage() {
  const state = projectDetailPageStateCreate()
  return (
    <PageWrapper>
      <section class="px-2 sm:px-4 py-6 space-y-6">
        <div class="flex gap-2">
          <LinkButtonInternal to={state.listHref()}>Back to projects</LinkButtonInternal>
          <Show when={state.teamHref()}>
            <LinkButtonInternal to={state.teamHref()!}>Back to team</LinkButtonInternal>
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
                  <LinkButtonInternal to={state.editHref()}>Edit project</LinkButtonInternal>
                  <Button variant={buttonVariant.outlineRed} onClick={() => state.deleteDialogOpen.set(true)}>
                    Delete project
                  </Button>
                </div>
              </div>
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
              <NoteListSection
                orgHandle={state.orgHandle()}
                teamId={state.teamId() ?? project().teamId}
                projectId={project().projectId}
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
