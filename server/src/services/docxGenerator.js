const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, LevelFormat,
} = require("docx");

// ─── Color Palette ─────────────────────────────────────────
const ACCENT       = "ED7D31";
const DARK         = "1A1A1A";
const HEADING_DARK = "1F3864";
const GRAY         = "595959";
const MID_GRAY     = "7F7F7F";
const ALT_ROW      = "FFF2E8";
const WHITE        = "FFFFFF";
const TBL_HEAD     = "1F3864";
const BORDER       = "D9D9D9";

const CONTENT_W = 9360;

// ─── Helpers ───────────────────────────────────────────────

function pageBreak() {
  return new Paragraph({ children: [new TextRun({ break: 1 })] });
}

function hr(color = ACCENT) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color } },
    children: [new TextRun("")],
  });
}

function spacer(before = 160, after = 80) {
  return new Paragraph({ spacing: { before, after }, children: [new TextRun("")] });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
    children: [new TextRun({ text, bold: true, size: 32, color: ACCENT, font: "Times New Roman" })],
  });
}

function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: HEADING_DARK, font: "Times New Roman" })],
  });
}

function body(text) {
  if (!text) return null;
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 360 },
    children: [new TextRun({ text, size: 24, color: DARK, font: "Times New Roman" })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 23, color: DARK, font: "Times New Roman" })],
  });
}

function centeredTitle(text, size = 36, color = HEADING_DARK) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 160 },
    children: [new TextRun({ text, bold: true, size, color, font: "Times New Roman", allCaps: true })],
  });
}

function makeTable(headers, rows, colPercents) {
  const colWidths = colPercents
    ? colPercents.map(p => Math.round((p / 100) * CONTENT_W))
    : headers.map(() => Math.round(CONTENT_W / headers.length));

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      bottom:  { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      left:    { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right:   { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: TBL_HEAD },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Times New Roman" })],
            })],
          })
        ),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            new TableCell({
              width: { size: colWidths[ci], type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? WHITE : ALT_ROW },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: String(cell ?? "—"), size: 20, font: "Times New Roman", color: DARK })],
              })],
            })
          ),
        })
      ),
    ],
  });
}

function diagramBox(lines, caption) {
  const result = [];
  result.push(
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: "0F172A" },
      border: {
        top:    { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
        left:   { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
        right:  { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
      },
      children: lines.flatMap((line, i) => [
        ...(i > 0 ? [new TextRun({ break: 1 })] : []),
        new TextRun({ text: line, size: 18, font: "Courier New", color: "94A3B8" }),
      ]),
    }),
  );
  if (caption) {
    result.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 100 },
      children: [new TextRun({ text: `Figure: ${caption}`, size: 18, italics: true, color: MID_GRAY, font: "Times New Roman" })],
    }));
  }
  return result;
}

// ─── Render a single section or subsection's block content ─
// Returns array of docx elements (paragraphs, tables, etc.)
function renderContentBlock(block) {
  const elements = [];

  // Main text content
  if (block.content) {
    const p = body(block.content);
    if (p) elements.push(p, spacer(30, 30));
  }

  // Bullet list
  if (Array.isArray(block.bullets) && block.bullets.length > 0) {
    for (const b of block.bullets) {
      elements.push(bullet(b));
    }
    elements.push(spacer(40, 40));
  }

  // Table
  if (block.table && Array.isArray(block.table.headers) && Array.isArray(block.table.rows)) {
    elements.push(
      makeTable(block.table.headers, block.table.rows, block.table.colPercents || null),
      spacer(120, 60),
    );
  }

  // Code / diagram block
  if (block.codeBlock && Array.isArray(block.codeBlock.lines) && block.codeBlock.lines.length > 0) {
    elements.push(...diagramBox(block.codeBlock.lines, block.codeBlock.caption || null));
    elements.push(spacer(60, 40));
  }

  return elements;
}

// ─── Render all sections dynamically ───────────────────────
function renderSections(sections) {
  const elements = [];

  for (const section of sections) {
    const sectionLabel = section.number
      ? `${section.number}. ${section.title}`
      : section.title;

    elements.push(sectionHeading(sectionLabel));

    // Top-level section content (when no subsections)
    if (!section.subsections || section.subsections.length === 0) {
      elements.push(...renderContentBlock(section));
    }

    // Subsections
    if (Array.isArray(section.subsections) && section.subsections.length > 0) {
      // If section has its own intro content, render it first
      if (section.content) {
        const p = body(section.content);
        if (p) elements.push(p, spacer(40, 40));
      }

      for (const sub of section.subsections) {
        const subLabel = sub.number
          ? `${sub.number}  ${sub.title}`
          : sub.title;

        elements.push(subHeading(subLabel));
        elements.push(...renderContentBlock(sub));
      }
    }

    elements.push(spacer(60, 40));
  }

  return elements;
}

