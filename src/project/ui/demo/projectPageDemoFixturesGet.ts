import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

const key = "project-page-demo-fixtures"
const date = "2026-09-28T00:00:00.000Z"

/** Reactive in-memory project collection for all project demo routes. Never persists. */
export function projectPageDemoFixturesGet() {
  const store = pageDemoFixtureStoreGet()
  const existing = store.get<ReturnType<typeof projectFixturesCreate>>(key)
  if (existing) return existing
  const fixtures = projectFixturesCreate()
  return store.set(key, fixtures)
}

function projectFixturesCreate() {
  const projects = createSignalObject<Project[]>([
    {
      projectId: "project-1" as Project["projectId"],
      teamId: "team-1" as Project["teamId"],
      orgId: "org-sample-1" as Project["orgId"],
      name: "Website Redesign",
      description: "Active: marketing site overhaul for Sample Organization. Kickoff 2026-09-01, launch 2026-12-15.",
      createdAt: date,
      updatedAt: date,
    },
    {
      projectId: "project-2" as Project["projectId"],
      teamId: "team-1" as Project["teamId"],
      orgId: "org-sample-1" as Project["orgId"],
      name: "Mobile App",
      description: "In progress: companion app. Beta 2026-10-20, release 2027-02-01.",
      createdAt: date,
      updatedAt: date,
    },
    {
      projectId: "project-3" as Project["projectId"],
      teamId: "team-2" as Project["teamId"],
      orgId: "org-sample-1" as Project["orgId"],
      name: "Brand Refresh",
      description: "Planning: new visual identity and design tokens. Starts 2026-11-01.",
      createdAt: date,
      updatedAt: date,
    },
  ])
  return {
    projects: projects.get,
    get: (projectId: string) => projects.get().find((project) => project.projectId === projectId),
    add(data: { name: string; description?: string; teamId: string }) {
      const baseId = `demo-project-${projects.get().length + 1}`
      let projectId = baseId
      let suffix = 2
      while (projects.get().some((project) => project.projectId === projectId)) {
        projectId = `${baseId}-${suffix++}`
      }
      const project: Project = {
        projectId: projectId as Project["projectId"],
        teamId: data.teamId as Project["teamId"],
        orgId: "org-sample-1" as Project["orgId"],
        name: data.name,
        description: data.description,
        createdAt: date,
        updatedAt: date,
      }
      projects.set([...projects.get(), project])
      return project
    },
    edit(projectId: string, data: { name: string; description?: string }) {
      const current = projects.get().find((project) => project.projectId === projectId)
      if (!current) return undefined
      const updated: Project = { ...current, ...data, updatedAt: date }
      projects.set(projects.get().map((project) => (project.projectId === projectId ? updated : project)))
      return updated
    },
    remove(projectId: string) {
      const current = projects.get().find((project) => project.projectId === projectId)
      if (!current) return undefined
      projects.set(projects.get().filter((project) => project.projectId !== projectId))
      return current
    },
  }
}
