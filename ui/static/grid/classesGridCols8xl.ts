import { classArr } from "#ui/utils/classArr.js"

/**
 * ~160 px (9rem, ~16ch) / col
 * 8 = 8x1, 4x2, 2x4
 * xl: 1280/160 = 8
 * lg: 1024/160 = 6.4
 * md: 768/160 = 4.8
 * sm: 640/160 = 4
 * xs: 400/160 = 2.5
 */
export const classesGridCols8xl = classArr(
  "grid grid-cols-3",
  "sm:grid-cols-4",
  "md:grid-cols-5",
  "lg:grid-cols-6",
  "xl:grid-cols-8",
)
