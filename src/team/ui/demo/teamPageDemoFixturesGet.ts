import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import type { Team } from "#src/team/model/teamSchema.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

const key = "team-page-demo-fixtures"
const date = "2026-09-28T00:00:00.000Z"

/** Reactive in-memory team collection for all team demo routes. Never persists. */
export function teamPageDemoFixturesGet() {
  const store = pageDemoFixtureStoreGet()
  const existing = store.get<ReturnType<typeof teamFixturesCreate>>(key)
  if (existing) return existing
  const fixtures = teamFixturesCreate()
  return store.set(key, fixtures)
}

function teamFixturesCreate() {
  const teams = createSignalObject<Team[]>([
    {
      teamId: "team-1" as Team["teamId"],
      orgId: "org-sample-1" as Team["orgId"],
      name: "Core Team",
      description: "Owns the core product surface for Sample Organization.",
      createdAt: date,
      updatedAt: date,
    },
    {
      teamId: "team-2" as Team["teamId"],
      orgId: "org-sample-1" as Team["orgId"],
      name: "Design",
      description: "Brand, marketing site, and design system.",
      createdAt: date,
      updatedAt: date,
    },
  ])
  return {
    teams: teams.get,
    get: (teamId: string) => teams.get().find((team) => team.teamId === teamId),
    add(data: { name: string; description?: string }) {
      const baseId = `demo-team-${teams.get().length + 1}`
      let teamId = baseId
      let suffix = 2
      while (teams.get().some((team) => team.teamId === teamId)) {
        teamId = `${baseId}-${suffix++}`
      }
      const team: Team = {
        teamId: teamId as Team["teamId"],
        orgId: "org-sample-1" as Team["orgId"],
        name: data.name,
        description: data.description,
        createdAt: date,
        updatedAt: date,
      }
      teams.set([...teams.get(), team])
      return team
    },
    edit(teamId: string, data: { name: string; description?: string }) {
      const current = teams.get().find((team) => team.teamId === teamId)
      if (!current) return undefined
      const updated: Team = { ...current, ...data, updatedAt: date }
      teams.set(teams.get().map((team) => (team.teamId === teamId ? updated : team)))
      return updated
    },
    remove(teamId: string) {
      const current = teams.get().find((team) => team.teamId === teamId)
      if (!current) return undefined
      teams.set(teams.get().filter((team) => team.teamId !== teamId))
      return current
    },
  }
}
