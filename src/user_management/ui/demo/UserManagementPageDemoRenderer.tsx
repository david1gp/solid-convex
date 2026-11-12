import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { userManagementPageDemoStateCreate } from "#src/user_management/ui/demo/userManagementPageDemoStateCreate.ts"
import { UserManagementPage } from "#src/user_management/ui/UserManagementPage.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

function UserManagementListDemo() {
  const state = userManagementPageDemoStateCreate()
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={pageDemoHref("/user-management")}>User management demo</LinkButtonInternal>
      </nav>
      <UserManagementPage demo={state} />
    </>
  )
}

function UserManagementDetailDemo() {
  const state = userManagementPageDemoStateCreate()
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={pageDemoHref("/user-management")}>User management demo</LinkButtonInternal>
      </nav>
      <UserManagementPage demo={state} />
    </>
  )
}

/** Opt-in map: caller mounts only these isolated entries inside the demo boundary. */
export const userManagementPageDemoRendererMap = {
  "/user-management": UserManagementListDemo,
  "/user-management/:userId": UserManagementDetailDemo,
} as const