// ─── References builder ────────────────────────────────────
function buildReferences(data) {
  const refs = [];
  let idx = 1;
  const allTech = [
    ...(data.techStack?.frontend || []),
    ...(data.techStack?.backend || []),
    ...(data.techStack?.database || []),
    ...(data.techStack?.devops || []),
  ];
  const knownRefs = {
    "React":        `[${idx++}] Meta Platforms. (2023). React – A JavaScript library for building user interfaces. https://react.dev`,
    "React.js":     `[${idx++}] Meta Platforms. (2023). React – A JavaScript library for building user interfaces. https://react.dev`,
    "Vue":          `[${idx++}] You, E. (2023). Vue.js – The Progressive JavaScript Framework. https://vuejs.org`,
    "Angular":      `[${idx++}] Google LLC. (2023). Angular – Platform for building mobile and desktop web applications. https://angular.io`,
    "Node.js":      `[${idx++}] OpenJS Foundation. (2023). Node.js – JavaScript runtime built on Chrome's V8 engine. https://nodejs.org`,
    "Express":      `[${idx++}] OpenJS Foundation. (2023). Express – Fast, unopinionated, minimalist web framework for Node.js. https://expressjs.com`,
    "MongoDB":      `[${idx++}] MongoDB, Inc. (2023). MongoDB – The developer data platform. https://mongodb.com`,
    "PostgreSQL":   `[${idx++}] The PostgreSQL Global Development Group. (2023). PostgreSQL. https://postgresql.org`,
    "MySQL":        `[${idx++}] Oracle Corporation. (2023). MySQL. https://mysql.com`,
    "Redis":        `[${idx++}] Redis Ltd. (2023). Redis – The open source, in-memory data store. https://redis.io`,
    "Docker":       `[${idx++}] Docker, Inc. (2023). Docker – Accelerated container application development. https://docker.com`,
    "TypeScript":   `[${idx++}] Microsoft Corporation. (2023). TypeScript. https://typescriptlang.org`,
    "Python":       `[${idx++}] Python Software Foundation. (2023). Python. https://python.org`,
    "FastAPI":      `[${idx++}] Ramírez, S. (2023). FastAPI. https://fastapi.tiangolo.com`,
    "Tailwind CSS": `[${idx++}] Tailwind Labs. (2023). Tailwind CSS. https://tailwindcss.com`,
    "AWS":          `[${idx++}] Amazon Web Services. (2023). AWS Cloud Computing Services. https://aws.amazon.com`,
    "Next.js":      `[${idx++}] Vercel Inc. (2023). Next.js – The React Framework for the Web. https://nextjs.org`,
    "Prisma":       `[${idx++}] Prisma Data, Inc. (2023). Prisma ORM. https://prisma.io`,
    "JWT":          `[${idx++}] IETF. (2015). JSON Web Token (JWT) – RFC 7519. https://tools.ietf.org/html/rfc7519`,
  };
  const seen = new Set();
  for (const tech of allTech) {
    const key = Object.keys(knownRefs).find(k => tech.toLowerCase().includes(k.toLowerCase()));
    if (key && !seen.has(key)) { refs.push(knownRefs[key]); seen.add(key); }
  }
  refs.push(
    `[${refs.length + 1}] Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures (Doctoral dissertation). University of California, Irvine.`,
    `[${refs.length + 2}] Beck, K., et al. (2001). Manifesto for Agile Software Development. https://agilemanifesto.org`,
    `[${refs.length + 3}] Sommerville, I. (2016). Software Engineering (10th ed.). Pearson Education.`,
    `[${refs.length + 4}] Pressman, R. S., & Maxim, B. R. (2015). Software Engineering: A Practitioner's Approach (8th ed.). McGraw-Hill Education.`,
  );
  return refs;
}

