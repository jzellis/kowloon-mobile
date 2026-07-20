// ProseMirror document → Markdown.
//
// 10tap's editor.getJSON() returns the editor content as a ProseMirror doc:
// a structured tree, not an HTML string. Walking that tree to Markdown is
// robust (no HTML parsing, no DOM — which React Native lacks) and covers
// exactly the nodes the Note/Article toolbar can produce.
//
// The server stores Markdown source and renders HTML itself, so this is the
// last step before createPost(). Underline has no Markdown syntax, so it's
// emitted as inline <u> HTML (the server renders + allows it — issue #32).

// Only escape the inline markers that would actually change parsing mid-text
// (emphasis, code spans, links). Deliberately NOT escaping . ! ( ) { } + - # >
// etc. — escaping those left visible backslashes throughout the stored source,
// which showed up when editing a post (issue #34). Leading block markers are
// handled per-paragraph in escapeLeadingMarker().
const INLINE_ESCAPE_RE = /([\\`*_[\]])/g;

function escapeText(text) {
  return String(text).replace(INLINE_ESCAPE_RE, "\\$1");
}

// Escape a block marker only when it LEADS a paragraph line, so literal prose
// like "- nope", "# nope", or "1. nope" round-trips without turning into a
// list / heading — while ordinary mid-sentence punctuation stays clean.
function escapeLeadingMarker(text) {
  return text
    .replace(/^(\s*)([#>+-])(\s)/, "$1\\$2$3")
    .replace(/^(\s*)(\d+)([.)])(\s)/, "$1$2\\$3$4");
}

// Apply a text node's marks, innermost first. `code` wins outright — Markdown
// code spans don't take other inline formatting.
function applyMarks(text, marks) {
  if (!marks || !marks.length) return escapeText(text);

  const has = (t) => marks.some((m) => m.type === t);
  const linkMark = marks.find((m) => m.type === "link");

  if (has("code")) {
    let out = `\`${text}\``; // no escaping inside code spans
    if (linkMark?.attrs?.href) out = `[${out}](${linkMark.attrs.href})`;
    return out;
  }

  let out = escapeText(text);
  if (has("bold")) out = `**${out}**`;
  if (has("italic")) out = `*${out}*`;
  if (has("strike")) out = `~~${out}~~`;
  // Markdown has no underline, so emit inline HTML. The server's markdown
  // renderer passes it through and its sanitizer allows <u> (issue #32).
  if (has("underline")) out = `<u>${out}</u>`;
  if (linkMark?.attrs?.href) out = `[${out}](${linkMark.attrs.href})`;
  return out;
}

// Inline content of a block node → a single string.
function inline(nodes) {
  if (!nodes) return "";
  let out = "";
  for (const n of nodes) {
    if (n.type === "text") out += applyMarks(n.text || "", n.marks);
    else if (n.type === "hardBreak") out += "  \n";
  }
  return out;
}

// Prefix every line of a block of text (for blockquotes / nested list items).
function indentLines(text, prefix) {
  return text
    .split("\n")
    .map((line) => prefix + line)
    .join("\n");
}

function block(node, depth = 0) {
  switch (node.type) {
    case "paragraph":
      return escapeLeadingMarker(inline(node.content));

    case "heading": {
      const level = Math.min(Math.max(node.attrs?.level || 1, 1), 6);
      return `${"#".repeat(level)} ${inline(node.content)}`;
    }

    case "blockquote":
      return indentLines(children(node.content, depth), "> ");

    case "codeBlock": {
      const lang = node.attrs?.language || "";
      const code = (node.content || []).map((c) => c.text || "").join("");
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "bulletList":
      return (node.content || [])
        .map((li) => listItem(li, depth, "- "))
        .join("\n");

    case "orderedList": {
      let i = node.attrs?.start || 1;
      return (node.content || [])
        .map((li) => listItem(li, depth, `${i++}. `))
        .join("\n");
    }

    case "horizontalRule":
      return "---";

    default:
      // Unknown block — fall back to its inline content if any.
      return inline(node.content);
  }
}

// A list item: its first paragraph sits on the bullet line; further blocks
// (nested lists, extra paragraphs) are indented under it.
function listItem(node, depth, marker) {
  const indent = "  ".repeat(depth);
  const parts = (node.content || []).map((child, idx) => {
    if (child.type === "bulletList" || child.type === "orderedList") {
      return block(child, depth + 1);
    }
    return block(child, depth);
  });
  const [first, ...rest] = parts;
  let out = `${indent}${marker}${first || ""}`;
  for (const r of rest) {
    out += "\n" + (r.startsWith(" ") ? r : indentLines(r, indent + "  "));
  }
  return out;
}

// Join a node's block children with blank lines between them.
function children(content, depth = 0) {
  if (!content) return "";
  return content.map((n) => block(n, depth)).join("\n\n");
}

export function pmToMarkdown(doc) {
  if (!doc || doc.type !== "doc" || !Array.isArray(doc.content)) return "";
  return children(doc.content).trim();
}
