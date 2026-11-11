import { mdiAlphaDCircleOutline } from "@adaptive-ds/mdi/mdiAlphaDCircleOutline.js"
import { isProdEnvVite } from "#src/utils/ui/isProdEnvVite.ts"
import { pathDemos } from "#ui/demo_pages/pathDemos.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"

export function DemosLinkButton() {
  if (isProdEnvVite()) return null
  return (
    <LinkButtonIconOnlyInternal
      to={pathDemos}
      title="Demos"
      variant={buttonVariant.ghost}
      icon={mdiAlphaDCircleOutline}
    />
  )
}
