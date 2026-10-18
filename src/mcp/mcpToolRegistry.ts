import * as a from "valibot"
import type { JsonSchema } from "#src/mcp/mcpValibotJsonSchema.ts"
import { valibotToJsonSchema } from "#src/mcp/mcpValibotJsonSchema.ts"

export type McpToolResult = {
  content: [{ type: "text"; text: string }]
  isError?: true
}

export function mcpToolResult(result: unknown, isError = false): McpToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }],
    ...(isError && { isError: true as const }),
  }
}

export type McpToolArgs = Record<string, unknown>

export type McpToolDefinition = {
  name: string
  description: string
  inputSchema: a.GenericSchema<unknown>
  // biome-ignore lint/suspicious/noExplicitAny: tool args are validated at call time; each definition types its own run
  run: (args: any) => Promise<McpToolResult>
}

export type McpToolRegistration = {
  name: string
  description: string
  inputJsonSchema: JsonSchema
  inputSchema: a.GenericSchema<unknown>
}

export function mcpToolDefinitionsRegister(definitions: readonly McpToolDefinition[]): McpToolRegistration[] {
  return definitions.map((definition) => ({
    name: definition.name,
    description: definition.description,
    inputJsonSchema: valibotToJsonSchema(definition.inputSchema),
    inputSchema: definition.inputSchema,
  }))
}

export async function mcpToolCall(
  definitions: readonly McpToolDefinition[],
  name: string,
  args: unknown,
): Promise<McpToolResult> {
  const definition = definitions.find((candidate) => candidate.name === name)
  if (!definition) return mcpToolError(-32602, `Tool ${name} not found`)
  const parsed = a.safeParse(definition.inputSchema, args ?? {})
  if (!parsed.success) return mcpToolError(-32602, `Invalid arguments for tool ${name}: ${a.summarize(parsed.issues)}`)
  try {
    return await definition.run(parsed.output as McpToolArgs)
  } catch (error) {
    return mcpToolError(-32603, error instanceof Error ? error.message : String(error))
  }
}

export function mcpToolError(code: number, message: string): McpToolResult {
  return { content: [{ type: "text", text: `MCP error ${code}: ${message}` }], isError: true }
}
