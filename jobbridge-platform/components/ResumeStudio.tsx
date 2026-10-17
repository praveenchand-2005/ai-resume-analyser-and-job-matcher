"use client";

import { useMemo, useRef, useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

type ResumeDraft = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
};

const emptyResume: ResumeDraft = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: "",
  experience: "",
  education: "",
  projects: "",
};

const stopWords = new Set([
  "about", "above", "after", "again", "against", "also", "among", "and", "are", "around",
  "been", "being", "below", "between", "both", "but", "can", "could", "data", "each",
  "for", "from", "have", "into", "its", "more", "most", "must", "not", "our", "over",
  "role", "should", "such", "than", "that", "the", "their", "then", "there", "these",
  "they", "this", "those", "through", "under", "use", "using", "very", "was", "were",
  "what", "when", "where", "which", "while", "with", "within", "will", "you", "your",
  "work", "years", "year", "required", "preferred", "responsibilities", "experience",
]);

function cleanLines(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseResumeText(text: string): ResumeDraft {
  const lines = cleanLines(text);
  const joined = lines.join("\n");
  const email = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = joined.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0]?.trim() ?? "";
  const sectionAliases: Record<string, keyof ResumeDraft> = {
    summary: "summary",
    objective: "summary",
    profile: "summary",
    "professional summary": "summary",
    skills: "skills",
    "technical skills": "skills",
    "core skills": "skills",
    experience: "experience",
    employment: "experience",
    "work experience": "experience",
    "professional experience": "experience",
    education: "education",
    academic: "education",
    projects: "projects",
    "personal projects": "projects",
    "academic projects": "projects",
  };
  const buckets: Record<string, string[]> = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };
  let active: string | null = null;
  const headingPattern = /^(professional summary|summary|objective|profile|technical skills|core skills|skills|work experience|professional experience|experience|employment|education|academic|personal projects|academic projects|projects|certifications|certificates|achievements|languages|interests)$/i;

  for (const line of lines) {
    const normalized = line.replace(/[:\s]+$/, "").toLowerCase();
    if (headingPattern.test(normalized)) {
      active = sectionAliases[normalized] ?? null;
      continue;
    }
    if (active && buckets[active]) buckets[active].push(line);
  }

  const firstLikelyName = lines.find((line) =>
    line.length <= 64 &&
    !line.includes("@") &&
    !/\d{5,}/.test(line) &&
    !headingPattern.test(line.replace(/[:\s]+$/, "")) &&
    !/^(resume|curriculum vitae|cv)$/i.test(line)
  ) ?? "";

  const sectionText = (key: string) => (buckets[key] ?? []).join("\n").trim();
  const fallbackSummary = lines
    .filter((line) => line !== firstLikelyName && line !== email && line !== phone)
    .slice(0, 3)
    .join(" ");

  return {
    ...emptyResume,
    fullName: firstLikelyName,
    email,
    phone,
    summary: sectionText("summary") || fallbackSummary,
    skills: sectionText("skills"),
    experience: sectionText("experience"),
    education: sectionText("education"),
    projects: sectionText("projects"),
  };
}

function tokens(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word)),
    ),
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function addTextParagraphs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => new Paragraph({ text: line, spacing: { after: 90 } }));
}

