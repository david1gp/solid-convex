import type { Component, ComponentProps } from "solid-js"
import { splitProps } from "solid-js"
import { classMerge } from "#ui/utils/classMerge.js"

const Table: Component<ComponentProps<"table">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return (
    <div class={"relative w-full overflow-auto"}>
      <table class={classMerge("w-full caption-bottom text-sm", s.class)} {...rest} />
    </div>
  )
}

const TableHeader: Component<ComponentProps<"thead">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <thead class={classMerge("[&_tr]:border-b", s.class)} {...rest} />
}

const TableBody: Component<ComponentProps<"tbody">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <tbody class={classMerge("[&_tr:last-child]:border-0", s.class)} {...rest} />
}

const TableFooter: Component<ComponentProps<"tfoot">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <tfoot class={classMerge("bg-primary text-primary-foreground font-medium", s.class)} {...rest} />
}

const TableRow: Component<ComponentProps<"tr">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return (
    <tr
      class={classMerge("hover:bg-hover data-[state=selected]:bg-muted border-b transition-colors", s.class)}
      {...rest}
    />
  )
}

const TableHead: Component<ComponentProps<"th">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return (
    <th
      class={classMerge(
        "text-muted-foreground h-8 px-2 text-left align-middle text-xs font-medium [&:has([role=checkbox])]:pr-0",
        s.class,
      )}
      {...rest}
    />
  )
}

const TableCell: Component<ComponentProps<"td">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <td class={classMerge("h-8 px-2 py-1 align-middle [&:has([role=checkbox])]:pr-0", s.class)} {...rest} />
}

const TableCaption: Component<ComponentProps<"caption">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <caption class={classMerge("text-muted-foreground mt-4 text-sm", s.class)} {...rest} />
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
