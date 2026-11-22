import { mdiAlphaDCircleOutline } from "@adaptive-ds/mdi/mdiAlphaDCircleOutline.js"
import { demosLinkVisible } from "#src/utils/ui/demosLinkVisible.ts"
import { pathDemos } from "#ui/demo_pages/pathDemos.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"

export function DemosLinkButton() {
  if (!demosLinkVisible(import.meta.env.PUBLIC_ENV_MODE ?? import.meta.env.MODE)) return null
  return (
    <LinkButtonIconOnlyInternal
      to={pathDemos}
      title="Demos"
      variant={buttonVariant.ghost}
      icon={mdiAlphaDCircleOutline}
    />
  )
}
