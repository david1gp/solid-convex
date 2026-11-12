import { ttc } from "#src/app/i18n/ttc.ts"
import { Img } from "#ui/static/img/Img.jsx"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface ProfileSectionImageProps extends MayHaveClass {
  image?: string
  name: string
}

export function ProfileSectionImage(p: ProfileSectionImageProps) {
  return (
    <section id="image" class="flex flex-col items-center space-y-4">
      <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
        {p.image ? (
          <Img src={p.image} alt={ttc("Profile picture")} class="w-full h-full object-cover" />
        ) : (
          <div class="w-full h-full bg-hover flex items-center justify-center">
            <span class="text-3xl font-bold text-muted-foreground">{p.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </section>
  )
}
