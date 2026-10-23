import { classArr } from "#ui/utils/classArr.js"

/**
 * 1024/3 = 341 px = 19rem / col
 * xl: 1280/340 = 3.75
 * lg: 1024/340 = 3
 * md: 768/340 = 2.26
 * sm: 640/340 = 1.8
 * xs: 400/340 = 1.17
 */
export const classesGridCols3lg = classArr("grid grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3")