export default function ResumeStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<ResumeDraft>(emptyResume);
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<"start" | "edit">("start");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "match">("resume");

  const resumeText = useMemo(
    () =>
      [
        resume.fullName,
        resume.headline,
        resume.email,
        resume.phone,
        resume.location,
        resume.summary,
        resume.skills,
        resume.experience,
        resume.education,
        resume.projects,
      ].join("\n"),
    [resume],
  );

  const match = useMemo(() => {
    const requirements = tokens(jobDescription).slice(0, 80);
    const source = new Set(tokens(resumeText));
    const matched = requirements.filter((word) => source.has(word));
    const missing = requirements.filter((word) => !source.has(word));
    return {
      total: requirements.length,
      matched,
      missing,
      score: requirements.length ? Math.round((matched.length / requirements.length) * 100) : 0,
    };
  }, [jobDescription, resumeText]);

  function update(field: keyof ResumeDraft, value: string) {
    setResume((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  function startBlank() {
    setResume(emptyResume);
    setFileName("");
    setError("");
    setNotice("");
    setStage("edit");
    setActiveTab("resume");
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    const extension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx", "txt"].includes(extension ?? "")) {
      setError("Choose a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("This file is larger than 10 MB. Please choose a smaller file.");
      return;
    }

    setBusy(true);
    try {
      let extracted = "";
      if (extension === "txt") {
        extracted = await file.text();
      } else if (extension === "pdf") {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(
            content.items
              .map((item: { str?: string }) => item.str ?? "")
              .filter(Boolean)
              .join(" "),
          );
        }
        extracted = pages.join("\n");
      } else {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        extracted = result.value;
      }

      if (!extracted.trim()) {
        throw new Error("No selectable text was found. This may be a scanned image PDF. OCR support is not available in this first version.");
      }
      setResume(parseResumeText(extracted));
      setFileName(file.name);
      setStage("edit");
      setActiveTab("resume");
      setNotice("Text extracted. Please review every field; formatting and section detection can be imperfect.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't read this file. Try another PDF, DOCX, or TXT file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function exportDocx() {
    setError("");
    try {
      const children: Paragraph[] = [];
      if (resume.fullName.trim()) {
        children.push(new Paragraph({ text: resume.fullName.trim(), heading: HeadingLevel.TITLE, spacing: { after: 100 } }));
      }
      if (resume.headline.trim()) children.push(new Paragraph({ text: resume.headline.trim(), spacing: { after: 120 } }));
      const contact = [resume.email, resume.phone, resume.location].filter(Boolean).join("  |  ");
      if (contact) children.push(new Paragraph({ text: contact, spacing: { after: 240 } }));

      const sections: Array<[string, string]> = [
        ["Professional Summary", resume.summary],
        ["Skills", resume.skills],
        ["Experience", resume.experience],
        ["Education", resume.education],
        ["Projects", resume.projects],
      ];
      for (const [title, value] of sections) {
        if (!value.trim()) continue;
        children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, spacing: { before: 180, after: 100 } }));
        children.push(...addTextParagraphs(value));
      }
      const doc = new Document({
        sections: [{ properties: {}, children: children.length ? children : [new Paragraph("Add your resume content in Resume Studio.")] }],
      });
      const blob = await Packer.toBlob(doc);
      const safeName = (resume.fullName || "resume").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "resume";
      saveBlob(blob, `${safeName}-resume.docx`);
      setNotice("Your editable DOCX resume has been generated.");
    } catch {
      setError("DOCX export failed. Please try again.");
    }
  }

  function exportPdf() {
    setError("");
    setNotice("In the print dialog, choose “Save as PDF” to export your resume.");
    window.print();
  }

  const field = (label: string, key: keyof ResumeDraft, placeholder: string, rows = 3) => (
    <label className="rs-field">
      <span>{label}</span>
      <textarea
        value={resume[key]}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );

  return (
    <main className="rs-shell">
      <header className="rs-header">
        <a className="rs-brand" href="/" aria-label="SelectReady home">
          <span className="rs-brand-mark">S</span>
          <span>SelectReady<span className="rs-brand-light"> / Studio</span></span>
        </a>
        <nav className="rs-nav" aria-label="Main navigation">
          <a className="rs-nav-active" href="/resume-studio">Resume Studio</a>
          <a href="/jobs">Explore jobs <span aria-hidden="true">↗</span></a>
        </nav>
        <div className="rs-header-note"><span className="rs-status-dot" /> Your career, thoughtfully prepared</div>
      </header>

      <section className="rs-hero">
        <div className="rs-eyebrow"><span>CAREER ESSENTIALS</span><i /> PRODUCT 01</div>
        <div className="rs-hero-grid">
          <div className="rs-hero-copy">
            <h1>A resume that<br /><em>opens the next door.</em></h1>
            <p>Build a clear, credible resume from the experience you actually have. Refine every detail, understand the gaps, and leave with a document you are proud to send.</p>
            <div className="rs-hero-actions">
              <button className="rs-button rs-button-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
                {busy ? "Reading your document…" : "Improve my resume"} <span aria-hidden="true">↗</span>
              </button>
              <button className="rs-button rs-button-quiet" onClick={startBlank}>Start from scratch <span aria-hidden="true">→</span></button>
            </div>
            <div className="rs-trust-line"><span>PDF · DOCX · TXT</span><span>Private by design</span><span>No invented achievements</span></div>
          </div>
          <div className="rs-hero-art" aria-label="Resume document preview illustration">
            <div className="rs-art-back" />
            <div className="rs-paper">
              <div className="rs-paper-top"><span>SR / CAREER DOCUMENT</span><span>01 — 01</span></div>
              <div className="rs-paper-name">Your Name<span>.</span></div>
              <div className="rs-paper-role">ROLE · SPECIALTY · DIRECTION</div>
              <div className="rs-paper-rule" />
              <div className="rs-paper-label">PROFILE</div>
              <div className="rs-paper-lines"><i /><i /><i className="short" /></div>
              <div className="rs-paper-label">EXPERIENCE</div>
              <div className="rs-paper-experience"><b /><div><i /><i className="medium" /><i className="short" /></div></div>
              <div className="rs-paper-experience"><b /><div><i /><i className="medium" /><i className="short" /></div></div>
              <div className="rs-paper-label">SELECTED SKILLS</div>
              <div className="rs-paper-tags"><i /><i /><i /><i /></div>
              <div className="rs-paper-footer"><span>CLARITY OVER CLAIMS</span><span>SELECTREADY</span></div>
            </div>
            <div className="rs-art-stamp"><span>YOUR STORY,</span><strong>WELL TOLD.</strong><i>✳</i></div>
          </div>
        </div>
      </section>

      <section className="rs-workspace" id="workspace">
        <div className="rs-section-heading">
          <div><div className="rs-eyebrow"><span>THE WORKSPACE</span></div><h2>Start with what you have.</h2></div>
          <p>Thoughtful tools. Clear feedback.<br />Your experience stays yours.</p>
        </div>

        {stage === "start" ? (
          <div className="rs-start-grid">
            <button className="rs-upload-card" onClick={() => inputRef.current?.click()} disabled={busy}>
              <span className="rs-card-icon">↑</span>
              <span className="rs-card-kicker">OPTION 01</span>
              <strong>{busy ? "Reading your document…" : "Bring your current resume"}</strong>
              <span className="rs-card-description">We’ll extract the text so you can review and improve it. Your original file is not changed.</span>
              <span className="rs-card-link">{busy ? "Please wait…" : "Choose a file"} <b>↗</b></span>
            </button>
            <button className="rs-blank-card" onClick={startBlank}>
              <span className="rs-card-icon">＋</span>
              <span className="rs-card-kicker">OPTION 02</span>
              <strong>Create a resume from zero</strong>
              <span className="rs-card-description">A guided, structured editor for first-time applicants and experienced professionals alike.</span>
              <span className="rs-card-link">Start writing <b>→</b></span>
            </button>
          </div>
        ) : (
          <div className="rs-editor-layout">
            <aside className="rs-editor-sidebar">
              <div className="rs-sidebar-top"><span className="rs-sidebar-kicker">YOUR DOCUMENT</span><span className="rs-live-dot">EDITING</span></div>
              <h3>{resume.fullName || "Untitled resume"}</h3>
              <p>{fileName || "New resume"} · Changes stay in this session</p>
              <button className={activeTab === "resume" ? "rs-side-tab active" : "rs-side-tab"} onClick={() => setActiveTab("resume")}><span>01</span> Resume details</button>
              <button className={activeTab === "match" ? "rs-side-tab active" : "rs-side-tab"} onClick={() => setActiveTab("match")}><span>02</span> Job alignment</button>
              <div className="rs-sidebar-note"><b>Before you export</b><p>Review extracted text, dates, names, and every suggested change. Only include details that are true for you.</p></div>
              <button className="rs-text-button" onClick={() => { setStage("start"); setNotice(""); setError(""); }}>← Back to start</button>
            </aside>
            <div className="rs-editor-main">
              {activeTab === "resume" ? (
                <>
                  <div className="rs-editor-title"><div><span className="rs-card-kicker">YOUR STORY</span><h3>Resume details</h3><p>Write clearly. Keep every claim grounded in your experience.</p></div><span className="rs-step-chip">STEP 01 / 02</span></div>
                  {fileName && <div className="rs-file-note"><span>↗</span><div><b>{fileName}</b><small>Text extracted for review. Original file remains unchanged.</small></div></div>}
                  <div className="rs-form-grid">
                    <label className="rs-field"><span>Full name</span><input value={resume.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Your name" /></label>
                    <label className="rs-field"><span>Target role / headline</span><input value={resume.headline} onChange={(e) => update("headline", e.target.value)} placeholder="e.g. Junior Data Engineer" /></label>
                    <label className="rs-field"><span>Email</span><input value={resume.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></label>
                    <label className="rs-field"><span>Phone</span><input value={resume.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone number" /></label>
                    <label className="rs-field rs-field-wide"><span>Location / links</span><input value={resume.location} onChange={(e) => update("location", e.target.value)} placeholder="City · LinkedIn · Portfolio" /></label>
                  </div>
                  {field("Professional summary", "summary", "A short, truthful introduction to your strengths, focus, and experience.", 4)}
                  {field("Skills", "skills", "List the skills you can explain and demonstrate.")}
                  {field("Experience", "experience", "Role, organization, dates, responsibilities, and verified impact.", 5)}
                  {field("Education", "education", "Degree, institution, dates, relevant coursework or achievements.", 3)}
                  {field("Projects", "projects", "Project context, your contribution, tools used, and evidence.", 4)}
                  <div className="rs-editor-actions"><button className="rs-button rs-button-primary" onClick={() => setActiveTab("match")}>Review job alignment <span>→</span></button><button className="rs-button rs-button-outline" onClick={exportDocx}>Export DOCX ↓</button><button className="rs-button rs-button-outline" onClick={exportPdf}>Save as PDF ↗</button></div>
                </>
              ) : (
                <>
                  <div className="rs-editor-title"><div><span className="rs-card-kicker">ROLE FIT</span><h3>Job alignment</h3><p>A transparent keyword snapshot—not an official ATS score or a hiring prediction.</p></div><span className="rs-step-chip">STEP 02 / 02</span></div>
                  <label className="rs-field"><span>Paste the job description</span><textarea rows={9} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the role requirements and responsibilities here…" /></label>
                  {jobDescription.trim() ? (
                    <div className="rs-match-panel">
                      <div className="rs-match-score"><span>Keyword overlap</span><strong>{match.score}<small>%</small></strong><p>{match.matched.length} of {match.total} distinct terms appear in your current resume.</p></div>
                      <div className="rs-match-lists">
                        <div><h4><i className="rs-match-present" /> Present in resume <span>{match.matched.length}</span></h4><div className="rs-keywords">{match.matched.length ? match.matched.map((word) => <span key={word}>{word}</span>) : <small>No clear keyword matches yet.</small>}</div></div>
                        <div><h4><i className="rs-match-missing" /> Review these terms <span>{match.missing.length}</span></h4><div className="rs-keywords">{match.missing.slice(0, 24).length ? match.missing.slice(0, 24).map((word) => <span key={word}>{word}</span>) : <small>No unmatched terms in this quick check.</small>}</div></div>
                      </div>
                      <p className="rs-disclaimer">This is a simple text overlap check. It does not understand skill depth, certify your experience, or predict ATS outcomes. Add a missing term only when it accurately describes your experience.</p>
                    </div>
                  ) : (
                    <div className="rs-empty-match"><span>✳</span><b>Your role-specific review starts here.</b><p>Paste a job description to see which distinct terms appear in your resume and which deserve a closer look.</p></div>
                  )}
                  <div className="rs-editor-actions"><button className="rs-button rs-button-outline" onClick={() => setActiveTab("resume")}>← Back to resume</button><button className="rs-button rs-button-primary" onClick={exportDocx}>Export DOCX ↓</button><button className="rs-button rs-button-outline" onClick={exportPdf}>Save as PDF ↗</button></div>
                </>
              )}
            </div>
            <aside className="rs-preview-column">
              <div className="rs-preview-head"><span>LIVE PREVIEW</span><span>↗</span></div>
              <article className="rs-preview-paper">
                <div className="rs-preview-name">{resume.fullName || "Your Name"}</div>
                {resume.headline && <div className="rs-preview-headline">{resume.headline}</div>}
                <div className="rs-preview-contact">{[resume.email, resume.phone, resume.location].filter(Boolean).join(" · ") || "Email · Phone · Location"}</div>
                {([
                  ["SUMMARY", resume.summary],
                  ["SKILLS", resume.skills],
                  ["EXPERIENCE", resume.experience],
                  ["EDUCATION", resume.education],
                  ["PROJECTS", resume.projects],
                ] as Array<[string, string]>).map(([title, value]) => (
                  <section className="rs-preview-section" key={title}>
                    <h4>{title}</h4>
                    {value ? <p>{value}</p> : <p className="rs-preview-placeholder">Add your {title.toLowerCase()} details</p>}
                  </section>
                ))}
              </article>
              <p className="rs-preview-caption">Preview is for content review. Exported layout may differ slightly; always review the downloaded document.</p>
            </aside>
          </div>
        )}

        <input
          ref={inputRef}
          className="rs-visually-hidden"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        {error && <div className="rs-alert rs-alert-error" role="alert">{error}</div>}
        {notice && <div className="rs-alert rs-alert-notice" role="status">{notice}</div>}
      </section>

      <footer className="rs-footer"><a className="rs-brand" href="/"><span className="rs-brand-mark">S</span><span>SelectReady</span></a><p>Clarity over claims. Always.</p><span>PRODUCT 01 / RESUME STUDIO</span></footer>
    </main>
  );
}