// ═══════════════════════════════════════════════════════════════
// MAIN DOCX BUILDER — fully dynamic, driven by blueprint.sections
// ═══════════════════════════════════════════════════════════════
async function buildProjectDocx(data) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const refs = buildReferences(data);
  const children = [];

  const coverMeta = data.coverMeta || {};
  const subtitle = coverMeta.subtitle || "MINI PROJECT REPORT";
  const institution = coverMeta.institution || "Department of Computer Science and Engineering";

  // ── COVER PAGE ─────────────────────────────────────────────
  children.push(
    spacer(800, 0),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: subtitle.toUpperCase(), size: 22, color: MID_GRAY, font: "Times New Roman", allCaps: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 320 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT } },
      children: [new TextRun({ text: institution, size: 21, color: MID_GRAY, font: "Times New Roman", italics: true })],
    }),
    spacer(240, 60),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: data.title, bold: true, size: 56, color: ACCENT, font: "Times New Roman" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [new TextRun({ text: data.tagline, size: 26, color: GRAY, font: "Times New Roman", italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: `Category:  ${data.category}`, size: 23, color: DARK, font: "Times New Roman" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: `Date:  ${today}`, size: 23, color: DARK, font: "Times New Roman" })],
    }),
  );

  // Stack line — only if techStack is present
  if (data.techStack?.frontend?.[0]) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({
          text: `Stack:  ${data.techStack.frontend[0]} · ${data.techStack.backend?.[0] || ""} · ${data.techStack.database?.[0] || ""}`,
          size: 23, color: DARK, font: "Times New Roman",
        })],
      }),
    );
  }

  children.push(spacer(400, 80), hr(ACCENT), pageBreak());

  // ── TABLE OF CONTENTS ──────────────────────────────────────
  children.push(centeredTitle("TABLE OF CONTENTS"), hr(), spacer(100, 60));

  for (const section of data.sections) {
    const label = section.number ? `${section.number}.` : "";
    children.push(new Paragraph({
      spacing: { before: 70, after: 70 },
      children: [
        new TextRun({ text: `${label}  `, bold: true, size: 23, color: ACCENT, font: "Times New Roman" }),
        new TextRun({ text: section.title, size: 23, color: DARK, font: "Times New Roman" }),
        new TextRun({ text: "  .......  —", size: 22, color: MID_GRAY, font: "Times New Roman" }),
      ],
    }));

    // Sub-entries in TOC
    if (Array.isArray(section.subsections)) {
      for (const sub of section.subsections) {
        const subLabel = sub.number || "";
        children.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 480 },
          children: [
            new TextRun({ text: `${subLabel}  `, size: 21, color: ACCENT, font: "Times New Roman" }),
            new TextRun({ text: sub.title, size: 21, color: GRAY, font: "Times New Roman" }),
            new TextRun({ text: "  .......  —", size: 20, color: MID_GRAY, font: "Times New Roman" }),
          ],
        }));
      }
    }
  }

  children.push(
    spacer(100, 60),
    new Paragraph({
      children: [new TextRun({
        text: "Note: Page numbers are updated automatically when opened in Microsoft Word (press Ctrl+A, then F9).",
        size: 18, italics: true, color: MID_GRAY, font: "Times New Roman",
      })],
    }),
    pageBreak(),
  );

  // ── ALL SECTIONS (dynamic) ─────────────────────────────────
  children.push(...renderSections(data.sections));

  // ── GENERATED SOURCE FILES (if present) ───────────────────
  if (Array.isArray(data.generatedFiles) && data.generatedFiles.length > 0) {
    children.push(sectionHeading("Generated Source Files"));
    children.push(body("This section contains AI-generated starter implementation files for the project."), spacer(60, 40));

    data.generatedFiles.forEach((file, idx) => {
      children.push(
        subHeading(`${idx + 1}.  ${file.path}`),
        body(`Purpose: ${file.purpose || "Implementation File"}`),
        makeTable(
          ["Property", "Value"],
          [["Path", file.path], ["Language", file.language || "Unknown"], ["Type", file.type || "General"]],
          [30, 70]
        ),
        spacer(40, 40),
        new Paragraph({
          spacing: { before: 60, after: 60 },
          shading: { type: ShadingType.CLEAR, fill: "0F172A" },
          border: {
            top:    { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
            left:   { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
            right:  { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
          },
          children: (file.content || "").split("\n").slice(0, 120).flatMap((line, i) => [
            ...(i > 0 ? [new TextRun({ break: 1 })] : []),
            new TextRun({ text: line, size: 18, font: "Courier New", color: "94A3B8" }),
          ]),
        }),
        spacer(100, 40),
      );
    });
  }

  // ── REFERENCES ─────────────────────────────────────────────
  children.push(
    sectionHeading("References & Bibliography"),
    body("The following references were consulted in the preparation of this report. Citations follow the IEEE reference format."),
    spacer(60, 40),
  );
  for (const ref of refs) {
    children.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      indent: { left: 720, hanging: 720 },
      children: [new TextRun({ text: ref, size: 21, color: DARK, font: "Times New Roman" })],
    }));
  }
  children.push(spacer(120, 60), hr());

  // ── BUILD DOCUMENT ─────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
        {
          reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: "Times New Roman", size: 24 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, color: ACCENT, font: "Times New Roman" },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, color: HEADING_DARK, font: "Times New Roman" },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
            spacing: { before: 0, after: 100 },
            children: [new TextRun({ text: data.title, size: 18, color: GRAY, font: "Times New Roman" })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
            spacing: { before: 60, after: 0 },
            children: [
              new TextRun({ text: "Page ", size: 18, color: GRAY, font: "Times New Roman" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: ACCENT, font: "Times New Roman", bold: true }),
              new TextRun({ text: " of ", size: 18, color: GRAY, font: "Times New Roman" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GRAY, font: "Times New Roman" }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { buildProjectDocx };