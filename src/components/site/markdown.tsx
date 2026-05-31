import Link from "next/link";

/**
 * Lightweight markdown renderer for blog post bodies. Intentionally a small
 * subset — headings (## / ###), paragraphs, blockquotes, ordered + unordered
 * lists, code blocks (```), inline code, bold, italic, and links.
 *
 * Why not react-markdown? It pulls in a 50kB+ tree of remark/rehype plugins
 * for features we don't yet need. If we end up needing tables, footnotes, or
 * mdx, swap this for next-mdx-remote or the contentlayer pipeline.
 */
export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

type Block =
  | { kind: "h2" | "h3"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "code"; lang: string; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "p"; text: string };

function parseBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines between blocks
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // closing ```
      blocks.push({ kind: "code", lang, text: code.join("\n") });
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ kind: "h3", text: line.slice(4).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      // Consume contiguous quote lines
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Paragraph — consume contiguous non-empty lines that don't open a new block
    const para: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const l = lines[i];
      if (
        l.trim() === "" ||
        l.startsWith("##") ||
        l.startsWith("> ") ||
        l.startsWith("```") ||
        /^[-*]\s+/.test(l) ||
        /^\d+\.\s+/.test(l)
      ) {
        break;
      }
      para.push(l);
      i += 1;
    }
    blocks.push({ kind: "p", text: para.join(" ") });
  }
  return blocks;
}

function renderBlock(block: Block, key: number): React.ReactNode {
  switch (block.kind) {
    case "h2":
      return (
        <h2 key={key} className="t-heading-xl font-display mt-12 mb-2">
          {renderInline(block.text)}
        </h2>
      );
    case "h3":
      return (
        <h3 key={key} className="t-heading-l font-display mt-10 mb-2">
          {renderInline(block.text)}
        </h3>
      );
    case "quote":
      return (
        <blockquote
          key={key}
          className="my-8 border-l-2 border-brand-500 pl-5 t-body-l text-fg italic"
        >
          {renderInline(block.text)}
        </blockquote>
      );
    case "code":
      return (
        <pre
          key={key}
          className="code-window my-6 p-4 text-xs whitespace-pre-wrap"
        >
          {block.lang ? (
            <div className="t-mono text-muted text-[10px] uppercase tracking-wider mb-2">
              {block.lang}
            </div>
          ) : null}
          <code>{block.text}</code>
        </pre>
      );
    case "ul":
      return (
        <ul key={key} className="my-4 space-y-2 pl-5">
          {block.items.map((item, j) => (
            <li
              key={j}
              className="t-body-l text-muted list-disc marker:text-brand-500"
            >
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="my-4 space-y-2 pl-5">
          {block.items.map((item, j) => (
            <li
              key={j}
              className="t-body-l text-muted list-decimal marker:text-brand-500 marker:font-mono"
            >
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    case "p":
      return (
        <p key={key} className="t-body-l text-muted">
          {renderInline(block.text)}
        </p>
      );
  }
}

/**
 * Inline renderer — bold, italic, inline code, links. Operates on a single
 * string and returns an array of React nodes. Intentionally avoids HTML
 * generation to keep the output safe by construction.
 */
function renderInline(text: string): React.ReactNode[] {
  // Tokens in priority order: links → code → bold → italic
  const out: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Match the earliest of: [text](url), `code`, **bold**, *italic*
    const candidates: Array<{
      idx: number;
      len: number;
      node: React.ReactNode;
    }> = [];

    const link = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(remaining);
    if (link) {
      const isExternal = /^https?:\/\//.test(link[2]);
      candidates.push({
        idx: link.index,
        len: link[0].length,
        node: isExternal ? (
          <a
            key={keyCounter++}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline decoration-brand-500 underline-offset-4 hover:text-brand-500 transition"
          >
            {link[1]}
          </a>
        ) : (
          <Link
            key={keyCounter++}
            href={link[2]}
            className="text-fg underline decoration-brand-500 underline-offset-4 hover:text-brand-500 transition"
          >
            {link[1]}
          </Link>
        ),
      });
    }

    const code = /`([^`]+)`/.exec(remaining);
    if (code) {
      candidates.push({
        idx: code.index,
        len: code[0].length,
        node: (
          <code
            key={keyCounter++}
            className="font-mono text-fg bg-surface-2 border border-border px-1.5 py-0.5 rounded text-[0.9em]"
          >
            {code[1]}
          </code>
        ),
      });
    }

    const bold = /\*\*([^*]+)\*\*/.exec(remaining);
    if (bold) {
      candidates.push({
        idx: bold.index,
        len: bold[0].length,
        node: (
          <strong key={keyCounter++} className="text-fg font-semibold">
            {bold[1]}
          </strong>
        ),
      });
    }

    // Italic must not match inside bold (already consumed above when bold wins).
    const italic = /(^|[^*])\*([^*]+)\*/.exec(remaining);
    if (italic) {
      candidates.push({
        idx: italic.index + (italic[1] ? italic[1].length : 0),
        len: italic[2].length + 2,
        node: (
          <em key={keyCounter++} className="text-fg italic">
            {italic[2]}
          </em>
        ),
      });
    }

    if (candidates.length === 0) {
      out.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const next = candidates[0];
    if (next.idx > 0) out.push(remaining.slice(0, next.idx));
    out.push(next.node);
    remaining = remaining.slice(next.idx + next.len);
  }

  return out;
}
