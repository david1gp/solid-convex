import type { ClassValue } from "cn"
import { cn } from "cn"

export function classMerge(...inputs: ClassValue[]) {
  return cn(...inputs)
}
