import { teamCreatePageStateCreate } from "#src/team/ui/teamCreatePageStateCreate.ts"
import { TeamForm } from "#src/team/ui/TeamForm.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamCreatePage() {
  const state = teamCreatePageStateCreate()
  return (
    <PageWrapper>
      <TeamForm orgHandle={state.orgHandle()} />
    </PageWrapper>
  )
}
