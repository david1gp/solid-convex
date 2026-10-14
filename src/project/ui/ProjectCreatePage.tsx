import { ProjectForm } from "#src/project/ui/ProjectForm.tsx"
import { projectCreatePageStateCreate } from "#src/project/ui/projectCreatePageStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectCreatePage() {
  const state = projectCreatePageStateCreate()
  return (
    <PageWrapper>
      <ProjectForm teamId={state.teamId()} orgHandle={state.orgHandle()} />
    </PageWrapper>
  )
}
