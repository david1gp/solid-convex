import { classArr } from "#ui/utils/classArr.js"

/**
 * ~320 px (18rem, ~32ch) / col
 * 4 = 4x1, 2x2
 * xl: 1280/320 = 4
 * lg: 1024/320 = 3.2
 * md: 768/320 = 2.4
 * sm: 640/320 = 2
 * xs: 400/320 = 1.25
 */
export const classesGridCols4xl = classArr("grid grid-cols-1", "sm:grid-cols-2", "md:grid-cols-2", "xl:grid-cols-4")
