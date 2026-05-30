const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, LevelFormat,
  TableOfContents, StyleLevel, PageBreak
} = require("docx");

// ─── Color Palette ────────────────────────────────────────────
const BRAND_RED  = "C0300A";   // slightly darker for print
const BRAND_DARK = "1E1E2E";
const DARK       = "1A1A1A";
const GRAY       = "5A6478";
const MID_GRAY   = "9CA3AF";
const LIGHT_GRAY = "F3F4F6";
const ALT_ROW    = "FEF3F0";   // very light red tint for alt rows
const WHITE      = "FFFFFF";
const BORDER     = "D1D5DB";
const ACCENT     = "3B82F6";   // blue for "public" auth badges

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

// ─── Section heading (Heading 1) — used for TOC entries ───────
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

// ─── Label + value row (for cover page metadata) ──────────────
function labelValue(label, value) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, color: GRAY, font: "Arial" }),
      new TextRun({ text: value, size: 22, color: DARK, font: "Arial" }),
    ],
  });
}

// ─── Unified table builder ────────────────────────────────────
function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      bottom:  { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      left:    { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      right:   { style: BorderStyle.SINGLE, size: 6,  color: BORDER },
      insideH: { style: BorderStyle.SINGLE, size: 3,  color: BORDER },
      insideV: { style: BorderStyle.SINGLE, size: 3,  color: BORDER },
    },
    rows: [
      // ── Header row ──
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            shading: { type: ShadingType.SOLID, color: BRAND_DARK },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })],
            })],
          })
        ),
      }),
      // ── Data rows ──
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            new TableCell({
              width: colWidths ? { size: colWidths[ci], type: WidthType.PERCENTAGE } : undefined,
              shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? WHITE : ALT_ROW },
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

// ─── References list ──────────────────────────────────────────
function buildReferences(data) {
  // Auto-generate references from the tech stack + standard academic sources
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

  // Always add REST API + Agile references
  refs.push(
    `[${refs.length + 1}] Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures (Doctoral dissertation). University of California, Irvine.`,
    `[${refs.length + 2}] Beck, K., et al. (2001). Manifesto for Agile Software Development. https://agilemanifesto.org`,
    `[${refs.length + 3}] Sommerville, I. (2016). Software Engineering (10th ed.). Pearson Education.`,
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

  // ══════════════════════════════════════════════════════════════
  // PAGE 1 — COVER PAGE
  // ══════════════════════════════════════════════════════════════
  children.push(
    spacer(600, 0),
    // Institution line
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

    // Project title — large and prominent
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: data.title, bold: true, size: 52, color: BRAND_RED, font: "Arial" })],
    }),

    // Tagline
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 480 },
      children: [new TextRun({ text: data.tagline, size: 26, color: GRAY, font: "Arial", italics: true })],
    }),

    // Metadata block
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

    // Force new page after cover
    pageBreak(),
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE 2 — ABSTRACT (before TOC, per academic convention)
  // ══════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new TextRun({ text: "ABSTRACT", bold: true, size: 32, color: BRAND_DARK, font: "Arial", allCaps: true })],
    }),
    hr(),
    spacer(120, 60),
    body(data.description),
    spacer(60, 80),

    // Keywords
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: "Keywords: ", bold: true, size: 21, color: BRAND_RED, font: "Arial" }),
        new TextRun({
          text: [
            data.category,
            data.techStack.frontend[0],
            data.techStack.backend[0],
            data.techStack.database[0],
            "Software Architecture",
            "REST API",
          ].join(", "),
          size: 21, color: GRAY, italics: true, font: "Arial",
        }),
      ],
    }),

    pageBreak(),
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE 3 — TABLE OF CONTENTS
  // ══════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new TextRun({ text: "TABLE OF CONTENTS", bold: true, size: 32, color: BRAND_DARK, font: "Arial", allCaps: true })],
    }),
    hr(),
    spacer(120, 60),
  );

  // Manual TOC entries (docx-js auto TOC needs Word to refresh; manual is reliable)
  const tocEntries = [
    { num: "1.", title: "Introduction", page: "—" },
    { num: "2.", title: "Project Overview & Objectives", page: "—" },
    { num: "3.", title: "Proposed Technology Stack", page: "—" },
    { num: "4.", title: "Core Features & Modules", page: "—" },
    { num: "5.", title: "Database Schema Design", page: "—" },
    { num: "6.", title: "REST API Specification", page: "—" },
    { num: "7.", title: "Development Methodology & Steps", page: "—" },
    { num: "8.", title: "Estimated Project Timeline", page: "—" },
    { num: "9.", title: "Recommended Project Structure", page: "—" },
    { num: "10.", title: "Conclusion & Future Scope", page: "—" },
    { num: "11.", title: "References & Bibliography", page: "—" },
  ];

  for (const entry of tocEntries) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: `${entry.num}  `, bold: true, size: 22, color: BRAND_RED, font: "Arial" }),
          new TextRun({ text: entry.title, size: 22, color: DARK, font: "Arial" }),
          new TextRun({ text: `  .......  ${entry.page}`, size: 21, color: MID_GRAY, font: "Arial" }),
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
    subHeading("1.2 Scope of the Project"),
    body(`The scope of this project is limited to the design and development of a ${data.category.toLowerCase()} web application. The system will encompass user authentication, core domain features, a RESTful API layer, and a relational database backend. Mobile application development and third-party integrations beyond those specified are considered out of scope for this phase.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — PROJECT OVERVIEW
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("2. Project Overview & Objectives"),
    subHeading("2.1 Project Description"),
    body(data.description),
    spacer(80, 60),
    subHeading("2.2 Project Objectives"),
    body("The primary objectives of this project are:"),
    bullet(`Develop a fully functional ${data.category.toLowerCase()} application with a responsive user interface.`),
    bullet(`Design and implement a normalised relational database schema to ensure data integrity and efficiency.`),
    bullet(`Build a RESTful API backend that serves as the communication layer between the frontend and the database.`),
    bullet(`Implement secure user authentication and role-based access control mechanisms.`),
    bullet(`Ensure the application is scalable, maintainable, and deployable in a cloud environment.`),
    bullet(`Produce comprehensive documentation suitable for academic and professional review.`),
    spacer(80, 60),
    subHeading("2.3 Target Users"),
    body(`The primary target audience for this application includes end-users who interact with the core features, administrators who manage system configurations and data, and developers who maintain and extend the codebase. The system is designed to be accessible, intuitive, and performant for all user categories.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — TECH STACK
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("3. Proposed Technology Stack"),
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
    subHeading("3.1 Technology Justification"),
    body(`The frontend framework was selected for its component-based architecture, enabling reusable UI elements and efficient DOM rendering. The backend runtime provides a non-blocking, event-driven architecture well-suited for API development. The chosen database technology offers ${data.techStack.database.length > 1 ? "both relational integrity and caching capabilities" : "strong relational integrity and query performance"}. DevOps tools ensure reproducible builds, automated testing pipelines, and reliable production deployments.`),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — CORE FEATURES
  // ══════════════════════════════════════════════════════════════
  children.push(sectionHeading("4. Core Features & Modules"));
  body("The system is composed of the following core modules, prioritised by their criticality to the minimum viable product (MVP):"),
  spacer(80, 60);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...data.features].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  children.push(
    makeTable(
      ["#", "Module / Feature", "Description", "Priority"],
      sorted.map((f, i) => [String(i + 1), f.name, f.description, f.priority.toUpperCase()]),
      [6, 24, 54, 16]
    ),
    spacer(160, 80),
    subHeading("4.1 Feature Implementation Notes"),
    body("High-priority features constitute the core MVP and must be implemented in the initial sprint. Medium-priority features provide significant value and should be completed in the second sprint. Low-priority features are enhancements that can be deferred to a future release cycle if time constraints arise."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — DATABASE SCHEMA
  // ══════════════════════════════════════════════════════════════
  children.push(sectionHeading("5. Database Schema Design"));
  children.push(
    body("The database has been normalised to Third Normal Form (3NF) to eliminate data redundancy and ensure referential integrity. The Entity-Relationship model maps directly to the following table definitions:"),
    spacer(80, 60),
  );

  for (let ti = 0; ti < data.database.length; ti++) {
    const table = data.database[ti];
    children.push(
      subHeading(`5.${ti + 1}  Table: ${table.name}`),
      makeTable(
        ["Column Name", "Data Type", "Constraint / Notes"],
        table.columns.map(c => [c.name, c.type, c.note || "—"]),
        [33, 33, 34]
      ),
      spacer(120, 80),
    );
  }

  children.push(
    subHeading("5.N  Relationships & Integrity"),
    body("Foreign key constraints enforce referential integrity across all related tables. Cascade delete rules are applied where child records are logically dependent on their parent. Unique constraints prevent duplicate entries in business-critical fields such as email addresses and usernames. All primary keys use UUID v4 to prevent enumeration attacks and support distributed system patterns."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — API SPECIFICATION
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("6. REST API Specification"),
    body("The application exposes a RESTful HTTP API following the principles defined by Fielding (2000). All endpoints return JSON-formatted responses. Authentication is enforced via JSON Web Tokens (JWT) transmitted in the Authorization header using the Bearer scheme."),
    spacer(80, 60),
    makeTable(
      ["Method", "Endpoint Path", "Description", "Auth Required"],
      data.apis.map(a => [a.method, a.path, a.description, a.auth ? "✓ Bearer JWT" : "Public"]),
      [12, 28, 44, 16]
    ),
    spacer(160, 80),
    subHeading("6.1 API Design Principles"),
    bullet("All responses follow a consistent envelope: { success, data, error, meta }."),
    bullet("HTTP status codes adhere to RFC 7231: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorised, 404 Not Found, 500 Internal Server Error."),
    bullet("Input validation is performed server-side using schema validation (Zod / Joi) on all POST and PUT payloads."),
    bullet("Rate limiting is applied at the API gateway level to prevent abuse and ensure fair usage."),
    bullet("All endpoints are documented via OpenAPI / Swagger specification for developer reference."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 7 — DEVELOPMENT STEPS
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("7. Development Methodology & Steps"),
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
    subHeading("7.1 Testing Strategy"),
    body("A multi-layered testing strategy will be employed throughout the development lifecycle. Unit tests will be written for all service-layer functions using Jest. Integration tests will validate API endpoint behaviour using Supertest. End-to-end tests using Playwright will simulate real user journeys. A minimum code coverage threshold of 75% is required before production deployment."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 8 — TIMELINE
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("8. Estimated Project Timeline"),
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
    subHeading("8.1 Risk Assessment"),
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
  // SECTION 9 — FOLDER STRUCTURE
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("9. Recommended Project Structure"),
    body("The following directory layout adheres to the separation-of-concerns principle and is compatible with the selected technology stack. Each directory serves a distinct architectural purpose:"),
    spacer(80, 60),
    // Dark-background code block
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { type: ShadingType.SOLID, color: "0F172A" },
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
    subHeading("9.1 Directory Descriptions"),
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
  // SECTION 10 — CONCLUSION & FUTURE SCOPE
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("10. Conclusion & Future Scope"),
    subHeading("10.1 Conclusion"),
    body(`This report has presented a comprehensive blueprint for the development of "${data.title}". The proposed system leverages modern, industry-standard technologies to deliver a scalable, maintainable, and feature-rich ${data.category.toLowerCase()} application. The architecture follows established design patterns including RESTful API design, relational database normalisation, and component-based frontend development.`),
    spacer(80, 60),
    body(`The phased development approach ensures that a minimum viable product can be delivered early in the project lifecycle, with iterative enhancements added in subsequent sprints. The risk assessment and testing strategy ensure that quality and security are maintained throughout the development process.`),
    spacer(80, 60),
    subHeading("10.2 Future Scope"),
    body("The following enhancements are recommended for future development phases beyond the initial MVP:"),
    bullet("Mobile Application — Develop native iOS and Android applications using React Native to extend platform reach."),
    bullet("Machine Learning Integration — Incorporate recommendation engines or predictive analytics using Python-based ML pipelines."),
    bullet("Real-time Features — Implement WebSocket-based live updates using Socket.io for collaborative or time-sensitive features."),
    bullet("Internationalisation (i18n) — Add multi-language support to expand the application's geographical reach."),
    bullet("Microservices Migration — Decompose the monolithic backend into domain-specific microservices as user load scales."),
    bullet("Progressive Web App (PWA) — Enable offline functionality and push notifications via service workers."),
    spacer(),
  );

  // ══════════════════════════════════════════════════════════════
  // SECTION 11 — REFERENCES
  // ══════════════════════════════════════════════════════════════
  children.push(
    sectionHeading("11. References & Bibliography"),
    body("The following references were consulted in the preparation of this report and informed the technology and architectural decisions documented herein:"),
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