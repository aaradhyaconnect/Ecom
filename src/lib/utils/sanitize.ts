export function sanitizeRedirect(param: string | null | undefined): string {
  if (!param) return "/";
  if (
    !param.startsWith("/") ||
    param.startsWith("//") ||
    param.includes("@") ||
    param.includes("://") ||
    param.includes("\\")
  ) {
    return "/";
  }
  return param;
}
