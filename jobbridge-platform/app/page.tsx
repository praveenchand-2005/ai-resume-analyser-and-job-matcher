import Link from "next/link";

const steps = [
  ["01", "Build", "Create a clear resume from real evidence."],
  ["02", "Align", "Understand role-specific skill gaps."],
  ["03", "Practice", "Answer technical and HR interview questions."],
  ["04", "Improve", "Follow a measurable preparation plan."],
];

const tools = [
  ["Resume Studio", "Build, edit and export a structured resume.", "/resume-studio", "01"],
  ["ATS Review", "Compare your resume with a real job description.", "/ats-review", "02"],
  ["AI Interview", "Practise technical, SQL, Python and HR questions.", "/interview-prep", "03"],
  ["Problem Lab", "Work through role-relevant coding and data problems.", "/problem-lab", "04"],
];

export default function Home() {
  return (
    <main className="sr-home">
      <header className="sr-header">
        <Link href="/" className="sr-brand" aria-label="SelectReady AI home">
          <span className="sr-brand-mark">S</span>
          <span>SELECTREADY <i>AI</i></span>
        </Link>
        <nav className="sr-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#tools">Career tools</a>
          <a href="#plans">Plans</a>
        </nav>
        <div className="sr-header-actions">
          <Link href="/login" className="sr-login">Sign in</Link>
          <Link href="/signup" className="sr-cta sr-cta-small">Get started <span>↗</span></Link>
        </div>
      </header>

      <section className="sr-hero">
        <div className="sr-hero-copy">
          <p className="sr-eyebrow"><span /> CAREER ENGINEERING FOR FRESHERS</p>
          <h1>Don't just apply.<br /><em>Become ready.</em></h1>
          <p className="sr-lede">Build a credible resume, understand the gap between your skills and the job, and practise explaining what you know with structured interview coaching.</p>
          <div className="sr-hero-actions">
            <Link href="/signup" className="sr-cta">Build my career plan <span>→</span></Link>
            <Link href="/resume-studio" className="sr-secondary">Explore Resume Studio</Link>
          </div>
          <div className="sr-trust"><span>No fake experience</span><span>Evidence-first feedback</span><span>Built for freshers</span></div>
        </div>
        <div className="sr-hero-visual" aria-label="Illustration of a candidate resume and career readiness score">
          <div className="sr-orbit sr-orbit-one" />
          <div className="sr-resume-card">
            <div className="sr-resume-top"><span>CAREER PROFILE</span><span>SR / 2026</span></div>
            <div className="sr-resume-avatar">P</div>
            <div className="sr-resume-name">Your next chapter<span>.</span></div>
            <div className="sr-resume-role">ASPIRING PROFESSIONAL · SKILLS IN PROGRESS</div>
            <div className="sr-resume-rule" />
            <div className="sr-resume-label">PROOF OF SKILL</div>
            <div className="sr-line sr-line-long" /><div className="sr-line sr-line-mid" /><div className="sr-line sr-line-short" />
            <div className="sr-resume-label">CAREER READINESS</div>
            <div className="sr-progress"><span /></div>
            <div className="sr-resume-foot"><span>BUILD</span><span>ALIGN</span><span>PRACTISE</span><span>IMPROVE</span></div>
          </div>
          <div className="sr-float-note"><b>01 / YOUR PLAN</b><span>One clear next step at a time.</span></div>
        </div>
      </section>

      <section className="sr-proof-strip" id="how-it-works">
        <div className="sr-section-kicker">THE READINESS PATH</div>
        <div className="sr-steps">
          {steps.map(([number, title, description]) => (
            <article className="sr-step" key={number}>
              <span>{number}</span><h2>{title}</h2><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sr-tools" id="tools">
        <div className="sr-section-head">
          <div><p className="sr-eyebrow"><span /> YOUR CAREER WORKSPACE</p><h2>Everything you need to<br /><em>prepare with purpose.</em></h2></div>
          <p>Practical tools for the work between applying and getting hired. Start free and build from what you can demonstrate.</p>
        </div>
        <div className="sr-tool-grid">
          {tools.map(([title, description, href, number]) => (
            <Link href={href} className="sr-tool-card" key={number}>
              <span className="sr-tool-number">{number}</span><span className="sr-tool-arrow">↗</span>
              <h3>{title}</h3><p>{description}</p><span className="sr-tool-link">Explore tool <b>→</b></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sr-pricing" id="plans">
        <div className="sr-pricing-copy">
          <p className="sr-eyebrow"><span /> SIMPLE, STUDENT-FRIENDLY ACCESS</p>
          <h2>Start free.<br /><em>Go further when ready.</em></h2>
          <p>Use the core career workspace first. Premium coaching is planned for candidates who want more guided practice and deeper feedback.</p>
        </div>
        <div className="sr-plan-card">
          <div className="sr-plan-top"><span>PROPOSED EARLY-ACCESS PLAN</span><span className="sr-plan-tag">PLANNED</span></div>
          <h3>Career Plus</h3>
          <div className="sr-price">₹199 <small>/ month</small></div>
          <p className="sr-plan-desc">A proposed pilot price, subject to validation with students.</p>
          <ul><li>Expanded AI resume reviews</li><li>More mock interview practice</li><li>Personalised preparation plans</li><li>Progress history and insights</li></ul>
          <Link href="/signup" className="sr-cta sr-cta-full">Join the early-access list <span>→</span></Link>
          <p className="sr-payment-note">Payments are not enabled yet. Joining does not charge you.</p>
        </div>
      </section>

      <footer className="sr-footer">
        <Link href="/" className="sr-brand"><span className="sr-brand-mark">S</span><span>SELECTREADY <i>AI</i></span></Link>
        <p>No guaranteed-job claims. Progress built on evidence.</p>
        <span>© 2026 SELECTREADY AI</span>
      </footer>
    </main>
  );
}
