/**
 * Minimal Markdown → email HTML for the monthly curation report: headings,
 * bullets, bold, paragraphs. Everything is escaped first; the routine's text
 * never reaches the email as HTML.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

export function reportToHtml(markdown: string): string {
  const out: string[] = [];
  let list = false;
  const closeList = () => {
    if (list) out.push("</ul>");
    list = false;
  };
  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const size = [0, 20, 17, 15][h[1].length];
      out.push(`<h${h[1].length + 1} style="font-size:${size}px;margin:18px 0 6px">${inline(h[2])}</h${h[1].length + 1}>`);
    } else if (li) {
      if (!list) out.push('<ul style="margin:4px 0 10px;padding-left:20px">');
      list = true;
      out.push(`<li style="margin:2px 0">${inline(li[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      out.push(`<p style="margin:6px 0">${inline(line)}</p>`);
    }
  }
  closeList();
  return `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#222;max-width:640px">${out.join("\n")}</div>`;
}
