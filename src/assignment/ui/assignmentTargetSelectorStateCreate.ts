import { createEffect, createMemo, onSettled as onMount } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { AssignmentTargetKind } from "#src/assignment/model/assignmentTargetKindSchema.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { AssignmentTargetSelectorProps } from "#src/assignment/ui/AssignmentTargetSelectorProps.ts"
import { assignmentTargetCanonicalBuild } from "#src/assignment/ui/assignmentTargetCanonicalBuild.ts"
import { assignmentUrlPrefillParse } from "#src/assignment/ui/assignmentUrlPrefillParse.ts"
import type { SelectorKindChoice } from "#src/assignment/ui/SelectorKindChoice.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { Note } from "#src/note/model/noteSchema.ts"
import type { DocOrg } from "#src/org/org_convex/IdOrg.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import type { Team } from "#src/team/model/teamSchema.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function assignmentTargetSelectorStateCreate(props: AssignmentTargetSelectorProps) {
  const selectedKind = createSignalObject<SelectorKindChoice>("unassigned")
  const selectedOrgId = createSignalObject<string>("")
  const selectedTeamId = createSignalObject<string>("")
  const selectedProjectId = createSignalObject<string>("")
  const selectedNoteId = createSignalObject<string>("")

  // Accumulated items lists
  const orgsList = createSignalObject<DocOrg[]>([])
  const teamsList = createSignalObject<Team[]>([])
  const projectsList = createSignalObject<Project[]>([])
  const notesList = createSignalObject<Note[]>([])

  // Cursors for pagination
  const orgCursor = createSignalObject<string | null>(null)
  const teamCursor = createSignalObject<string | null>(null)
  const projectCursor = createSignalObject<string | null>(null)
  const noteCursor = createSignalObject<string | null>(null)

  // Done flags
  const orgsDone = createSignalObject<boolean>(true)
  const teamsDone = createSignalObject<boolean>(true)
  const projectsDone = createSignalObject<boolean>(true)
  const notesDone = createSignalObject<boolean>(true)

  // Next continue cursors
  const orgsContinueCursor = createSignalObject<string | null>(null)
  const teamsContinueCursor = createSignalObject<string | null>(null)
  const projectsContinueCursor = createSignalObject<string | null>(null)
  const notesContinueCursor = createSignalObject<string | null>(null)

  // URL prefill on mount
  onMount(() => {
    const existing = props.valueSignal.get()
    if (!existing && typeof window !== "undefined" && window.location.search) {
      const prefill = assignmentUrlPrefillParse(window.location.search)
      if (prefill.kind && prefill.kind !== "unassigned") {
        selectedKind.set(prefill.kind)
        if (prefill.orgId) selectedOrgId.set(prefill.orgId)
        if (prefill.teamId) selectedTeamId.set(prefill.teamId)
        if (prefill.projectId) selectedProjectId.set(prefill.projectId)
        if (prefill.noteId) selectedNoteId.set(prefill.noteId)
        if (prefill.target) {
          props.valueSignal.set(prefill.target)
        }
      }
    } else if (existing) {
      selectedKind.set(existing.kind)
      if (existing.kind === "organization") selectedOrgId.set(existing.id)
      if (existing.kind === "team") selectedTeamId.set(existing.id)
      if (existing.kind === "project") selectedProjectId.set(existing.id)
      if (existing.kind === "note") selectedNoteId.set(existing.id)
    }
  })

  // Reactive queries using bounded queryCreate
  const orgsQuery = queryCreate(api.org.orgListQuery, () => ({
    token: userTokenGet(),
    paginationOpts: { numItems: 20, cursor: orgCursor.get() },
  }))

  const teamsQuery = queryCreate(api.team.teamListQuery, () => ({
    token: userTokenGet(),
    orgId: selectedOrgId.get() ? (selectedOrgId.get() as Id<"orgs">) : undefined,
    paginationOpts: { numItems: 20, cursor: teamCursor.get() },
  }))

  const projectsQuery = queryCreate(api.project.projectListQuery, () => ({
    token: userTokenGet(),
    orgId: selectedOrgId.get() ? (selectedOrgId.get() as Id<"orgs">) : undefined,
    teamId: selectedTeamId.get() ? (selectedTeamId.get() as Id<"teams">) : undefined,
    paginationOpts: { numItems: 20, cursor: projectCursor.get() },
  }))

  const notesQuery = queryCreate(api.note.noteListQuery, () => ({
    token: userTokenGet(),
    orgId: selectedOrgId.get() ? (selectedOrgId.get() as Id<"orgs">) : undefined,
    teamId: selectedTeamId.get() ? (selectedTeamId.get() as Id<"teams">) : undefined,
    projectId: selectedProjectId.get() ? (selectedProjectId.get() as Id<"projects">) : undefined,
    paginationOpts: { numItems: 20, cursor: noteCursor.get() },
  }))

  // Accumulate queries results
  createEffect(
    () => ({ q: orgsQuery(), cursor: orgCursor.get() }),
    ({ q, cursor }) => {
      if (!q || !q.success) return
      const current = orgsList.get()
      const existingIds = new Set(current.map((item) => item._id))
      const fresh = q.data.page.filter((item) => !existingIds.has(item._id))
      if (cursor === null) {
        orgsList.set(q.data.page)
      } else if (fresh.length > 0) {
        orgsList.set([...current, ...fresh])
      }
      orgsDone.set(q.data.isDone)
      orgsContinueCursor.set(q.data.continueCursor)
    },
  )

  createEffect(
    () => ({ q: teamsQuery(), cursor: teamCursor.get() }),
    ({ q, cursor }) => {
      if (!q || !q.success) return
      const current = teamsList.get()
      const existingIds = new Set(current.map((item) => item.teamId))
      const fresh = q.data.page.filter((item) => !existingIds.has(item.teamId))
      if (cursor === null) {
        teamsList.set(q.data.page)
      } else if (fresh.length > 0) {
        teamsList.set([...current, ...fresh])
      }
      teamsDone.set(q.data.isDone)
      teamsContinueCursor.set(q.data.continueCursor)
    },
  )

  createEffect(
    () => ({ q: projectsQuery(), cursor: projectCursor.get() }),
    ({ q, cursor }) => {
      if (!q || !q.success) return
      const current = projectsList.get()
      const existingIds = new Set(current.map((item) => item.projectId))
      const fresh = q.data.page.filter((item) => !existingIds.has(item.projectId))
      if (cursor === null) {
        projectsList.set(q.data.page)
      } else if (fresh.length > 0) {
        projectsList.set([...current, ...fresh])
      }
      projectsDone.set(q.data.isDone)
      projectsContinueCursor.set(q.data.continueCursor)
    },
  )

  createEffect(
    () => ({ q: notesQuery(), cursor: noteCursor.get() }),
    ({ q, cursor }) => {
      if (!q || !q.success) return
      const current = notesList.get()
      const existingIds = new Set(current.map((item) => item.noteId))
      const fresh = q.data.page.filter((item) => !existingIds.has(item.noteId))
      if (cursor === null) {
        notesList.set(q.data.page)
      } else if (fresh.length > 0) {
        notesList.set([...current, ...fresh])
      }
      notesDone.set(q.data.isDone)
      notesContinueCursor.set(q.data.continueCursor)
    },
  )

  function emitCanonicalTarget(kind: SelectorKindChoice) {
    if (kind === "unassigned") {
      props.valueSignal.set(undefined)
      return
    }
    let targetId = ""
    if (kind === "organization") targetId = selectedOrgId.get()
    if (kind === "team") targetId = selectedTeamId.get()
    if (kind === "project") targetId = selectedProjectId.get()
    if (kind === "note") targetId = selectedNoteId.get()

    if (!targetId) {
      props.valueSignal.set(undefined)
      return
    }

    const buildResult = assignmentTargetCanonicalBuild(kind, targetId)
    if (buildResult.success) {
      props.valueSignal.set(buildResult.data)
    } else {
      props.valueSignal.set(undefined)
    }
  }

  function selectKind(kind: SelectorKindChoice) {
    selectedKind.set(kind)
    emitCanonicalTarget(kind)
  }

  function selectOrg(id: string) {
    selectedOrgId.set(id)
    // reset downstream lists
    teamCursor.set(null)
    teamsList.set([])
    projectCursor.set(null)
    projectsList.set([])
    noteCursor.set(null)
    notesList.set([])
    if (selectedKind.get() === "organization") {
      emitCanonicalTarget("organization")
    }
  }

  function selectTeam(id: string) {
    selectedTeamId.set(id)
    // Parent inference: find selected team and infer its org
    const team = teamsList.get().find((t) => t.teamId === id)
    if (team?.orgId) {
      selectedOrgId.set(team.orgId)
    }
    projectCursor.set(null)
    projectsList.set([])
    noteCursor.set(null)
    notesList.set([])
    if (selectedKind.get() === "team") {
      emitCanonicalTarget("team")
    }
  }

  function selectProject(id: string) {
    selectedProjectId.set(id)
    // Parent inference: find selected project and infer team and org
    const project = projectsList.get().find((p) => p.projectId === id)
    if (project) {
      if (project.teamId) selectedTeamId.set(project.teamId)
      if (project.orgId) selectedOrgId.set(project.orgId)
    }
    noteCursor.set(null)
    notesList.set([])
    if (selectedKind.get() === "project") {
      emitCanonicalTarget("project")
    }
  }

  function selectNote(id: string) {
    selectedNoteId.set(id)
    // Parent inference: find selected note and infer project, team, and org
    const note = notesList.get().find((n) => n.noteId === id)
    if (note) {
      if (note.projectId) selectedProjectId.set(note.projectId)
      if (note.teamId) selectedTeamId.set(note.teamId)
      if (note.orgId) selectedOrgId.set(note.orgId)
    }
    if (selectedKind.get() === "note") {
      emitCanonicalTarget("note")
    }
  }

  function loadMoreOrgs() {
    const nextCursor = orgsContinueCursor.get()
    if (!orgsDone.get() && nextCursor) {
      orgCursor.set(nextCursor)
    }
  }

  function loadMoreTeams() {
    const nextCursor = teamsContinueCursor.get()
    if (!teamsDone.get() && nextCursor) {
      teamCursor.set(nextCursor)
    }
  }

  function loadMoreProjects() {
    const nextCursor = projectsContinueCursor.get()
    if (!projectsDone.get() && nextCursor) {
      projectCursor.set(nextCursor)
    }
  }

  function loadMoreNotes() {
    const nextCursor = notesContinueCursor.get()
    if (!notesDone.get() && nextCursor) {
      noteCursor.set(nextCursor)
    }
  }

  const inferredParentSummary = createMemo(() => {
    const kind = selectedKind.get()
    if (kind === "unassigned" || kind === "organization") return null
    const parts: string[] = []
    if (selectedOrgId.get()) {
      const org = orgsList.get().find((o) => o._id === selectedOrgId.get())
      parts.push(`Org: ${org?.name || org?.orgHandle || selectedOrgId.get()}`)
    }
    if (selectedTeamId.get() && (kind === "project" || kind === "note")) {
      const team = teamsList.get().find((t) => t.teamId === selectedTeamId.get())
      parts.push(`Team: ${team?.name || selectedTeamId.get()}`)
    }
    if (selectedProjectId.get() && kind === "note") {
      const project = projectsList.get().find((p) => p.projectId === selectedProjectId.get())
      parts.push(`Project: ${project?.name || selectedProjectId.get()}`)
    }
    if (parts.length === 0) return null
    return parts.join(" → ")
  })

  return {
    selectedKind: () => selectedKind.get(),
    selectKind,
    // Orgs
    orgs: () => orgsList.get(),
    selectedOrgId: () => selectedOrgId.get(),
    selectOrg,
    hasMoreOrgs: () => !orgsDone.get() && !!orgsContinueCursor.get(),
    loadMoreOrgs,
    // Teams
    teams: () => teamsList.get(),
    selectedTeamId: () => selectedTeamId.get(),
    selectTeam,
    hasMoreTeams: () => !teamsDone.get() && !!teamsContinueCursor.get(),
    loadMoreTeams,
    // Projects
    projects: () => projectsList.get(),
    selectedProjectId: () => selectedProjectId.get(),
    selectProject,
    hasMoreProjects: () => !projectsDone.get() && !!projectsContinueCursor.get(),
    loadMoreProjects,
    // Notes
    notes: () => notesList.get(),
    selectedNoteId: () => selectedNoteId.get(),
    selectNote,
    hasMoreNotes: () => !notesDone.get() && !!notesContinueCursor.get(),
    loadMoreNotes,
    // Info
    canonicalTarget: () => props.valueSignal.get(),
    inferredParentSummary,
    disabled: () => props.disabled?.() ?? false,
  }
}
