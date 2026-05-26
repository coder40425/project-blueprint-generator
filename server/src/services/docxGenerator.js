const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, LevelFormat, NumberFormat
} = require("docx");

// ─── Color Palette ────────────────────────────────────────────
const BRAND_RED = "E8320A";
const DARK = "1A1A1A";
const GRAY = "6B7280";
const LIGHT_GRAY = "F3F4F6";
const WHITE = "FFFFFF";
const BORDER_GRAY = "E5E7EB";

// ─── Helpers ──────────────────────────────────────────────────
function hr() {
  return new Paragraph({
    paragraph: { spacing: { before: 120, after: 120 } },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY } },
    children: [new TextRun("")],
  });
}

function spacer(before = 160, after = 80) {
  return new Paragraph({ spacing: { before, after }, children: [new TextRun("")] });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [
      new TextRun({ text, bold: true, size: 28, color: BRAND_RED, font: "Arial" }),
    ],
  });
}

function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({ text, bold: true, size: 22, color: DARK, font: "Arial" }),
    ],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 360 }, // 1.5 line spacing
    children: [new TextRun({ text, size: 22, color: DARK, font: "Arial" })],
  });
}

function bulletItem(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, bold, color: DARK, font: "Arial" })],
  });
}

function badgeText(text, color = BRAND_RED) {
  return new TextRun({ text: ` [${text.toUpperCase()}] `, bold: true, size: 18, color, font: "Arial" });
}

function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GRAY },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GRAY },
    },
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            shading: { type: ShadingType.SOLID, color: BRAND_RED },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })],
            })],
          })
        ),
      }),
      // Data rows
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            new TableCell({
              width: colWidths ? { size: colWidths[ci], type: WidthType.PERCENTAGE } : undefined,
              shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? WHITE : LIGHT_GRAY },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: String(cell || "—"), size: 20, font: "Arial", color: DARK })],
              })],
            })
          ),
        })
      ),
    ],
  });
}

// ─── Main DOCX Builder ────────────────────────────────────────
async function buildProjectDocx(data) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const children = [];

  // ── Cover / Title Block ──────────────────────────────────────
  children.push(
    spacer(0, 480),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: data.title, bold: true, size: 44, color: BRAND_RED, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: data.tagline, size: 26, color: GRAY, font: "Arial", italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `Category: ${data.category}`, size: 22, color: GRAY, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `Generated: ${today}`, size: 20, color: GRAY, font: "Arial" })],
    }),
    spacer(200, 200),
    hr(),
  );

  // ── 1. Abstract ───────────────────────────────────────────────
  children.push(
    sectionHeading("1. Project Abstract"),
    bodyText(data.description),
    spacer(),
  );

  // ── 2. Technology Stack ───────────────────────────────────────
  children.push(sectionHeading("2. Proposed Technology Stack"));
  const stackRows = [
    ["Frontend", data.techStack.frontend.join(", ")],
    ["Backend", data.techStack.backend.join(", ")],
    ["Database", data.techStack.database.join(", ")],
    ["DevOps / Deployment", data.techStack.devops.join(", ")],
  ];
  children.push(makeTable(["Layer", "Technologies"], stackRows, [25, 75]), spacer());

  // ── 3. Core Features ──────────────────────────────────────────
  children.push(sectionHeading("3. Core Features & Modules"));

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedFeatures = [...data.features].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const featRows = sortedFeatures.map(f => [
    f.name,
    f.description,
    f.priority.toUpperCase(),
  ]);
  children.push(makeTable(["Feature", "Description", "Priority"], featRows, [25, 58, 17]), spacer());

  // ── 4. Database Schema ────────────────────────────────────────
  children.push(sectionHeading("4. Database Schema Design"));
  for (const table of data.database) {
    children.push(subHeading(`Table: ${table.name}`));
    const colRows = table.columns.map(c => [c.name, c.type, c.note || "—"]);
    children.push(makeTable(["Column", "Data Type", "Constraint"], colRows, [35, 35, 30]));
    children.push(spacer(120, 80));
  }

  // ── 5. API Endpoints ──────────────────────────────────────────
  children.push(sectionHeading("5. REST API Specification"));
  const methodColors = { GET: "059669", POST: "D97706", PUT: "2563EB", PATCH: "7C3AED", DELETE: "DC2626" };
  const apiRows = data.apis.map(a => [
    a.method,
    a.path,
    a.description,
    a.auth ? "Required" : "Public",
  ]);
  children.push(makeTable(["Method", "Endpoint", "Description", "Auth"], apiRows, [12, 28, 45, 15]), spacer());

  // ── 6. Development Steps ──────────────────────────────────────
  children.push(sectionHeading("6. Development Methodology & Steps"));
  for (const s of data.devSteps) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: `Step ${s.step}: `, bold: true, size: 22, color: BRAND_RED, font: "Arial" }),
          new TextRun({ text: s.title, bold: true, size: 22, color: DARK, font: "Arial" }),
        ],
      }),
      bodyText(s.description),
    );
  }
  children.push(spacer());

  // ── 7. Project Timeline ───────────────────────────────────────
  children.push(sectionHeading("7. Estimated Project Timeline"));
  const tlRows = data.timeline.map(p => [p.phase, p.duration, p.tasks.join(", ")]);
  children.push(makeTable(["Phase", "Duration", "Key Deliverables"], tlRows, [30, 20, 50]), spacer());

  // ── 8. Folder Structure ───────────────────────────────────────
  children.push(sectionHeading("8. Recommended Project Structure"));
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 100 },
      shading: { type: ShadingType.SOLID, color: "1E293B" },
      children: [
        new TextRun({
          text: data.folderStructure,
          size: 18,
          font: "Courier New",
          color: "E2E8F0",
          break: 0,
        }),
      ],
    }),
    spacer(),
  );

  // ── Footer note ───────────────────────────────────────────────
  children.push(
    hr(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 0 },
      children: [
        new TextRun({ text: "Generated by SkillDzire Mini Project Generator  •  ", size: 18, color: GRAY, font: "Arial" }),
        new TextRun({ text: today, size: 18, color: GRAY, font: "Arial" }),
      ],
    }),
  );

  // ── Build Document ────────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY } },
              children: [
                new TextRun({ text: data.title, size: 18, color: GRAY, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY } },
              children: [
                new TextRun({ text: "SkillDzire Mini Project Generator  |  Page ", size: 18, color: GRAY, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: "Arial" }),
                new TextRun({ text: " of ", size: 18, color: GRAY, font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GRAY, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { buildProjectDocx };