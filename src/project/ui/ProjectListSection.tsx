import { For, Show } from "solid-js"
import { projectListSectionStateCreate } from "#src/project/ui/projectListSectionStateCreate.ts"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"

export function ProjectListSection(p: { orgHandle?: string; teamId?: string }) {
  const state = projectListSectionStateCreate(
    () => p.orgHandle,
    () => p.teamId,
  )
  return (
    <section class="px-2 sm:px-4 py-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-bold">Projects</h2>
        <Show
          when={state.contextual()}
          fallback={<LinkButtonInternal to={state.teamListHref()}>Choose team to create a project</LinkButtonInternal>}
        >
          <LinkButtonInternal to={state.createHref()}>Create project</LinkButtonInternal>
        </Show>
      </div>
      <Show when={state.error()}>
        <p role="alert" class="text-destructive">
          {state.error()}
        </p>
      </Show>
      <Show when={state.pagination.loading()}>
        <p class="text-muted-foreground" role="status">
          Loading projects…
        </p>
      </Show>
      <Show when={!state.pagination.loading() && !state.error() && state.projects().length === 0}>
        <p class="text-muted-foreground">No projects yet.</p>
      </Show>
      <div class="space-y-3">
        <For each={state.projects()}>
          {(project) => (
            <article class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <LinkButtonInternal to={state.detailHref(project.projectId)} class="font-semibold">
                  {project.name}
                </LinkButtonInternal>
                <Show when={project.description}>
                  <p class="text-muted-foreground whitespace-pre-wrap break-words">{project.description}</p>
                </Show>
              </div>
              <LinkButtonInternal to={state.editHref(project.projectId)}>Edit</LinkButtonInternal>
            </article>
          )}
        </For>
      </div>
      <PaginationControls
        page={() => state.pagination.history().length + 1}
        canPrevious={state.pagination.canPrevious}
        canNext={state.pagination.canNext}
        previous={state.pagination.previous}
        next={state.pagination.next}
        loading={state.pagination.loading}
      />
    </section>
  )
}
