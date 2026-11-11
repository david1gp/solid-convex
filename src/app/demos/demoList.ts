import { lazy } from "solid-js"
import type { DemoListType } from "#ui/generate_demo_list/DemoListType.ts"

const DemoOrgMemberList = lazy(async () => {
  const c = await import("#src/org/member_ui/list/DemoOrgMemberList.tsx")
  return { default: c.DemoOrgMemberList }
})

const DemoOrgInvitationList = lazy(async () => {
  const c = await import("#src/org/invitation_ui/list/DemoOrgInvitationList.tsx")
  return { default: c.DemoOrgInvitationList }
})

const DemoAuthLinks = lazy(async () => {
  const c = await import("#src/auth/ui/DemoAuthLinks.tsx")
  return { default: c.DemoAuthLinks }
})

const DemoSignInErrorPage = lazy(async () => {
  const c = await import("#src/auth/ui/sign_in/error/DemoSignInErrorPage.tsx")
  return { default: c.DemoSignInErrorPage }
})

const DemoAccessBlocked = lazy(async () => {
  const c = await import("#src/auth/ui/locked/DemoAccessBlocked.tsx")
  return { default: c.DemoAccessBlocked }
})

const DemoUploadArea = lazy(async () => {
  const c = await import("#src/file/ui/upload_file/DemoUploadArea.tsx")
  return { default: c.DemoUploadArea }
})

const DemoAnimateFadeIn = lazy(async () => {
  const c = await import("#src/ui/loaders/DemoAnimateFadeIn.tsx")
  return { default: c.DemoAnimateFadeIn }
})

const DemoButtons = lazy(async () => {
  const c = await import("#src/ui/buttons/DemoButtons.tsx")
  return { default: c.DemoButtons }
})

const DemoLoaders = lazy(async () => {
  const c = await import("#src/ui/loaders/DemoLoaders.tsx")
  return { default: c.DemoLoaders }
})

const DemosLinkButton = lazy(async () => {
  const c = await import("#src/ui/links/DemosLinkButton.tsx")
  return { default: c.DemosLinkButton }
})

const DemoR2Upload = lazy(async () => {
  const c = await import("#src/r2/ui/DemoR2Upload.tsx")
  return { default: c.DemoR2Upload }
})

export const demoList = {
  auth: {
    DemoAuthLinks: DemoAuthLinks,
    DemoSignInErrorPage: DemoSignInErrorPage,
    DemoAccessBlocked: DemoAccessBlocked,
  },
  file: {
    DemoUploadArea: DemoUploadArea,
  },
  org: {
    DemoOrgMemberList: DemoOrgMemberList,
    DemoOrgInvitationList: DemoOrgInvitationList,
  },
  r2: {
    DemoR2Upload: DemoR2Upload,
  },
  ui: {
    DemoAnimateFadeIn: DemoAnimateFadeIn,
    DemoButtons: DemoButtons,
    DemoLoaders: DemoLoaders,
    DemosLinkButton: DemosLinkButton,
  },
} as const satisfies DemoListType
