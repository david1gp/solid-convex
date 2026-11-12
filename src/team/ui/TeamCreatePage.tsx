import { teamCreatePageStateCreate } from "#src/team/ui/teamCreatePageStateCreate.ts"
import { teamFormStateCreate } from "#src/team/ui/teamFormStateCreate.ts"
import { TeamForm } from "#src/team/ui/TeamForm.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamCreatePage(p: { demo?: { form: ReturnType<typeof teamFormStateCreate> } }) {
  const state = teamCreatePageStateCreate()
  return (
    <PageWrapper>
      <TeamForm orgHandle={state.orgHandle()} demoState={p.demo?.form} />
    </PageWrapper>
  )
}
