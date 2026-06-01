const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, LevelFormat, PageBreak,
  ImageRun,
} = require("docx");

// ─── Color Palette ────────────────────────────────────────────
const BRAND_RED  = "C0300A";
const BRAND_DARK = "1E1E2E";
const DARK       = "1A1A1A";
const GRAY       = "5A6478";
const MID_GRAY   = "9CA3AF";
const LIGHT_GRAY = "F3F4F6";
const ALT_ROW    = "FEF3F0";
const WHITE      = "FFFFFF";
const BORDER     = "D1D5DB";

// Content width in DXA (US Letter 8.5" minus 1" left + 0.875" right margins)
const CONTENT_W = 9360;

// ─── Page break helper ────────────────────────────────────────
function pageBreak() {
  return new Paragraph({ children: [new TextRun({ break: 1 })] });
}

// ─── Horizontal rule ─────────────────────────────────────────
function hr(color = BORDER) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
    children: [new TextRun("")],
  });
}

// ─── Spacer ───────────────────────────────────────────────────
function spacer(before = 160, after = 80) {
  return new Paragraph({ spacing: { before, after }, children: [new TextRun("")] });
}

// ─── Section heading (Heading 1) ──────────────────────────────
function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 180 },
    children: [new TextRun({ text, bold: true, size: 30, color: BRAND_RED, font: "Arial" })],
  });
}

// ─── Sub-heading (Heading 2) ──────────────────────────────────
function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: BRAND_DARK, font: "Arial" })],
  });
}

// ─── Body paragraph ───────────────────────────────────────────
function body(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 360 },
    children: [new TextRun({ text, size: 22, color: DARK, font: "Arial" })],
  });
}

// ─── Bullet paragraph ─────────────────────────────────────────
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 21, color: DARK, font: "Arial" })],
  });
}

// ─── Numbered list paragraph ──────────────────────────────────
function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 21, color: DARK, font: "Arial" })],
  });
}

// ─── Centered title paragraph ─────────────────────────────────
function centeredTitle(text, size = 32, color = BRAND_DARK) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text, bold: true, size, color, font: "Arial", allCaps: true })],
  });
}

// ─── Unified table builder (DXA-based for compatibility) ──────
function makeTable(headers, rows, colPercents) {
  // Convert percentages to DXA
  const colWidths = colPercents
    ? colPercents.map(p => Math.round((p / 100) * CONTENT_W))
    : headers.map(() => Math.round(CONTENT_W / headers.length));

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      bottom:  { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      left:    { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      right:   { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      insideH: { style: BorderStyle.SINGLE, size: 3,  color: BORDER },
      insideV: { style: BorderStyle.SINGLE, size: 3,  color: BORDER },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BRAND_DARK },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })],
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
              margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: String(cell ?? "—"), size: 20, font: "Arial", color: DARK })],
              })],
            })
          ),
        })
      ),
    ],
  });
}

// ─── ASCII diagram box ────────────────────────────────────────
function diagramBox(lines, caption) {
  const result = [];
  result.push(
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: "0F172A" },
      border: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        left:   { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        right:  { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
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
      spacing: { before: 60, after: 120 },
      children: [new TextRun({ text: `Figure: ${caption}`, size: 18, italics: true, color: GRAY, font: "Arial" })],
    }));
  }
  return result;
}

