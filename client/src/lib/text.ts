/** Escapes HTML so user text can't inject markup. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Minimal, safe markdown → HTML for personal notes.
 * Supports **bold**, [text](https://link), and "- " bullet lists. Input is
 * escaped first, so only the whitelisted patterns produce markup.
 */
export function renderMarkdown(src: string): string {
  // Inline styles (not Tailwind classes) so markup survives runtime injection.
  const inline = (t: string) =>
    t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:#00897B;text-decoration:underline;font-weight:500">$1</a>');

  const lines = escapeHtml(src ?? "").split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inList) { out.push('<ul style="list-style:disc;padding-left:1.25rem;margin:0.25rem 0">'); inList = true; }
      out.push('<li style="margin:0.1rem 0">' + inline(line.replace(/^\s*-\s+/, "")) + "</li>");
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (line.trim() === "") out.push('<div style="height:0.5rem"></div>');
      else out.push('<p style="margin:0.15rem 0">' + inline(line) + "</p>");
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

/** Triggers a client-side download of a text/markdown file. */
export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
