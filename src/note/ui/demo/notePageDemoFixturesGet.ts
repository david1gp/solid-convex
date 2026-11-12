import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import type { Note } from "#src/note/model/noteSchema.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

const key = "note-page-demo-fixtures"
const date = "2026-09-28T00:00:00.000Z"

const launchChecklist = `# Launch checklist

Website Redesign goes live 2026-12-15. Owners in Core Team.

## Goals

- [x] Draft announcement post
- [x] Review pricing page copy
- [ ] Publish changelog
- [ ] Notify pilot customers

## Rollout order

1. Deploy to staging
2. Run smoke tests
3. Flip the switch
4. Monitor error budget

Risks: DNS propagation can take **up to 48 hours**. Rollback plan is linked in the project notes.`

const meetingNotes = `# Sync notes 2026-09-28

Attendees: Test User, Amina, Rafa.

## Discussed

- Mobile App beta scope
- Brand Refresh kickoff date

## Decisions

- Beta ships 2026-10-20 with offline mode
- Design owns the empty states

## Tasks

- [ ] Amina: finalize onboarding flow
- [x] Rafa: set up device lab`

const brandIdeas = `# Brand directions

Three routes for the Brand Refresh exploration.

## Routes

1. Warm minimal
2. Bold geometric
3. Quiet editorial

Next step: mood boards by Friday.`

/** Reactive in-memory note collection for all note demo routes. Never persists. */
export function notePageDemoFixturesGet() {
  const store = pageDemoFixtureStoreGet()
  const existing = store.get<ReturnType<typeof noteFixturesCreate>>(key)
  if (existing) return existing
  const fixtures = noteFixturesCreate()
  return store.set(key, fixtures)
}

function noteFixturesCreate() {
  const notes = createSignalObject<Note[]>([
    {
      noteId: "note-1" as Note["noteId"],
      projectId: "project-1" as Note["projectId"],
      teamId: "team-1" as Note["teamId"],
      orgId: "org-sample-1" as Note["orgId"],
      title: "Launch checklist",
      content: launchChecklist,
      createdAt: date,
      updatedAt: date,
    },
    {
      noteId: "note-2" as Note["noteId"],
      projectId: "project-1" as Note["projectId"],
      teamId: "team-1" as Note["teamId"],
      orgId: "org-sample-1" as Note["orgId"],
      title: "Sync notes 2026-09-28",
      content: meetingNotes,
      createdAt: date,
      updatedAt: date,
    },
    {
      noteId: "note-3" as Note["noteId"],
      projectId: "project-3" as Note["projectId"],
      teamId: "team-2" as Note["teamId"],
      orgId: "org-sample-1" as Note["orgId"],
      title: "Brand directions",
      content: brandIdeas,
      createdAt: date,
      updatedAt: date,
    },
  ])
  return {
    notes: notes.get,
    get: (noteId: string) => notes.get().find((note) => note.noteId === noteId),
    add(data: { content: string; title: string; projectId: string; teamId: string }) {
      const baseId = `demo-note-${notes.get().length + 1}`
      let noteId = baseId
      let suffix = 2
      while (notes.get().some((note) => note.noteId === noteId)) {
        noteId = `${baseId}-${suffix++}`
      }
      const note: Note = {
        noteId: noteId as Note["noteId"],
        projectId: data.projectId as Note["projectId"],
        teamId: data.teamId as Note["teamId"],
        orgId: "org-sample-1" as Note["orgId"],
        title: data.title,
        content: data.content,
        createdAt: date,
        updatedAt: date,
      }
      notes.set([...notes.get(), note])
      return note
    },
    edit(noteId: string, data: { content: string; title: string }) {
      const current = notes.get().find((note) => note.noteId === noteId)
      if (!current) return undefined
      const updated: Note = { ...current, ...data, updatedAt: date }
      notes.set(notes.get().map((note) => (note.noteId === noteId ? updated : note)))
      return updated
    },
    remove(noteId: string) {
      const current = notes.get().find((note) => note.noteId === noteId)
      if (!current) return undefined
      notes.set(notes.get().filter((note) => note.noteId !== noteId))
      return current
    },
  }
}