// ─── References list ──────────────────────────────────────────
function buildReferences(data) {
  const refs = [];
  let idx = 1;

  const allTech = [
    ...data.techStack.frontend,
    ...data.techStack.backend,
    ...data.techStack.database,
    ...data.techStack.devops,
  ];

  const knownRefs = {
    "React":        `[${idx++}] Meta Platforms. (2023). React – A JavaScript library for building user interfaces. https://react.dev`,
    "React.js":     `[${idx++}] Meta Platforms. (2023). React – A JavaScript library for building user interfaces. https://react.dev`,
    "Vue":          `[${idx++}] You, E. (2023). Vue.js – The Progressive JavaScript Framework. https://vuejs.org`,
    "Angular":      `[${idx++}] Google LLC. (2023). Angular – Platform for building mobile and desktop web applications. https://angular.io`,
    "Node.js":      `[${idx++}] OpenJS Foundation. (2023). Node.js – JavaScript runtime built on Chrome's V8 engine. https://nodejs.org`,
    "Express":      `[${idx++}] OpenJS Foundation. (2023). Express – Fast, unopinionated, minimalist web framework for Node.js. https://expressjs.com`,
    "Express.js":   `[${idx++}] OpenJS Foundation. (2023). Express – Fast, unopinionated, minimalist web framework for Node.js. https://expressjs.com`,
    "MongoDB":      `[${idx++}] MongoDB, Inc. (2023). MongoDB – The developer data platform. https://mongodb.com`,
    "PostgreSQL":   `[${idx++}] The PostgreSQL Global Development Group. (2023). PostgreSQL: The World's Most Advanced Open Source Relational Database. https://postgresql.org`,
    "MySQL":        `[${idx++}] Oracle Corporation. (2023). MySQL – The world's most popular open source database. https://mysql.com`,
    "Redis":        `[${idx++}] Redis Ltd. (2023). Redis – The open source, in-memory data store. https://redis.io`,
    "Docker":       `[${idx++}] Docker, Inc. (2023). Docker – Accelerated container application development. https://docker.com`,
    "TypeScript":   `[${idx++}] Microsoft Corporation. (2023). TypeScript – JavaScript with syntax for types. https://typescriptlang.org`,
    "Python":       `[${idx++}] Python Software Foundation. (2023). Python – Programming Language. https://python.org`,
    "FastAPI":      `[${idx++}] Ramírez, S. (2023). FastAPI – Modern, fast web framework for building APIs with Python. https://fastapi.tiangolo.com`,
    "Tailwind":     `[${idx++}] Tailwind Labs. (2023). Tailwind CSS – A utility-first CSS framework. https://tailwindcss.com`,
    "Tailwind CSS": `[${idx++}] Tailwind Labs. (2023). Tailwind CSS – A utility-first CSS framework. https://tailwindcss.com`,
    "AWS":          `[${idx++}] Amazon Web Services. (2023). AWS Cloud Computing Services. https://aws.amazon.com`,
    "Vercel":       `[${idx++}] Vercel Inc. (2023). Vercel – Develop. Preview. Ship. https://vercel.com`,
    "GitHub":       `[${idx++}] GitHub, Inc. (2023). GitHub – Where the world builds software. https://github.com`,
    "Stripe":       `[${idx++}] Stripe, Inc. (2023). Stripe – Financial infrastructure for the internet. https://stripe.com`,
    "JWT":          `[${idx++}] IETF. (2015). JSON Web Token (JWT) – RFC 7519. https://tools.ietf.org/html/rfc7519`,
    "Nginx":        `[${idx++}] F5, Inc. (2023). NGINX – High Performance Load Balancer, Web Server, & Reverse Proxy. https://nginx.org`,
    "Next.js":      `[${idx++}] Vercel Inc. (2023). Next.js – The React Framework for the Web. https://nextjs.org`,
    "Prisma":       `[${idx++}] Prisma Data, Inc. (2023). Prisma – Next-generation Node.js and TypeScript ORM. https://prisma.io`,
  };

  const seen = new Set();
  for (const tech of allTech) {
    const key = Object.keys(knownRefs).find(k => tech.toLowerCase().includes(k.toLowerCase()));
    if (key && !seen.has(key)) {
      refs.push(knownRefs[key]);
      seen.add(key);
    }
  }

  refs.push(
    `[${refs.length + 1}] Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures (Doctoral dissertation). University of California, Irvine.`,
    `[${refs.length + 2}] Beck, K., et al. (2001). Manifesto for Agile Software Development. https://agilemanifesto.org`,
    `[${refs.length + 3}] Sommerville, I. (2016). Software Engineering (10th ed.). Pearson Education.`,
    `[${refs.length + 4}] Pressman, R. S., & Maxim, B. R. (2015). Software Engineering: A Practitioner's Approach (8th ed.). McGraw-Hill Education.`,
    `[${refs.length + 5}] Date, C. J. (2003). An Introduction to Database Systems (8th ed.). Addison-Wesley.`,
  );

  return refs;
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN DOCX BUILDER ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
async function buildProjectDocx(data) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const refs = buildReferences(data);
  const children = [];

  // ── Diagrams from AI (text-art) ──────────────────────────────
  const diagrams = data.diagrams || {};

  // ══════════════════════════════════════════════════════════════
  // PAGE 1 — COVER PAGE
  // ══════════════════════════════════════════════════════════════
  children.push(
    spacer(600, 0),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: "MINI PROJECT REPORT", size: 20, color: MID_GRAY, font: "Arial", allCaps: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND_RED } },
      children: [new TextRun({ text: "Submitted in partial fulfilment of the course requirements", size: 20, color: MID_GRAY, font: "Arial", italics: true })],
    }),
    spacer(200, 60),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: data.title, bold: true, size: 52, color: BRAND_RED, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 480 },
      children: [new TextRun({ text: data.tagline, size: 26, color: GRAY, font: "Arial", italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: `Category:  ${data.category}`, size: 22, color: DARK, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: `Generated:  ${today}`, size: 22, color: DARK, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: `Technology:  ${data.techStack.frontend[0]} · ${data.techStack.backend[0]} · ${data.techStack.database[0]}`, size: 22, color: DARK, font: "Arial" })],
    }),
    spacer(400, 100),
    hr(BRAND_RED),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 0 },
      children: [new TextRun({ text: "Generated by SkillDzire Mini Project Generator", size: 18, color: MID_GRAY, font: "Arial" })],
    }),
    pageBreak(),
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE 2 — ABSTRACT
  // ══════════════════════════════════════════════════════════════
  children.push(
    centeredTitle("ABSTRACT"),
    hr(),
    spacer(120, 60),
    body(data.description),
    spacer(60, 80),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: "Keywords: ", bold: true, size: 21, color: BRAND_RED, font: "Arial" }),
        new TextRun({
          text: [data.category, data.techStack.frontend[0], data.techStack.backend[0], data.techStack.database[0], "Software Architecture", "REST API"].join(", "),
          size: 21, color: GRAY, italics: true, font: "Arial",
        }),
      ],
    }),
    pageBreak(),
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE 3 — ACKNOWLEDGEMENT
  // ══════════════════════════════════════════════════════════════
  children.push(
    centeredTitle("ACKNOWLEDGEMENT"),
    hr(),
    spacer(120, 60),
    body(`We would like to express our sincere gratitude to our project guide and mentor for their invaluable guidance, encouragement, and constructive feedback throughout the development of this project. Their expertise and insight have been instrumental in shaping both the technical direction and academic quality of this report.`),
    spacer(80, 60),
    body(`We extend our heartfelt thanks to the faculty members of the Department of Computer Science and Engineering for their continuous support and for providing us with the necessary resources and learning environment to undertake this project.`),
    spacer(80, 60),
    body(`We are grateful to our institution for providing access to the infrastructure, laboratory facilities, and academic resources required for the successful completion of this project.`),
    spacer(80, 60),
    body(`Finally, we acknowledge the open-source community whose frameworks, libraries, and documentation have directly contributed to the technical implementation described in this report. Special acknowledgement is due to the maintainers of ${data.techStack.frontend[0]}, ${data.techStack.backend[0]}, and ${data.techStack.database[0]} — the core technologies on which this project is built.`),
    spacer(200, 60),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: "— The Project Team", size: 22, italics: true, color: GRAY, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: today, size: 20, color: MID_GRAY, font: "Arial" })],
    }),
    pageBreak(),
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE 4 — TABLE OF CONTENTS
  // ══════════════════════════════════════════════════════════════
  children.push(
    centeredTitle("TABLE OF CONTENTS"),
    hr(),
    spacer(120, 60),
  );

  const tocEntries = [
    { num: "1.", title: "Introduction" },
    { num: "2.", title: "Literature Survey" },
    { num: "3.", title: "System Requirements" },
    { num: "4.", title: "Project Overview & Objectives" },
    { num: "5.", title: "Proposed Technology Stack" },
    { num: "6.", title: "System Design" },
    { num: "7.", title: "Core Features & Modules" },
    { num: "8.", title: "Database Design" },
    { num: "9.", title: "REST API Specification" },
    { num: "10.", title: "Implementation" },
    { num: "11.", title: "Testing" },
    { num: "12.", title: "Output / UI Screens" },
    { num: "13.", title: "Development Methodology & Steps" },
    { num: "14.", title: "Estimated Project Timeline" },
    { num: "15.", title: "Recommended Project Structure" },
    { num: "16.", title: "Conclusion" },
    { num: "17.", title: "Future Scope" },
    { num: "18.", title: "References & Bibliography" },
  ];

  for (const entry of tocEntries) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: `${entry.num}  `, bold: true, size: 22, color: BRAND_RED, font: "Arial" }),
          new TextRun({ text: entry.title, size: 22, color: DARK, font: "Arial" }),
          new TextRun({ text: `  .......  —`, size: 21, color: MID_GRAY, font: "Arial" }),
        ],
      }),
    );
  }

  children.push(
    spacer(120, 80),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: "Note: Page numbers are updated automatically when opened in Microsoft Word (press Ctrl+A, then F9).", size: 18, italics: true, color: MID_GRAY, font: "Arial" })],
    }),
    pageBreak(),
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE 5 — LIST OF FIGURES & TABLES
  // ══════════════════════════════════════════════════════════════
  children.push(
    centeredTitle("LIST OF FIGURES & TABLES"),
    hr(),
    spacer(120, 60),
    subHeading("List of Figures"),
  );

  const figureList = [
    "System Architecture Diagram",
    "Data Flow Diagram (Level 0 — Context)",
    "Data Flow Diagram (Level 1 — Detailed)",
    "Entity-Relationship (ER) Diagram",
    "Use Case Diagram",
    "Sequence Diagram — User Authentication Flow",
    "Sample UI — Login / Registration Screen",
    "Sample UI — Dashboard / Main Screen",
    "Sample UI — Core Feature Screen",
  ];

  figureList.forEach((fig, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 70, after: 70 },
        children: [
          new TextRun({ text: `Figure ${i + 1}:  `, bold: true, size: 21, color: BRAND_RED, font: "Arial" }),
          new TextRun({ text: fig, size: 21, color: DARK, font: "Arial" }),
          new TextRun({ text: "  .......  —", size: 20, color: MID_GRAY, font: "Arial" }),
        ],
      }),
    );
  });

  children.push(spacer(120, 60), subHeading("List of Tables"));

  const tableList = [
    "Proposed Technology Stack Summary",
    "Core Features & Module Priorities",
    "Hardware Requirements Specification",
    "Software Requirements Specification",
    "Database Schema — Table Definitions",
    "REST API Endpoint Specification",
    "Test Cases & Expected Results",
    "Project Timeline & Milestones",
    "Risk Assessment Matrix",
  ];

  tableList.forEach((tbl, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 70, after: 70 },
        children: [
          new TextRun({ text: `Table ${i + 1}:  `, bold: true, size: 21, color: BRAND_RED, font: "Arial" }),
          new TextRun({ text: tbl, size: 21, color: DARK, font: "Arial" }),
          new TextRun({ text: "  .......  —", size: 20, color: MID_GRAY, font: "Arial" }),
        ],
      }),
    );
  });

  children.push(pageBreak());

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — INTRODUCTION
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("1. Introduction"),
    body(`This report presents a comprehensive technical blueprint for "${data.title}", a ${data.category.toLowerCase()} application. The purpose of this document is to outline the system architecture, technology selections, database design, API structure, and development plan required to successfully implement the proposed solution.`),
    spacer(80, 60),
    body(`Software engineering mini-projects serve as a practical bridge between theoretical knowledge and real-world application development. This project addresses a tangible domain problem by proposing a well-structured, scalable, and maintainable system that adheres to modern development standards and best practices.`),
    spacer(80, 60),
    subHeading("1.1 Problem Statement"),
    body(`The increasing demand for digital solutions in the domain of ${data.category.toLowerCase()} necessitates the development of a robust, user-friendly platform. Existing solutions often lack integration, scalability, or ease of use. This project aims to address these gaps through thoughtful system design and modern technology adoption.`),
    spacer(80, 60),
    subHeading("1.2 Motivation"),
    body(`The motivation for this project stems from the observation that ${data.category.toLowerCase()} workflows are often fragmented across multiple disconnected tools, leading to inefficiencies and a poor user experience. By consolidating these capabilities into a single, cohesive platform built with modern web technologies, this project aims to deliver measurable improvements in productivity, accessibility, and data integrity.`),
    spacer(80, 60),
    subHeading("1.3 Objectives"),
    bullet(`Design and develop a fully functional ${data.category.toLowerCase()} web application with an intuitive, responsive user interface.`),
    bullet(`Implement a normalised relational database schema to ensure data integrity, efficiency, and scalability.`),
    bullet(`Build a RESTful API backend that decouples the presentation layer from business logic and data persistence.`),
    bullet(`Enforce secure user authentication and role-based access control across all protected resources.`),
    bullet(`Produce professional academic documentation covering all phases of the software development lifecycle.`),
    spacer(80, 60),
    subHeading("1.4 Scope of the Project"),
    body(`The scope of this project is limited to the design and development of a ${data.category.toLowerCase()} web application. The system will encompass user authentication, core domain features, a RESTful API layer, and a relational database backend. Mobile application development and third-party integrations beyond those specified are considered out of scope for this phase.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — LITERATURE SURVEY
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("2. Literature Survey"),
    body(`A thorough review of existing systems, academic literature, and industry research was conducted to inform the design decisions documented in this report. The following subsections summarise the key findings and identify the gaps that this project addresses.`),
    spacer(80, 60),
    subHeading("2.1 Review of Existing Systems"),
    body(`Several existing solutions in the ${data.category.toLowerCase()} domain were evaluated during the research phase. While many commercial products offer partial functionality, they typically suffer from one or more of the following limitations: vendor lock-in, high licensing costs, poor API extensibility, limited customisation options, or lack of open data standards. This project proposes an open, developer-friendly alternative that addresses these shortcomings.`),
    spacer(80, 60),
    subHeading("2.2 Relevant Research & Standards"),
    bullet(`Fielding (2000) established the REST architectural constraints that underpin the API design adopted in this project. The stateless client-server model, uniform interface, and layered system constraints are all adhered to in the API specification documented in Section 9.`),
    bullet(`Beck et al. (2001) introduced the Agile Manifesto, whose principles of iterative delivery, working software over documentation, and responsiveness to change are reflected in the phased development methodology described in Section 13.`),
    bullet(`Sommerville (2016) provides a comprehensive framework for software requirements engineering and system design, which informed the requirements specification and system design sections of this report.`),
    bullet(`The OWASP Top 10 security risks framework informed the authentication design, input validation strategy, and API security measures described throughout this document.`),
    spacer(80, 60),
    subHeading("2.3 Technology Landscape"),
    body(`A comparative analysis of frontend frameworks, backend runtimes, and database technologies was performed. ${data.techStack.frontend[0]} was selected for its component-based architecture, widespread adoption, and extensive ecosystem. ${data.techStack.backend[0]} was chosen for its performance and developer ergonomics. ${data.techStack.database[0]} was selected for its strong support for relational integrity and complex query patterns relevant to this domain.`),
    spacer(80, 60),
    subHeading("2.4 Research Gap"),
    body(`The literature review reveals that while individual tools exist for various aspects of ${data.category.toLowerCase()}, there is a lack of integrated, open-source platforms that combine a modern developer experience with strong data modelling, RESTful API design, and secure multi-role access control. This project bridges that gap.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — SYSTEM REQUIREMENTS
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("3. System Requirements"),
    body(`This section specifies the minimum and recommended hardware and software requirements for developing, deploying, and operating the system. Requirements are categorised into development environment and production environment specifications.`),
    spacer(80, 60),
    subHeading("3.1 Hardware Requirements"),
    makeTable(
      ["Component", "Minimum Specification", "Recommended Specification"],
      [
        ["Processor (CPU)", "Intel Core i3 / AMD Ryzen 3, 2.0 GHz, Dual-core", "Intel Core i5/i7 / AMD Ryzen 5/7, 3.0 GHz+, Quad-core"],
        ["Memory (RAM)", "4 GB DDR4", "8 GB DDR4 or higher"],
        ["Storage", "20 GB HDD available space", "50 GB SSD (for faster build times)"],
        ["Network", "Broadband internet connection (5 Mbps)", "Stable broadband (20 Mbps+) for CI/CD and cloud deployment"],
        ["Display", "1280 × 720 resolution", "1920 × 1080 Full HD for multi-pane IDE layouts"],
        ["Production Server", "1 vCPU, 1 GB RAM (e.g. AWS t2.micro)", "2 vCPU, 4 GB RAM (e.g. AWS t3.medium)"],
      ],
      [22, 39, 39]
    ),
    spacer(160, 80),
    subHeading("3.2 Software Requirements"),
    makeTable(
      ["Category", "Software / Tool", "Version", "Purpose"],
      [
        ["Operating System", "Ubuntu 22.04 LTS / Windows 11 / macOS 13+", "Any LTS", "Development & deployment host"],
        ["Runtime", data.techStack.backend[0], "Latest LTS", "Server-side application runtime"],
        ["Frontend Framework", data.techStack.frontend[0], "Latest stable", "UI component rendering"],
        ["Database", data.techStack.database[0], "Latest stable", "Persistent data storage"],
        ["Version Control", "Git + GitHub / GitLab", "2.40+", "Source code management & collaboration"],
        ["Containerisation", "Docker + Docker Compose", "24.x", "Environment parity & deployment"],
        ["IDE / Editor", "VS Code / WebStorm", "Latest", "Primary development environment"],
        ["API Testing", "Postman / Insomnia", "Latest", "Manual & automated API testing"],
        ["Browser", "Google Chrome / Firefox", "Latest", "Frontend development & debugging"],
        ["Package Manager", "npm / yarn", "9.x / 1.22.x", "Dependency management"],
      ],
      [20, 28, 16, 36]
    ),
    spacer(160, 80),
    subHeading("3.3 Functional Requirements"),
    bullet(`FR-01: The system shall allow users to register, authenticate, and manage their accounts securely.`),
    bullet(`FR-02: The system shall provide role-based access control distinguishing between regular users and administrators.`),
    bullet(`FR-03: The system shall expose a RESTful API with JSON payloads for all data operations.`),
    bullet(`FR-04: The system shall persist all application data in a structured relational database with referential integrity.`),
    bullet(`FR-05: The system shall validate all user inputs on the server side and return descriptive error messages.`),
    bullet(`FR-06: The system shall support pagination, filtering, and sorting on all list-based API endpoints.`),
    spacer(80, 60),
    subHeading("3.4 Non-Functional Requirements"),
    bullet(`NFR-01 Performance: API responses shall be delivered within 500ms for 95% of requests under normal load.`),
    bullet(`NFR-02 Scalability: The architecture shall support horizontal scaling via stateless API design and containerisation.`),
    bullet(`NFR-03 Security: All authentication tokens shall use JWT with RS256 signing; all data in transit shall use TLS 1.3.`),
    bullet(`NFR-04 Availability: The production system shall target 99.5% uptime with automated health checks.`),
    bullet(`NFR-05 Maintainability: Code coverage shall exceed 75%; all modules shall be independently testable.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — PROJECT OVERVIEW
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("4. Project Overview & Objectives"),
    subHeading("4.1 Project Description"),
    body(data.description),
    spacer(80, 60),
    subHeading("4.2 Project Objectives"),
    body("The primary objectives of this project are:"),
    bullet(`Develop a fully functional ${data.category.toLowerCase()} application with a responsive user interface.`),
    bullet(`Design and implement a normalised relational database schema to ensure data integrity and efficiency.`),
    bullet(`Build a RESTful API backend that serves as the communication layer between the frontend and database.`),
    bullet(`Implement secure user authentication and role-based access control mechanisms.`),
    bullet(`Ensure the application is scalable, maintainable, and deployable in a cloud environment.`),
    bullet(`Produce comprehensive documentation suitable for academic and professional review.`),
    spacer(80, 60),
    subHeading("4.3 Target Users"),
    body(`The primary target audience for this application includes end-users who interact with the core features, administrators who manage system configurations and data, and developers who maintain and extend the codebase. The system is designed to be accessible, intuitive, and performant for all user categories.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — TECH STACK
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("5. Proposed Technology Stack"),
    body("The following technologies have been selected based on their industry adoption, community support, performance characteristics, and suitability for the project requirements:"),
    spacer(80, 60),
    makeTable(
      ["Layer", "Selected Technologies", "Justification"],
      [
        ["Frontend", data.techStack.frontend.join(", "), "Modern, component-based UI development with reactive state management"],
        ["Backend", data.techStack.backend.join(", "), "Scalable server-side logic, RESTful API construction, and middleware support"],
        ["Database", data.techStack.database.join(", "), "Persistent data storage with support for complex queries and relationships"],
        ["DevOps / Deployment", data.techStack.devops.join(", "), "Containerisation, CI/CD pipelines, and cloud-based hosting infrastructure"],
      ],
      [18, 40, 42]
    ),
    spacer(160, 80),
    subHeading("5.1 Technology Justification"),
    body(`The frontend framework was selected for its component-based architecture, enabling reusable UI elements and efficient DOM rendering. The backend runtime provides a non-blocking, event-driven architecture well-suited for API development. The chosen database technology offers ${data.techStack.database.length > 1 ? "both relational integrity and caching capabilities" : "strong relational integrity and query performance"}. DevOps tools ensure reproducible builds, automated testing pipelines, and reliable production deployments.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — SYSTEM DESIGN
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("6. System Design"),
    body(`This section presents the architectural design of the system through multiple diagram representations. Each diagram targets a specific aspect of the system: structural overview, data flow, entity relationships, and interaction sequences.`),
    spacer(80, 60),
    subHeading("6.1 System Architecture Diagram"),
    body(`The system follows a three-tier architecture comprising a presentation layer (frontend), application layer (backend API), and data layer (database). The following diagram illustrates the high-level component relationships and communication paths:`),
    spacer(60, 60),
    ...diagramBox(
      diagrams.architecture
        ? diagrams.architecture.split("\n")
        : [
            `┌─────────────────────────────────────────────────────────┐`,
            `│                    CLIENT LAYER                          │`,
            `│   ┌─────────────────────────────────────────────────┐   │`,
            `│   │  ${(data.techStack.frontend[0] || "React").padEnd(12)} Browser / Mobile App         │   │`,
            `│   └──────────────────────┬──────────────────────────┘   │`,
            `└──────────────────────────┼──────────────────────────────┘`,
            `                           │  HTTPS / REST                 `,
            `┌──────────────────────────┼──────────────────────────────┐`,
            `│                 APPLICATION LAYER                        │`,
            `│   ┌──────────────────────▼──────────────────────────┐   │`,
            `│   │  ${(data.techStack.backend[0] || "Node.js").padEnd(12)} API Server (JWT Auth)       │   │`,
            `│   │  Controllers → Services → Models                 │   │`,
            `│   └──────────────────────┬──────────────────────────┘   │`,
            `└──────────────────────────┼──────────────────────────────┘`,
            `                           │  SQL / ORM Queries            `,
            `┌──────────────────────────┼──────────────────────────────┐`,
            `│                    DATA LAYER                            │`,
            `│   ┌──────────────────────▼──────────────────────────┐   │`,
            `│   │  ${(data.techStack.database[0] || "PostgreSQL").padEnd(12)} Primary Database          │   │`,
            `│   └─────────────────────────────────────────────────┘   │`,
            `└─────────────────────────────────────────────────────────┘`,
          ],
      "System Architecture Diagram (Three-Tier)"
    ),
    spacer(80, 60),
    subHeading("6.2 Data Flow Diagram — Level 0 (Context)"),
    body(`The context-level DFD shows the system as a single process interacting with its external entities (actors):`),
    spacer(60, 60),
    ...diagramBox(
      diagrams.dfd0
        ? diagrams.dfd0.split("\n")
        : [
            `                                                            `,
            `  ┌───────────┐    Request / Input    ┌─────────────────┐ `,
            `  │           │ ─────────────────────▶│                 │ `,
            `  │   USER    │                        │  ${data.title.substring(0, 14).padEnd(14)} │ `,
            `  │  (Actor)  │ ◀─────────────────────│     SYSTEM      │ `,
            `  └───────────┘   Response / Output   └────────┬────────┘ `,
            `                                               │           `,
            `  ┌───────────┐    Admin Operations            │           `,
            `  │   ADMIN   │ ─────────────────────▶─────────┘           `,
            `  │  (Actor)  │                                            `,
            `  └───────────┘                                            `,
            `                                                            `,
            `  External Systems: Email Provider, Payment Gateway (if applicable)`,
          ],
      "Level 0 DFD — Context Diagram"
    ),
    spacer(80, 60),
    subHeading("6.3 Data Flow Diagram — Level 1 (Detailed)"),
    body(`The Level 1 DFD decomposes the central process into the major functional sub-processes and shows the data stores involved:`),
    spacer(60, 60),
    ...diagramBox(
      diagrams.dfd1
        ? diagrams.dfd1.split("\n")
        : [
            `  USER ──▶ [1.0 Authentication] ──▶ D1: Users Store          `,
            `              │                                               `,
            `              ▼                                               `,
            `         JWT Token                                            `,
            `              │                                               `,
            `              ▼                                               `,
            `  USER ──▶ [2.0 Core Feature Management] ──▶ D2: Data Store  `,
            `              │                                               `,
            `              ▼                                               `,
            `         Processed Output ──▶ USER                           `,
            `              │                                               `,
            `              ▼                                               `,
            `  ADMIN ─▶ [3.0 Administration & Reporting] ──▶ D3: Logs     `,
            `              │                                               `,
            `              ▼                                               `,
            `         Audit Trail ──▶ ADMIN                               `,
          ],
      "Level 1 DFD — Detailed Process Decomposition"
    ),
    spacer(80, 60),
    subHeading("6.4 Entity-Relationship (ER) Diagram"),
    body(`The ER diagram below represents the key entities, their attributes, and the relationships between them as reflected in the database schema defined in Section 8:`),
    spacer(60, 60),
  );

  // Build ER diagram from actual database tables
  const erLines = [];
  if (data.database && data.database.length > 0) {
    for (let i = 0; i < data.database.length; i++) {
      const tbl = data.database[i];
      erLines.push(`  ┌──────────────────────────────────────┐`);
      erLines.push(`  │  ENTITY: ${tbl.name.toUpperCase().padEnd(28)} │`);
      erLines.push(`  ├──────────────────────────────────────┤`);
      for (const col of tbl.columns.slice(0, 6)) {
        const line = `  │  ${col.name.padEnd(20)} ${(col.type || "").padEnd(15)} │`;
        erLines.push(line);
      }
      erLines.push(`  └──────────────────────────────────────┘`);
      if (i < data.database.length - 1) erLines.push(`           │`);
    }
    erLines.push(`  (Relationships enforced via FK constraints as described in Section 8)`);
  }

  children.push(
    ...diagramBox(diagrams.er ? diagrams.er.split("\n") : erLines, "Entity-Relationship Diagram"),
    spacer(80, 60),
    subHeading("6.5 Use Case Diagram"),
    ...diagramBox(
      diagrams.usecase
        ? diagrams.usecase.split("\n")
        : [
            `  ╔═══════════════════════════════════════════════════════╗`,
            `  ║              SYSTEM BOUNDARY                          ║`,
            `  ║                                                       ║`,
            `  ║   ┌─────────────────────────────────────────────┐    ║`,
            `  ║   │  (UC-01) Register / Login                   │    ║`,
            `  ║   │  (UC-02) Browse & Search                    │◀───╬── User`,
            `  ║   │  (UC-03) Manage Profile                     │    ║`,
            `  ║   │  (UC-04) Perform Core Domain Action         │    ║`,
            `  ║   └─────────────────────────────────────────────┘    ║`,
            `  ║                                                       ║`,
            `  ║   ┌─────────────────────────────────────────────┐    ║`,
            `  ║   │  (UC-05) Manage Users                       │◀───╬── Admin`,
            `  ║   │  (UC-06) View System Reports                │    ║`,
            `  ║   │  (UC-07) Configure System Settings          │    ║`,
            `  ║   └─────────────────────────────────────────────┘    ║`,
            `  ╚═══════════════════════════════════════════════════════╝`,
          ],
      "Use Case Diagram"
    ),
    spacer(80, 60),
    subHeading("6.6 Sequence Diagram — User Authentication"),
    ...diagramBox(
      diagrams.sequence
        ? diagrams.sequence.split("\n")
        : [
            `  Client          API Server         Database            `,
            `    │                 │                  │               `,
            `    │  POST /login    │                  │               `,
            `    │ ──────────────▶ │                  │               `,
            `    │                 │  SELECT user     │               `,
            `    │                 │ ───────────────▶ │               `,
            `    │                 │  user record     │               `,
            `    │                 │ ◀─────────────── │               `,
            `    │                 │  bcrypt compare  │               `,
            `    │                 │  sign JWT token  │               `,
            `    │  200 + JWT      │                  │               `,
            `    │ ◀────────────── │                  │               `,
            `    │                 │                  │               `,
            `    │  GET /protected │                  │               `,
            `    │  Authorization: │                  │               `,
            `    │  Bearer <token> │                  │               `,
            `    │ ──────────────▶ │                  │               `,
            `    │                 │  verify JWT      │               `,
            `    │                 │  fetch resource  │               `,
            `    │                 │ ───────────────▶ │               `,
            `    │  200 + data     │ ◀─────────────── │               `,
            `    │ ◀────────────── │                  │               `,
          ],
      "Sequence Diagram — JWT Authentication Flow"
    ),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 7 — CORE FEATURES
  // ══════════════════════════════════════════════════════════════
  children.push(sectionHeading("7. Core Features & Modules"));
  children.push(
    body("The system is composed of the following core modules, prioritised by their criticality to the minimum viable product (MVP):"),
    spacer(80, 60),
  );

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...data.features].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  children.push(
    makeTable(
      ["#", "Module / Feature", "Description", "Priority"],
      sorted.map((f, i) => [String(i + 1), f.name, f.description, f.priority.toUpperCase()]),
      [6, 24, 54, 16]
    ),
    spacer(160, 80),
    subHeading("7.1 Feature Implementation Notes"),
    body("High-priority features constitute the core MVP and must be implemented in the initial sprint. Medium-priority features provide significant value and should be completed in the second sprint. Low-priority features are enhancements that can be deferred to a future release cycle if time constraints arise."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 8 — DATABASE DESIGN
  // ══════════════════════════════════════════════════════════════
  children.push(sectionHeading("8. Database Design"));
  children.push(
    body("The database has been normalised to Third Normal Form (3NF) to eliminate data redundancy and ensure referential integrity. The Entity-Relationship model maps directly to the following table definitions:"),
    spacer(80, 60),
  );

  for (let ti = 0; ti < data.database.length; ti++) {
    const table = data.database[ti];
    children.push(
      subHeading(`8.${ti + 1}  Table: ${table.name}`),
      makeTable(
        ["Column Name", "Data Type", "Constraint / Notes"],
        table.columns.map(c => [c.name, c.type, c.note || "—"]),
        [33, 33, 34]
      ),
      spacer(120, 80),
    );
  }

  children.push(
    subHeading("8.N  Relationships & Integrity Constraints"),
    body("Foreign key constraints enforce referential integrity across all related tables. Cascade delete rules are applied where child records are logically dependent on their parent. Unique constraints prevent duplicate entries in business-critical fields such as email addresses and usernames. All primary keys use UUID v4 to prevent enumeration attacks and support distributed system patterns."),
    spacer(80, 60),
    subHeading("8.N+1  Normalisation"),
    body("First Normal Form (1NF): All table columns contain atomic, indivisible values. No repeating groups or arrays exist within any column. Second Normal Form (2NF): All non-key attributes are fully functionally dependent on the entire primary key. Partial dependencies have been eliminated. Third Normal Form (3NF): No transitive dependencies exist between non-key attributes. Each non-key column depends exclusively on the primary key."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 9 — API SPECIFICATION
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("9. REST API Specification"),
    body("The application exposes a RESTful HTTP API following the principles defined by Fielding (2000). All endpoints return JSON-formatted responses. Authentication is enforced via JSON Web Tokens (JWT) transmitted in the Authorization header using the Bearer scheme."),
    spacer(80, 60),
    makeTable(
      ["Method", "Endpoint Path", "Description", "Auth Required"],
      data.apis.map(a => [a.method, a.path, a.description, a.auth ? "✓ Bearer JWT" : "Public"]),
      [12, 28, 44, 16]
    ),
    spacer(160, 80),
    subHeading("9.1 API Design Principles"),
    bullet("All responses follow a consistent envelope: { success, data, error, meta }."),
    bullet("HTTP status codes adhere to RFC 7231: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorised, 404 Not Found, 500 Internal Server Error."),
    bullet("Input validation is performed server-side using schema validation (Zod / Joi) on all POST and PUT payloads."),
    bullet("Rate limiting is applied at the API gateway level to prevent abuse and ensure fair usage."),
    bullet("All endpoints are documented via OpenAPI / Swagger specification for developer reference."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 10 — IMPLEMENTATION
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("10. Implementation"),
    body(`This section describes the module-wise implementation of the system, covering the key architectural decisions, code organisation patterns, and technology-specific implementation details adopted during development.`),
    spacer(80, 60),
    subHeading("10.1 Frontend Implementation"),
    body(`The frontend is built using ${data.techStack.frontend.join(" and ")}. The application follows a component-based architecture where UI elements are decomposed into reusable atomic components. Global state is managed using a centralised store (Context API / Redux Toolkit), ensuring a single source of truth. All API calls are abstracted into a dedicated services layer using Axios, with interceptors handling token attachment and error responses uniformly.`),
    spacer(80, 60),
    subHeading("10.2 Backend Implementation"),
    body(`The backend API is implemented using ${data.techStack.backend.join(" and ")}. The codebase follows the MVC (Model-View-Controller) pattern: Controllers handle HTTP request/response logic; Services contain domain business logic; Models define database schema and ORM mappings. Cross-cutting concerns such as authentication guards, request logging, and input validation are implemented as middleware functions applied at the route level.`),
    spacer(80, 60),
    subHeading("10.3 Authentication & Security"),
    body(`User authentication is implemented using JSON Web Tokens (JWT). Upon successful login, the server issues a signed access token (15-minute expiry) and a refresh token (7-day expiry) stored in an HTTP-only cookie. All protected routes pass through an authentication middleware that verifies the token signature and expiry before granting access. Passwords are hashed using bcrypt with a salt factor of 12 before persistence.`),
    spacer(80, 60),
    subHeading("10.4 Tech Stack Justification Summary"),
    body(`${data.techStack.frontend[0]} was selected for its Virtual DOM, component reusability, and strong ecosystem. ${data.techStack.backend[0]} provides a non-blocking I/O model ideal for handling concurrent API requests. ${data.techStack.database[0]} delivers ACID-compliant transactions and supports complex relational queries required by the domain model. ${data.techStack.devops[0]} enables containerised, reproducible deployments across development, staging, and production environments.`),
    spacer(80, 60),
    subHeading("10.5 Recommended Project Structure"),
    body("The following directory layout adheres to the separation-of-concerns principle and is compatible with the selected technology stack:"),
    spacer(60, 60),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: "0F172A" },
      border: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        left:   { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        right:  { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
      },
      children: data.folderStructure.split("\n").flatMap((line, i) => [
        ...(i > 0 ? [new TextRun({ break: 1 })] : []),
        new TextRun({ text: line, size: 18, font: "Courier New", color: "94A3B8" }),
      ]),
    }),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 11 — TESTING
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("11. Testing"),
    body(`A comprehensive multi-layered testing strategy was employed throughout the development lifecycle. Testing ensures functional correctness, integration soundness, and system-level behaviour aligns with the documented requirements.`),
    spacer(80, 60),
    subHeading("11.1 Unit Testing"),
    body(`Unit tests were written for all service-layer functions and utility helpers using Jest. Each test verifies a single unit of logic in isolation by mocking all external dependencies (database calls, third-party APIs). A minimum code coverage threshold of 75% is enforced; coverage reports are generated on every CI pipeline run.`),
    spacer(80, 60),
    subHeading("11.2 Integration Testing"),
    body(`Integration tests validate the interaction between the API controllers, service layer, and database. Supertest is used to fire HTTP requests against the application server in a test environment with a dedicated test database, verifying that the full request-response cycle produces correct outputs and side effects.`),
    spacer(80, 60),
    subHeading("11.3 Test Cases"),
    makeTable(
      ["TC #", "Module", "Test Description", "Input", "Expected Output", "Status"],
      [
        ["TC-01", "Authentication", "User registers with valid credentials", "Valid email, strong password", "201 Created, user record persisted", "Pass"],
        ["TC-02", "Authentication", "Login with correct credentials", "Registered email + password", "200 OK, JWT token returned", "Pass"],
        ["TC-03", "Authentication", "Login with incorrect password", "Registered email, wrong password", "401 Unauthorised", "Pass"],
        ["TC-04", "API — Protected Route", "Access protected endpoint without token", "No Authorization header", "401 Unauthorised", "Pass"],
        ["TC-05", "API — Protected Route", "Access protected endpoint with valid token", "Valid Bearer JWT", "200 OK, resource returned", "Pass"],
        ["TC-06", "Validation", "Submit form with missing required fields", "Incomplete payload", "400 Bad Request, field errors", "Pass"],
        ["TC-07", "Database", "Create record and verify persistence", "Valid entity payload", "Record exists in DB after insert", "Pass"],
        ["TC-08", "Database", "Delete record with cascade", "Valid record ID", "Record and dependents removed", "Pass"],
        ["TC-09", "Admin", "Non-admin accesses admin endpoint", "User JWT (role: user)", "403 Forbidden", "Pass"],
        ["TC-10", "Performance", "API responds within 500ms at normal load", "Standard GET request", "Response time < 500ms", "Pass"],
      ],
      [8, 18, 28, 18, 18, 10]
    ),
    spacer(160, 80),
    subHeading("11.4 End-to-End Testing"),
    body("End-to-end tests using Playwright simulate complete user journeys through the browser. Critical flows tested include: new user registration and email verification, complete login-to-dashboard flow, creation and deletion of core domain entities, and admin panel access control verification."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 12 — OUTPUT / UI SCREENS
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("12. Output / UI Screens"),
    body(`This section illustrates the key user interface screens of the application. Each screen is accompanied by a caption describing its purpose and the user interaction it supports.`),
    spacer(80, 60),
    subHeading("12.1 Login / Registration Screen"),
    body(`The authentication screen provides a clean, minimal form for user login and account registration. It includes client-side validation feedback, a password visibility toggle, and a redirect to the dashboard upon successful authentication.`),
    spacer(60, 40),
    ...diagramBox(
      [
        `  ┌──────────────────────────────────────────────────────┐`,
        `  │  🔐  ${data.title.substring(0, 30).padEnd(30)}          │`,
        `  ├──────────────────────────────────────────────────────┤`,
        `  │                                                      │`,
        `  │     ┌────────────────────────────────────────┐      │`,
        `  │     │  📧  Email address                     │      │`,
        `  │     └────────────────────────────────────────┘      │`,
        `  │     ┌────────────────────────────────────────┐      │`,
        `  │     │  🔒  Password                  [Show]  │      │`,
        `  │     └────────────────────────────────────────┘      │`,
        `  │                                                      │`,
        `  │     ┌────────────────────────────────────────┐      │`,
        `  │     │         LOGIN / SIGN IN                │      │`,
        `  │     └────────────────────────────────────────┘      │`,
        `  │              Don't have an account? Register         │`,
        `  └──────────────────────────────────────────────────────┘`,
      ],
      "Figure 7: Login / Registration Screen"
    ),
    spacer(120, 60),
    subHeading("12.2 Main Dashboard Screen"),
    body(`The dashboard provides an at-a-glance summary of the user's data through summary cards, recent activity lists, and quick-action buttons. The navigation sidebar provides access to all major modules of the application.`),
    spacer(60, 40),
    ...diagramBox(
      [
        `  ┌──────────┬────────────────────────────────────────────┐`,
        `  │          │  🏠 Dashboard                    👤 User ▾ │`,
        `  │  SIDEBAR │────────────────────────────────────────────│`,
        `  │          │                                            │`,
        `  │  🏠 Home │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │`,
        `  │  📊 Data │  │ Total    │ │ Active   │ │ Pending  │  │`,
        `  │  ⚙ Admin │  │  1,284   │ │   342    │ │   57     │  │`,
        `  │  📋 Logs │  └──────────┘ └──────────┘ └──────────┘  │`,
        `  │  🔔 Notif│                                            │`,
        `  │          │  Recent Activity                           │`,
        `  │          │  ┌────────────────────────────────────┐   │`,
        `  │          │  │  Item 1 .............. 2 mins ago  │   │`,
        `  │          │  │  Item 2 .............. 5 mins ago  │   │`,
        `  │          │  │  Item 3 .............. 10 mins ago │   │`,
        `  │          │  └────────────────────────────────────┘   │`,
        `  └──────────┴────────────────────────────────────────────┘`,
      ],
      "Figure 8: Main Dashboard Screen"
    ),
    spacer(120, 60),
    subHeading("12.3 Core Feature / Detail Screen"),
    body(`The core feature screen provides detailed interaction with the primary domain entities. It includes a data table with sorting and filtering, action buttons for creating, editing, and deleting records, and a detail pane for viewing individual record information.`),
    spacer(60, 40),
    ...diagramBox(
      [
        `  ┌──────────┬────────────────────────────────────────────┐`,
        `  │          │  📋 Core Feature           [+ Add New]     │`,
        `  │  SIDEBAR │────────────────────────────────────────────│`,
        `  │          │  Search: [_______________] [Filter ▾]      │`,
        `  │  🏠 Home │                                            │`,
        `  │  📊 Data │  ┌──────┬────────────┬──────────┬───────┐  │`,
        `  │► Feature │  │  ID  │    Name    │  Status  │ Action│  │`,
        `  │  ⚙ Admin │  ├──────┼────────────┼──────────┼───────┤  │`,
        `  │          │  │  001 │  Record A  │  Active  │ ✏ 🗑  │  │`,
        `  │          │  │  002 │  Record B  │  Pending │ ✏ 🗑  │  │`,
        `  │          │  │  003 │  Record C  │  Closed  │ ✏ 🗑  │  │`,
        `  │          │  └──────┴────────────┴──────────┴───────┘  │`,
        `  │          │  Page 1 of 12   [◀ Prev]   [Next ▶]        │`,
        `  └──────────┴────────────────────────────────────────────┘`,
      ],
      "Figure 9: Core Feature / Data Management Screen"
    ),
    spacer(80, 60),
    body(`Note: The wireframes above represent the intended UI layout and interaction design. Actual implementation may differ slightly in visual styling based on the selected component library and design system.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 13 — DEVELOPMENT STEPS
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("13. Development Methodology & Steps"),
    body("The project follows an Agile development methodology with iterative sprint cycles. Each development step represents a logical increment that delivers testable, working software. The following steps are prescribed:"),
    spacer(80, 60),
  );

  for (const s of data.devSteps) {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [
          new TextRun({ text: `Step ${s.step}:  `, bold: true, size: 23, color: BRAND_RED, font: "Arial" }),
          new TextRun({ text: s.title, bold: true, size: 23, color: BRAND_DARK, font: "Arial" }),
        ],
      }),
      body(s.description),
      spacer(40, 40),
    );
  }

  children.push(
    spacer(80, 60),
    subHeading("13.1 Testing Strategy"),
    body("A multi-layered testing strategy will be employed throughout the development lifecycle. Unit tests will be written for all service-layer functions using Jest. Integration tests will validate API endpoint behaviour using Supertest. End-to-end tests using Playwright will simulate real user journeys. A minimum code coverage threshold of 75% is required before production deployment."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 14 — TIMELINE
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("14. Estimated Project Timeline"),
    body("The following schedule outlines the key phases, their estimated duration, and primary deliverables. This timeline assumes a single developer working full-time or a team of 2–3 members working part-time."),
    spacer(80, 60),
    makeTable(
      ["Phase", "Duration", "Key Deliverables"],
      data.timeline.map((p, i) => [
        `${i + 1}. ${p.phase}`,
        p.duration,
        p.tasks.join(" · "),
      ]),
      [30, 18, 52]
    ),
    spacer(160, 80),
    subHeading("14.1 Risk Assessment"),
    makeTable(
      ["Risk", "Likelihood", "Impact", "Mitigation"],
      [
        ["Scope creep", "Medium", "High", "Define MVP clearly; use change-request process for new features"],
        ["Third-party API downtime", "Low", "Medium", "Implement retry logic and fallback mock responses"],
        ["Team member unavailability", "Medium", "Medium", "Maintain documentation; use feature branches for isolation"],
        ["Security vulnerabilities", "Low", "High", "Run OWASP ZAP scans; enforce dependency audits via npm audit"],
      ],
      [28, 16, 14, 42]
    ),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 15 — FOLDER STRUCTURE
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("15. Recommended Project Structure"),
    body("The following directory layout adheres to the separation-of-concerns principle and is compatible with the selected technology stack. Each directory serves a distinct architectural purpose:"),
    spacer(80, 60),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: "0F172A" },
      border: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        left:   { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
        right:  { style: BorderStyle.SINGLE, size: 4, color: BRAND_RED },
      },
      children: data.folderStructure.split("\n").flatMap((line, i) => [
        ...(i > 0 ? [new TextRun({ break: 1 })] : []),
        new TextRun({ text: line, size: 18, font: "Courier New", color: "94A3B8" }),
      ]),
    }),
    spacer(160, 80),
    subHeading("15.1 Directory Descriptions"),
    bullet("client/src/components — Reusable, atomic UI components following the Atomic Design methodology."),
    bullet("client/src/pages — Route-level view components that compose smaller components."),
    bullet("client/src/services — API client abstractions and data-fetching hooks."),
    bullet("server/src/controllers — HTTP request handlers that delegate to the service layer."),
    bullet("server/src/services — Business logic, completely decoupled from HTTP concerns."),
    bullet("server/src/models — Database schema definitions and ORM model declarations."),
    bullet("server/src/middleware — Cross-cutting concerns: authentication guards, validation, logging."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 16 — CONCLUSION
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("16. Conclusion"),
    body(`This report has presented a comprehensive blueprint for the development of "${data.title}". The proposed system leverages modern, industry-standard technologies to deliver a scalable, maintainable, and feature-rich ${data.category.toLowerCase()} application. The architecture follows established design patterns including RESTful API design, relational database normalisation, and component-based frontend development.`),
    spacer(80, 60),
    body(`The phased development approach ensures that a minimum viable product can be delivered early in the project lifecycle, with iterative enhancements added in subsequent sprints. The risk assessment and testing strategy ensure that quality and security are maintained throughout the development process.`),
    spacer(80, 60),
    body(`The system design successfully addresses the problem statement identified in the introduction by providing an integrated, scalable, and user-friendly platform for ${data.category.toLowerCase()}. The literature survey validated the technology choices and confirmed the existence of a gap in the market that this project addresses. All functional and non-functional requirements specified in Section 3 have been accounted for in the architectural decisions documented herein.`),
    spacer(80, 60),
    subHeading("16.1 Limitations"),
    bullet(`The current design targets web browsers only; a native mobile application is not included in this phase.`),
    bullet(`Real-time features (WebSockets, push notifications) are deferred to a future sprint due to added infrastructure complexity.`),
    bullet(`Machine learning or AI-driven features are outside the scope of this MVP and are identified as future scope items.`),
    bullet(`The performance benchmarks described are estimates based on typical workloads; production load testing is recommended before go-live.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 17 — FUTURE SCOPE
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("17. Future Scope"),
    body("The following enhancements are recommended for future development phases beyond the initial MVP:"),
    bullet("Mobile Application — Develop native iOS and Android applications using React Native to extend platform reach."),
    bullet("Machine Learning Integration — Incorporate recommendation engines or predictive analytics using Python-based ML pipelines."),
    bullet("Real-time Features — Implement WebSocket-based live updates using Socket.io for collaborative or time-sensitive features."),
    bullet("Internationalisation (i18n) — Add multi-language support to expand the application's geographical reach."),
    bullet("Microservices Migration — Decompose the monolithic backend into domain-specific microservices as user load scales."),
    bullet("Progressive Web App (PWA) — Enable offline functionality and push notifications via service workers."),
    bullet("Advanced Analytics Dashboard — Integrate business intelligence visualisations using D3.js or Chart.js for admin reporting."),
    bullet("Third-party OAuth — Add social login support (Google, GitHub) to reduce friction in the user onboarding flow."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 18 — REFERENCES
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("18. References & Bibliography"),
    body("The following references were consulted in the preparation of this report and informed the technology and architectural decisions documented herein. All citations follow the IEEE reference format."),
    spacer(80, 60),
  );

  for (const ref of refs) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        indent: { left: 720, hanging: 720 },
        children: [new TextRun({ text: ref, size: 20, color: DARK, font: "Arial" })],
      }),
    );
  }

  children.push(
    spacer(160, 80),
    hr(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 0 },
      children: [
        new TextRun({ text: `${data.title}  —  Generated by SkillDzire Mini Project Generator  —  ${today}`, size: 18, color: MID_GRAY, font: "Arial", italics: true }),
      ],
    }),
  );

  // ══════════════════════════════════════════════════════════════
  // BUILD DOCUMENT
  // ══════════════════════════════════════════════════════════════
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: "numbers",
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, color: BRAND_RED, font: "Arial" },
          paragraph: { spacing: { before: 400, after: 180 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, color: BRAND_DARK, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER } },
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({ text: data.title, size: 18, color: GRAY, font: "Arial" }),
              new TextRun({ text: "  |  SkillDzire Mini Project Generator", size: 18, color: MID_GRAY, font: "Arial" }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER } },
            spacing: { before: 80, after: 0 },
            children: [
              new TextRun({ text: "Page ", size: 18, color: GRAY, font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: BRAND_RED, font: "Arial", bold: true }),
              new TextRun({ text: " of ", size: 18, color: GRAY, font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GRAY, font: "Arial" }),
              new TextRun({ text: `  —  ${data.title}`, size: 18, color: MID_GRAY, font: "Arial" }),
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