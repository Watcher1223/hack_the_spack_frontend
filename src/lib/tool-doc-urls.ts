/**
 * Collect all API/documentation-related URLs from a tool for display.
 * Handles both EnhancedTool (snake_case) and shapes with sourceUrl (camelCase).
 */
export type ToolWithDocUrls = {
  api_reference_url?: string | null;
  source_url?: string | null;
  documentation_url?: string | null;
  spec_url?: string | null;
  sourceUrl?: string | null;
};

export function getToolDocUrls(tool: ToolWithDocUrls): { label: string; url: string }[] {
  const raw: { label: string; url: string }[] = [];
  if (tool.api_reference_url?.trim()) raw.push({ label: 'API reference', url: tool.api_reference_url.trim() });
  if (tool.source_url?.trim()) raw.push({ label: 'Source', url: tool.source_url.trim() });
  if (tool.documentation_url?.trim()) raw.push({ label: 'Documentation', url: tool.documentation_url.trim() });
  if (tool.spec_url?.trim()) raw.push({ label: 'Spec', url: tool.spec_url.trim() });
  if (tool.sourceUrl?.trim()) raw.push({ label: 'Source', url: tool.sourceUrl.trim() });
  const seen = new Set<string>();
  return raw.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
