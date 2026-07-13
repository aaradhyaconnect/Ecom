import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "em", "b", "i", "u", "s",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "figure", "figcaption",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "width", "height",
      "class", "id", "style",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

export function sanitizeRedirect(url: string | null): string {
  if (!url || typeof url !== "string") return "/";
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("@")) return "/";
  return url;
}
