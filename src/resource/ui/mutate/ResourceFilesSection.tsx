import { ttc } from "#src/app/i18n/ttc.ts"
import { ResourceFileListLoader } from "#src/file/ui/list/ResourceFileListLoader.tsx"
import { ResourceFileAdd } from "#src/file/ui/mutate/ResourceFileAdd.tsx"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface ResourceFilesSectionProps extends HasResourceId, MayHaveClass {}
export function ResourceFilesSection(p: ResourceFilesSectionProps) {
  return (
    <section class={classMerge("my-4", p.class)}>
      <h2 class="text-sm font-semibold text-muted-foreground">{ttc("Manage Files")}</h2>
      <ResourceFileListLoader mode={formMode.add} resourceId={p.resourceId} />
      <ResourceFileAdd resourceId={p.resourceId} />
    </section>
  )
}
