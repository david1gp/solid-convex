import { createEffect } from "solid-js"
import { api } from "#convex/_generated/api.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { orgInvitationSchema } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { orgMemberProfileSchema } from "#src/org/member_model/OrgMemberProfile.ts"
import type { OrgViewPageType } from "#src/org/org_model/OrgViewPageType.ts"
import { orgViewPageSchema } from "#src/org/org_model/OrgViewPageType.ts"
import { orgNameSet } from "#src/org/org_ui/orgNameRecordSignal.ts"
import { createQueryCached } from "#src/utils/cache/createQueryCached.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"

export function orgViewPageStateCreate(orgHandle: () => string) {
  const getDataQuery = queryCreate(api.org.orgGetPageQuery, { token: userTokenGet(), orgHandle: orgHandle() })
  const getDataResult = createQueryCached<OrgViewPageType>(
    getDataQuery,
    `orgGetPageQuery/${orgHandle()}`,
    orgViewPageSchema,
  )
  const membersPagination = cursorPaginationCreate({
    query: api.org.orgMembersListQuery,
    queryKey: "orgMembersListQuery",
    args: () => ({ token: userTokenGet(), orgHandle: orgHandle() }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: orgHandle,
    itemSchema: orgMemberProfileSchema,
  })
  const invitationsPagination = cursorPaginationCreate({
    query: api.org.orgInvitationsListQuery,
    queryKey: "orgInvitationsListQuery",
    args: () => ({ token: userTokenGet(), orgHandle: orgHandle() }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: orgHandle,
    itemSchema: orgInvitationSchema,
  })
  createEffect(
    () => getDataResult(),
    (result) => {
      if (result?.success && result.data.org.name) orgNameSet(result.data.org.orgHandle, result.data.org.name)
    },
  )
  return { getDataResult, membersPagination, invitationsPagination }
}
