import { classesGridCols2xl } from "./classesGridCols2xl.js"
import { classesGridCols3xl } from "./classesGridCols3xl.js"
import { classesGridCols4xl } from "./classesGridCols4xl.js"
import { classesGridCols6xl } from "./classesGridCols6xl.js"
import { classesGridCols8xl } from "./classesGridCols8xl.js"

export function classesGridColsByCharacterLength(chars: number): string {
  if (chars < 16) return classesGridCols8xl
  if (chars < 20) return classesGridCols6xl
  if (chars < 32) return classesGridCols4xl
  if (chars < 40) return classesGridCols3xl
  return classesGridCols2xl
}
