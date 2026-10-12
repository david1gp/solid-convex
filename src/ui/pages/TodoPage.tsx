import { urlTodo } from "#src/app/pages/urlTodo.ts"
import { TodoSection, type TodoSectionProps } from "#src/ui/pages/TodoSection.tsx"
import { SetPageTitle } from "#ui/static/meta/SetPageTitle.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TodoPage(p: TodoSectionProps = {}) {
  return (
    <PageWrapper>
      <SetPageTitle title={p.title ?? urlTodo()} />
      <TodoSection {...p} />
    </PageWrapper>
  )
}
