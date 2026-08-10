type DocumentHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

type DocumentBlock =
  | { type: "heading"; heading: DocumentHeading }
  | { type: "paragraph"; lines: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] };

export function BusinessDocument({ content }: { content: string }) {
  const blocks = parseBusinessDocument(content);

  return (
    <div className="max-w-[46rem] text-content-primary">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const className =
            block.heading.level === 2
              ? "mt-10 scroll-mt-6 border-b border-outline pb-2 text-xl font-semibold tracking-tight first:mt-0 sm:text-2xl"
              : "mt-8 scroll-mt-6 text-base font-semibold sm:text-lg";

          return block.heading.level === 2 ? (
            <h2
              key={block.heading.id}
              id={block.heading.id}
              className={className}
            >
              {block.heading.text}
            </h2>
          ) : (
            <h3
              key={block.heading.id}
              id={block.heading.id}
              className={className}
            >
              {block.heading.text}
            </h3>
          );
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";

          return (
            <List
              key={`${block.type}-${index}`}
              className={`mt-4 space-y-2 pl-6 text-[0.95rem] leading-7 text-content-secondary ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {item}
                </li>
              ))}
            </List>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={`${block.type}-${index}`}
              className="mt-5 rounded-r-xl border-l-4 border-action-primary bg-action-muted px-4 py-3 text-sm leading-7 text-content-secondary"
            >
              {block.lines.join("\n")}
            </blockquote>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className="mt-4 text-[0.95rem] leading-8 whitespace-pre-wrap text-content-secondary"
          >
            {block.lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}

export function getBusinessDocumentOutline(content: string): DocumentHeading[] {
  return parseBusinessDocument(content).flatMap((block) =>
    block.type === "heading" ? [block.heading] : [],
  );
}

function parseBusinessDocument(content: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const lines = content.split("\n");
  let headingIndex = 0;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      headingIndex += 1;
      blocks.push({
        type: "heading",
        heading: {
          id: `section-${headingIndex}`,
          level: headingMatch[1].length >= 3 ? 3 : 2,
          text: headingMatch[2],
        },
      });
      index += 1;
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.+)$/.exec(line.trim());
    const orderedMatch = /^\d+[.)]\s+(.+)$/.exec(line.trim());
    if (unorderedMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = ordered
          ? /^\d+[.)]\s+(.+)$/.exec(lines[index].trim())
          : /^[-*]\s+(.+)$/.exec(lines[index].trim());
        if (!itemMatch) {
          break;
        }
        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (line.trim().startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith("> ")
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}
