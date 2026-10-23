import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { language } from "#src/app/i18n/language.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"

export function orgInvitationDemoFixturesGet(orgHandle: string): OrgInvitationModel[] {
  const store = pageDemoFixtureStoreGet()
  const key = `page-demo:org-invitations:${orgHandle}`
  return (
    store.get<OrgInvitationModel[]>(key) ??
    store.set(key, [
      {
        orgHandle,
        invitationCode: "invite-1",
        invitedName: "Alex Example",
        invitedEmail: "alex@example.com",
        l: language.en,
        role: "member",
        invitedBy: "demo-admin",
        emailSendAmount: 1,
        emailSendAt: "2026-09-28T09:00:00.000Z",
        createdAt: "2026-09-28T09:00:00.000Z",
        updatedAt: "2026-09-28T09:00:00.000Z",
      },
    ])
  )
}
