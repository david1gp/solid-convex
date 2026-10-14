import { defineSchema } from "convex/server"
import { authTables } from "#src/auth/convex/authTables.ts"
import { fileTables } from "#src/file/convex/fileTables.ts"
import { hierarchyDeleteTables } from "#src/hierarchy_delete/convex/hierarchyDeleteTables.ts"
import { kvTables } from "#src/file/kv/kvTables.ts"
import { noteTables } from "#src/note/convex/noteTables.ts"
import { orgInvitationTables } from "#src/org/invitation_convex/orgInvitationTables.ts"
import { orgMemberTables } from "#src/org/member_convex/orgMemberTables.ts"
import { orgTables } from "#src/org/org_convex/orgTables.ts"
import { projectTables } from "#src/project/convex/projectTables.ts"
import { resourceTables } from "#src/resource/convex/resourceTables.ts"
import { teamTables } from "#src/team/convex/teamTables.ts"

const schema = defineSchema({
  ...authTables,
  ...orgTables,
  ...teamTables,
  ...projectTables,
  ...noteTables,
  ...orgInvitationTables,
  ...orgMemberTables,
  ...resourceTables,
  ...fileTables,
  ...kvTables,
  ...hierarchyDeleteTables,
})

export default schema
