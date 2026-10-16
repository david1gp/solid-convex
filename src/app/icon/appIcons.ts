import { mdiAccountCogOutline } from "@adaptive-ds/mdi/mdiAccountCogOutline.js"
import { mdiAccountGroup } from "@adaptive-ds/mdi/mdiAccountGroup.js"
import { mdiAccountMultipleOutline } from "@adaptive-ds/mdi/mdiAccountMultipleOutline.js"
import { mdiAccountOutline } from "@adaptive-ds/mdi/mdiAccountOutline.js"
import { mdiArrowLeft } from "@adaptive-ds/mdi/mdiArrowLeft.js"
import { mdiBriefcaseOutline } from "@adaptive-ds/mdi/mdiBriefcaseOutline.js"
import { mdiCheck } from "@adaptive-ds/mdi/mdiCheck.js"
import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import { mdiEmailFast } from "@adaptive-ds/mdi/mdiEmailFast.js"
import { mdiEmailOutline } from "@adaptive-ds/mdi/mdiEmailOutline.js"
import { mdiFileDocument } from "@adaptive-ds/mdi/mdiFileDocument.js"
import { mdiInformationOutline } from "@adaptive-ds/mdi/mdiInformationOutline.js"
import { mdiLogoutVariant } from "@adaptive-ds/mdi/mdiLogoutVariant.js"
import { mdiNoteTextOutline } from "@adaptive-ds/mdi/mdiNoteTextOutline.js"
import { mdiPlus } from "@adaptive-ds/mdi/mdiPlus.js"
import { mdiReload } from "@adaptive-ds/mdi/mdiReload.js"
import { mdiSquareEditOutline } from "@adaptive-ds/mdi/mdiSquareEditOutline.js"
import { mdiTrashCan } from "@adaptive-ds/mdi/mdiTrashCan.js"
import { mdiTrashCanOutline } from "@adaptive-ds/mdi/mdiTrashCanOutline.js"
import { mdiViewDashboardOutline } from "@adaptive-ds/mdi/mdiViewDashboardOutline.js"

export const appIcons = {
  organization: mdiAccountGroup,
  team: mdiAccountMultipleOutline,
  project: mdiBriefcaseOutline,
  member: mdiAccountOutline,
  invitation: mdiEmailOutline,
  note: mdiNoteTextOutline,
  resource: mdiFileDocument,
  overview: mdiViewDashboardOutline,
  userManagement: mdiAccountCogOutline,
  details: mdiInformationOutline,
  add: mdiPlus,
  create: mdiPlus,
  edit: mdiSquareEditOutline,
  delete: mdiTrashCanOutline,
  dangerDelete: mdiTrashCan,
  cancel: mdiClose,
  save: mdiCheck,
  back: mdiArrowLeft,
  email: mdiEmailOutline,
  resend: mdiEmailFast,
  accept: mdiCheck,
  leave: mdiLogoutVariant,
  retry: mdiReload,
} as const

export type AppIcons = typeof appIcons
export type AppIconName = keyof typeof appIcons
