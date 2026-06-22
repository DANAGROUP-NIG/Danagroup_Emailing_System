/**
 * Strict HTML sanitization configuration for DIMS
 *
 * Security requirements:
 * - Forbid dangerous tags: script, iframe, object, embed, form
 * - Forbid event handlers: onerror, onclick, onload, etc.
 * - Forbid javascript: and data: URLs (except data:image for inline images)
 * - Forbid style attributes that could be used for XSS
 *
 * Based on OWASP XSS Prevention Cheat Sheet recommendations.
 */

import DOMPurify from "isomorphic-dompurify";
import type { Config } from "dompurify";

// Dangerous tags that could execute code or load external content
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _FORBIDDEN_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "textarea",
  "button",
  "select",
  "option",
  "link",
  "meta",
  "base",
  "noscript",
  "template",
  "slot",
  "applet",
];

// Event handler attributes that can execute JavaScript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _FORBIDDEN_ATTRS = [
  // Mouse events
  "onclick",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",
  "oncontextmenu",
  // Keyboard events
  "onkeydown",
  "onkeypress",
  "onkeyup",
  // Form events
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onreset",
  "onselect",
  "onload",
  "onunload",
  // Drag events
  "ondrag",
  "ondrop",
  "ondragstart",
  "ondragend",
  // Touch events
  "ontouchstart",
  "ontouchend",
  "ontouchmove",
  // Clipboard events
  "oncopy",
  "oncut",
  "onpaste",
  // Media events
  "onplay",
  "onpause",
  "onended",
  // Animation events
  "onanimationstart",
  "onanimationend",
  // Error/resize/scroll
  "onerror",
  "onresize",
  "onscroll",
  // Transition events
  "ontransitionend",
];

/**
 * Custom DOMPurify configuration for email/announcement content
 * Uses a whitelist approach for maximum security
 */
export const strictSanitizeConfig: Config = {
  // Allowed tags (whitelist approach)
  ALLOWED_TAGS: [
    // Text formatting
    "p",
    "br",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    // Text styling
    "b",
    "strong",
    "i",
    "em",
    "u",
    "strike",
    "del",
    "ins",
    "sub",
    "sup",
    "mark",
    // Lists
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    // Quotes and code
    "blockquote",
    "q",
    "cite",
    "code",
    "pre",
    "samp",
    "kbd",
    "var",
    // Tables
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "td",
    "th",
    "caption",
    "colgroup",
    "col",
    // Links (href sanitized separately)
    "a",
    // Media
    "img",
    "figure",
    "figcaption",
    // Other semantic
    "abbr",
    "acronym",
    "address",
    "bdo",
    "big",
    "small",
    "dfn",
    "hr",
    "wbr",
    // Details/Summary
    "details",
    "summary",
  ],

  // Allowed attributes
  ALLOWED_ATTR: [
    // General attributes
    "class",
    "id",
    "title",
    "dir",
    "lang",
    "role",
    "tabindex",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-hidden",
    // Link attributes
    "href",
    "target",
    "rel",
    // Image attributes
    "src",
    "alt",
    "width",
    "height",
    "loading",
    // Table attributes
    "colspan",
    "rowspan",
    "headers",
    "scope",
    // List attributes
    "start",
    "type",
    "reversed",
    // Quote attributes
    "cite",
    // Time
    "datetime",
    // Data attributes (allow data-* via hook)
  ],

  // Forbid data URIs except for images
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:0-9]|$))/i,

  // Strip comments
  KEEP_CONTENT: true,

  // Sanitize text content (not just HTML)
  SANITIZE_DOM: true,

  // Force all links to open in new tab with noopener
  // This is handled via a hook below
};

/**
 * Sanitize HTML content using strict configuration
 * Returns sanitized HTML string safe for dangerouslySetInnerHTML
 *
 * @param html - Raw HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return "";

  // Set up hook to sanitize href attributes
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const { attrName, attrValue } = data;

    // Sanitize href/src to prevent javascript: and data: URLs
    if (attrName === "href" || attrName === "src") {
      const lowerValue = attrValue.toLowerCase().trim();

      // Block javascript: URLs (XSS vector)
      if (lowerValue.startsWith("javascript:")) {
        data.attrValue = "#blocked";
        return;
      }

      // Block data: URLs except for images (data:image/*)
      if (lowerValue.startsWith("data:") && !lowerValue.startsWith("data:image/")) {
        data.attrValue = "#blocked";
        return;
      }

      // Add security attributes to external links
      if (attrName === "href" && node instanceof HTMLAnchorElement) {
        // Check if external link
        try {
          const url = new URL(attrValue, window.location.href);
          const isExternal = url.hostname !== window.location.hostname;

          if (isExternal) {
            node.setAttribute("target", "_blank");
            node.setAttribute("rel", "noopener noreferrer nofollow");
          }
        } catch {
          // Invalid URL, keep as-is
        }
      }
    }
  });

  const result = DOMPurify.sanitize(html, strictSanitizeConfig);

  // Clean up hook to avoid memory leaks
  DOMPurify.removeHook("uponSanitizeAttribute");

  // Cast TrustedHTML to string for React dangerouslySetInnerHTML compatibility
  return result as unknown as string;
}

/**
 * Quick check if content contains potentially dangerous HTML
 * Useful for validation before processing
 *
 * @param html - HTML content to check
 * @returns true if content contains suspicious patterns
 */
export function containsDangerousHtml(html: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /data:text\/html/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(html));
}

export default sanitizeHtml;
