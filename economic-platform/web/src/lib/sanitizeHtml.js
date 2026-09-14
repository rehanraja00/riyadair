const ALLOWED_TAGS = new Set(['P', 'STRONG', 'EM', 'B', 'I', 'BR', 'UL', 'OL', 'LI', 'SPAN']);

// DU-01 free-form content blocks store basic HTML authored by EDITOR+ users.
// That's still untrusted enough to sanitize before rendering — a PUBLIC page
// renders it for every visitor, so this strips anything outside a small
// formatting allowlist (no attributes, no scripts/handlers) at render time.
export function sanitizeContentHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function clean(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent));
        return;
      }
      [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
      clean(child);
    });
  }

  clean(doc.body);
  return doc.body.innerHTML;
}
