export function sanitizeRedirect(param: string | null | undefined): string {
  if (!param) return "/";
  const decoded = decodeURIComponent(param);
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("@") ||
    decoded.includes("://") ||
    decoded.includes("\\") ||
    decoded.includes("\0") ||
    /[\s\x00-\x1f]/.test(decoded)
  ) {
    return "/";
  }
  return decoded;
}
