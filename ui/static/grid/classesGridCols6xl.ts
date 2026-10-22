import { classArr } from "#ui/utils/classArr.js"

/**
 * ~200 px (13rem, ~20ch) / col
 * 6 = 6x1, 3x2, 2x3
 * xl: 1280/200 = 6.4
 * lg: 1024/200 = 5.12
 * md: 768/200 = 3.84
 * sm: 640/200 = 3.2
 * xs: 400/200 = 2
 */
export const classesGridCols6xl = classArr("grid grid-cols-2", "sm:grid-cols-3", "md:grid-cols-4", "xl:grid-cols-6")
