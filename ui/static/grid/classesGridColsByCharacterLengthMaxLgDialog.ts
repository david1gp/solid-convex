export function classesGridColsByCharacterLengthMaxLgDialog(chars: number): string {
  if (chars < 20) return "grid " + "grid-cols-2 " + "sm:grid-cols-3 " + "md:grid-cols-4 " + "lg:grid-cols-5 "
  if (chars < 40) return "grid " + "grid-cols-1 " + "md:grid-cols-2 "
  return "grid " + "grid-cols-1 "
}
