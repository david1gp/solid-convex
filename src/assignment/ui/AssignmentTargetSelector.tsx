import { For, Show } from "solid-js"
import { assignmentTargetLabelFormat } from "#src/assignment/ui/assignmentTargetLabelFormat.ts"
import type { AssignmentTargetSelectorProps } from "#src/assignment/ui/AssignmentTargetSelectorProps.ts"
import { assignmentTargetSelectorStateCreate } from "#src/assignment/ui/assignmentTargetSelectorStateCreate.ts"
import type { SelectorKindChoice } from "#src/assignment/ui/SelectorKindChoice.ts"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface AssignmentSelectorComponentProps extends AssignmentTargetSelectorProps, MayHaveClass {}

const kindOptions: { kind: SelectorKindChoice; label: string }[] = [
  { kind: "unassigned", label: "Unassigned" },
  { kind: "organization", label: "Organization" },
  { kind: "team", label: "Team" },
  { kind: "project", label: "Project" },
  { kind: "note", label: "Note" },
]

export function AssignmentTargetSelector(props: AssignmentSelectorComponentProps) {
  const state = assignmentTargetSelectorStateCreate(props)

  return (
    <div class={classMerge("space-y-4 rounded-lg border border-border p-4 bg-card", props.class)}>
      <div>
        <label class="block text-sm font-medium mb-2 text-foreground">Hierarchy Assignment</label>
        <div class="flex flex-wrap gap-2">
          <For each={kindOptions}>
            {(opt) => (
              <Button
                type="button"
                variant={state.selectedKind() === opt.kind ? buttonVariant.filled : buttonVariant.outline}
                size={buttonSize.sm}
                disabled={state.disabled()}
                onClick={() => state.selectKind(opt.kind)}
              >
                {opt.label}
              </Button>
            )}
          </For>
        </div>
      </div>

      {/* Organization Level */}
      <Show when={state.selectedKind() === "organization"}>
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Select Organization
          </label>
          <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <select
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={state.selectedOrgId()}
              disabled={state.disabled()}
              onChange={(e) => state.selectOrg(e.currentTarget.value)}
            >
              <option value="">-- Choose an Organization --</option>
              <For each={state.orgs()}>
                {(org) => (
                  <option value={org._id}>{org.name ? `${org.name} (${org.orgHandle})` : org.orgHandle}</option>
                )}
              </For>
            </select>
            <Show when={state.hasMoreOrgs()}>
              <Button
                type="button"
                variant={buttonVariant.outline}
                size={buttonSize.sm}
                onClick={state.loadMoreOrgs}
                disabled={state.disabled()}
              >
                Load more
              </Button>
            </Show>
          </div>
        </div>
      </Show>

      {/* Team Level */}
      <Show when={state.selectedKind() === "team"}>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-muted-foreground mb-1">Filter by Organization (optional)</label>
            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={state.selectedOrgId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectOrg(e.currentTarget.value)}
              >
                <option value="">-- All Organizations --</option>
                <For each={state.orgs()}>
                  {(org) => (
                    <option value={org._id}>{org.name ? `${org.name} (${org.orgHandle})` : org.orgHandle}</option>
                  )}
                </For>
              </select>
              <Show when={state.hasMoreOrgs()}>
                <Button
                  type="button"
                  variant={buttonVariant.ghost}
                  size={buttonSize.sm}
                  onClick={state.loadMoreOrgs}
                  disabled={state.disabled()}
                >
                  Load more
                </Button>
              </Show>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Select Team
            </label>
            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={state.selectedTeamId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectTeam(e.currentTarget.value)}
              >
                <option value="">-- Choose a Team --</option>
                <For each={state.teams()}>{(team) => <option value={team.teamId}>{team.name}</option>}</For>
              </select>
              <Show when={state.hasMoreTeams()}>
                <Button
                  type="button"
                  variant={buttonVariant.outline}
                  size={buttonSize.sm}
                  onClick={state.loadMoreTeams}
                  disabled={state.disabled()}
                >
                  Load more
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </Show>

      {/* Project Level */}
      <Show when={state.selectedKind() === "project"}>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">Filter Org (optional)</label>
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={state.selectedOrgId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectOrg(e.currentTarget.value)}
              >
                <option value="">-- All Organizations --</option>
                <For each={state.orgs()}>
                  {(org) => (
                    <option value={org._id}>{org.name ? `${org.name} (${org.orgHandle})` : org.orgHandle}</option>
                  )}
                </For>
              </select>
            </div>

            <div>
              <label class="block text-xs text-muted-foreground mb-1">Filter Team (optional)</label>
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={state.selectedTeamId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectTeam(e.currentTarget.value)}
              >
                <option value="">-- All Teams --</option>
                <For each={state.teams()}>{(team) => <option value={team.teamId}>{team.name}</option>}</For>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Select Project
            </label>
            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={state.selectedProjectId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectProject(e.currentTarget.value)}
              >
                <option value="">-- Choose a Project --</option>
                <For each={state.projects()}>
                  {(project) => <option value={project.projectId}>{project.name}</option>}
                </For>
              </select>
              <Show when={state.hasMoreProjects()}>
                <Button
                  type="button"
                  variant={buttonVariant.outline}
                  size={buttonSize.sm}
                  onClick={state.loadMoreProjects}
                  disabled={state.disabled()}
                >
                  Load more
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </Show>

      {/* Note Level */}
      <Show when={state.selectedKind() === "note"}>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">Filter Org</label>
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={state.selectedOrgId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectOrg(e.currentTarget.value)}
              >
                <option value="">-- All Orgs --</option>
                <For each={state.orgs()}>
                  {(org) => (
                    <option value={org._id}>{org.name ? `${org.name} (${org.orgHandle})` : org.orgHandle}</option>
                  )}
                </For>
              </select>
            </div>

            <div>
              <label class="block text-xs text-muted-foreground mb-1">Filter Team</label>
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={state.selectedTeamId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectTeam(e.currentTarget.value)}
              >
                <option value="">-- All Teams --</option>
                <For each={state.teams()}>{(team) => <option value={team.teamId}>{team.name}</option>}</For>
              </select>
            </div>

            <div>
              <label class="block text-xs text-muted-foreground mb-1">Filter Project</label>
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={state.selectedProjectId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectProject(e.currentTarget.value)}
              >
                <option value="">-- All Projects --</option>
                <For each={state.projects()}>
                  {(project) => <option value={project.projectId}>{project.name}</option>}
                </For>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Select Note
            </label>
            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <select
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={state.selectedNoteId()}
                disabled={state.disabled()}
                onChange={(e) => state.selectNote(e.currentTarget.value)}
              >
                <option value="">-- Choose a Note --</option>
                <For each={state.notes()}>{(note) => <option value={note.noteId}>{note.title}</option>}</For>
              </select>
              <Show when={state.hasMoreNotes()}>
                <Button
                  type="button"
                  variant={buttonVariant.outline}
                  size={buttonSize.sm}
                  onClick={state.loadMoreNotes}
                  disabled={state.disabled()}
                >
                  Load more
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </Show>

      {/* Inferred parent summary */}
      <Show when={state.inferredParentSummary()}>
        <div class="text-xs text-muted-foreground bg-muted/40 rounded p-2 border border-border/50">
          <span class="font-medium text-foreground">Hierarchy chain: </span>
          {state.inferredParentSummary()}
        </div>
      </Show>

      {/* Target status badge */}
      <div class="flex items-center gap-2 text-xs pt-1">
        <span class="text-muted-foreground">Target:</span>
        <span class="font-mono bg-muted px-2 py-0.5 rounded text-foreground">
          {assignmentTargetLabelFormat(state.canonicalTarget())}
          {state.canonicalTarget() ? ` (${state.canonicalTarget()?.id})` : ""}
        </span>
      </div>
    </div>
  )
}
