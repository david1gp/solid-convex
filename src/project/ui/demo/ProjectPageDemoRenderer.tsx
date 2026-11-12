import { noteListSectionDemoStateCreate } from "#src/note/ui/demo/noteListSectionDemoStateCreate.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { projectDetailPageDemoStateCreate } from "#src/project/ui/demo/projectDetailPageDemoStateCreate.ts"
import { projectFormDemoStateCreate } from "#src/project/ui/demo/projectFormDemoStateCreate.ts"
import { projectListSectionDemoStateCreate } from "#src/project/ui/demo/projectListSectionDemoStateCreate.ts"
import { projectPageDemoFixturesGet } from "#src/project/ui/demo/projectPageDemoFixturesGet.ts"
import { projectPageDemoHref } from "#src/project/ui/demo/projectPageDemoHref.ts"
import { projectPageDemoRendererStateCreate } from "#src/project/ui/demo/projectPageDemoRendererStateCreate.ts"
import { ProjectCreatePage } from "#src/project/ui/ProjectCreatePage.tsx"
import { ProjectDetailPage } from "#src/project/ui/ProjectDetailPage.tsx"
import { ProjectEditPage } from "#src/project/ui/ProjectEditPage.tsx"
import { ProjectListPage } from "#src/project/ui/ProjectListPage.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

function ProjectListDemo() {
  const route = projectPageDemoRendererStateCreate()
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={projectPageDemoHref("list", { orgHandle: route.orgHandle(), teamId: route.teamId() })}>
          Projects demo list
        </LinkButtonInternal>
      </nav>
      <ProjectListPage demo={{ section: projectListSectionDemoStateCreate(route.orgHandle, route.teamId) }} />
    </>
  )
}

function ProjectDetailDemo() {
  const route = projectPageDemoRendererStateCreate()
  const fixtures = projectPageDemoFixturesGet()
  const teamId = () => route.teamId() ?? fixtures.get(route.projectId())?.teamId
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={projectPageDemoHref("list", { orgHandle: route.orgHandle(), teamId: route.teamId() })}>
          Projects demo list
        </LinkButtonInternal>
      </nav>
      <ProjectDetailPage
        demo={{
          detail: projectDetailPageDemoStateCreate(route.orgHandle, teamId, route.projectId),
          notes: noteListSectionDemoStateCreate(route.orgHandle, teamId, route.projectId),
        }}
      />
    </>
  )
}

function ProjectCreateDemo() {
  const route = projectPageDemoRendererStateCreate()
  const project = () => undefined as Project | undefined
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={projectPageDemoHref("list", { orgHandle: route.orgHandle(), teamId: route.teamId() })}>
          Projects demo list
        </LinkButtonInternal>
      </nav>
      <ProjectCreatePage demo={{ form: projectFormDemoStateCreate(route.teamId, route.orgHandle, project) }} />
    </>
  )
}

function ProjectEditDemo() {
  const route = projectPageDemoRendererStateCreate()
  const fixtures = projectPageDemoFixturesGet()
  const project = () => fixtures.get(route.projectId())
  const teamId = () => route.teamId() ?? project()?.teamId
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={projectPageDemoHref("list", { orgHandle: route.orgHandle(), teamId: route.teamId() })}>
          Projects demo list
        </LinkButtonInternal>
      </nav>
      <ProjectEditPage
        demo={{
          orgHandle: route.orgHandle,
          teamId,
          project,
          form: projectFormDemoStateCreate(teamId, route.orgHandle, project),
        }}
      />
    </>
  )
}

/** Opt-in map: caller mounts only these isolated entries inside the demo boundary. */
export const projectPageDemoRendererMap = {
  "/project": ProjectListDemo,
  "/org/:orgHandle/project": ProjectListDemo,
  "/team/:teamId/project": ProjectListDemo,
  "/org/:orgHandle/team/:teamId/project": ProjectListDemo,
  "/team/:teamId/project/create": ProjectCreateDemo,
  "/org/:orgHandle/team/:teamId/project/create": ProjectCreateDemo,
  "/project/:projectId/edit": ProjectEditDemo,
  "/org/:orgHandle/project/:projectId/edit": ProjectEditDemo,
  "/team/:teamId/project/:projectId/edit": ProjectEditDemo,
  "/org/:orgHandle/team/:teamId/project/:projectId/edit": ProjectEditDemo,
  "/project/:projectId": ProjectDetailDemo,
  "/org/:orgHandle/project/:projectId": ProjectDetailDemo,
  "/team/:teamId/project/:projectId": ProjectDetailDemo,
  "/org/:orgHandle/team/:teamId/project/:projectId": ProjectDetailDemo,
} as const
