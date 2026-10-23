import { mdiAccountQuestion } from "@adaptive-ds/mdi/mdiAccountQuestion.js"
import { mdiEmailSync } from "@adaptive-ds/mdi/mdiEmailSync.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"

export type OrgInvitationStatus = keyof typeof orgInvitationStatus

export const orgInvitationStatus = {
  sendingEmail: "sendingEmail",
  waitingForConfirmation: "waitingForConfirmation",
} as const

export const orgInvitationStatusText = {
  sendingEmail: ttc("Sending Invitation Email..."),
  waitingForConfirmation: ttc("Waiting for manual confirmation"),
} as const

export const orgInvitationStatusIcon = {
  sendingEmail: mdiEmailSync,
  waitingForConfirmation: mdiAccountQuestion,
} as const

export const orgInvitationStatusClasses = {
  sendingEmail: "text-yellow-600",
  waitingForConfirmation: "text-yellow-600",
} as const

export function invitationModelToStatus(i: OrgInvitationModel): OrgInvitationStatus {
  if (i.emailSendAt) return orgInvitationStatus.waitingForConfirmation
  return orgInvitationStatus.sendingEmail
}
