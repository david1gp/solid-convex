import { ProjectForm } from "#src/project/ui/ProjectForm.tsx"
import { projectCreatePageStateCreate } from "#src/project/ui/projectCreatePageStateCreate.ts"
import { projectFormStateCreate } from "#src/project/ui/projectFormStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectCreatePage(p: { demo?: { form: ReturnType<typeof projectFormStateCreate> } }) {
  const state = projectCreatePageStateCreate()
  return (
    <PageWrapper>
      <ProjectForm teamId={state.teamId()} orgHandle={state.orgHandle()} demoState={p.demo?.form} />
    </PageWrapper>
  )
}
