export type JobForContent = {
  title: string; slug: string; location: string | null; work_mode: string | null;
  employment_type: string | null; experience: string | null; salary_text: string | null;
  skills: string[] | null; source_name: string | null; source_url: string; apply_url: string;
  expires_at: string | null;
  jobbridge_companies?: { name: string } | { name: string }[] | null;
};
function companyName(job: JobForContent) {
  const value = job.jobbridge_companies;
  return Array.isArray(value) ? value[0]?.name ?? "the employer" : value?.name ?? "the employer";
}
export function buildJobGuide(job: JobForContent) {
  const company = companyName(job);
  const skills = job.skills?.length ? job.skills.join(", ") : "The source does not specify a structured skills list.";
  const deadline = job.expires_at ? new Date(job.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "No deadline was supplied in the structured listing.";
  const title = `${job.title} at ${company}: role overview and application checklist`;
  const excerpt = `A source-linked guide to the ${job.title} opportunity at ${company}, including the employer-published details and how to verify the application.`;
  const body = [
    `# ${title}`,
    `JobBridge India has prepared this independent guide from the vacancy details supplied for ${company}. It helps applicants review the opportunity before visiting the employer's original recruitment page.`,
    "## Opportunity details",
    `- Employer: ${company}`, `- Location: ${job.location ?? "Not stated by the source"}`,
    `- Work arrangement: ${job.work_mode ?? "Not stated by the source"}`,
    `- Employment type: ${job.employment_type ?? "Not stated by the source"}`,
    `- Experience: ${job.experience ?? "Not stated by the source"}`,
    `- Compensation: ${job.salary_text ?? "Not disclosed in the structured listing"}`,
    `- Application deadline: ${deadline}`,
    "## Skills and preparation",
    `The structured vacancy information lists these skills: ${skills} Review the complete employer notice for mandatory qualifications, preferred experience, documents and assessment stages. An omitted field does not mean that the employer has no such requirement.`,
    "## Application checklist",
    "1. Open the original source and confirm the vacancy is still accepting applications.",
    "2. Read the complete job description and verify education, experience, location and work-mode requirements.",
    "3. Prepare an up-to-date resume and any documents explicitly requested by the employer.",
    "4. Apply only through the employer's official application destination.",
    "5. Save the application acknowledgement and track follow-up through the employer's own portal.",
    "## Source and verification",
    `Source: ${job.source_name ?? company}. Check the original vacancy for the latest status: ${job.source_url}`,
    `Apply through the original destination: ${job.apply_url}`,
    "JobBridge India is an independent discovery service, not the employer or a government recruitment authority. We do not guarantee interviews or employment and do not charge candidates to open application links."
  ].join("\n\n");
  return { title, excerpt, body_markdown: body, seo_title: title, seo_description: excerpt };
}
export function buildShortVideo(job: JobForContent, platform: "youtube_shorts" | "instagram_reels") {
  const company = companyName(job);
  const location = job.location ?? "India";
  const deadline = job.expires_at ? new Date(job.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "check the employer site";
  const skillLine = job.skills?.length ? `Key skills: ${job.skills.slice(0, 4).join(", ")}.` : "Check the employer notice for required skills.";
  const script = [`New job alert: ${job.title} at ${company}, ${location}.`, `Experience: ${job.experience ?? "not specified in the listing"}. Work mode: ${job.work_mode ?? "check the source"}.`, skillLine, `Application deadline: ${deadline}. Confirm eligibility and vacancy status on the official source.`, "Open JobBridge India, read the full guide, and apply only through the employer's official website."].join(" ");
  return {
    platform, title: `${job.title} at ${company} | Job Alert`,
    script,
    caption: `${job.title} — ${company} | ${location}. Verify eligibility and the current deadline at the original source before applying. Full guide: /blog/${job.slug}`,
    hashtags: ["#JobsInIndia", "#JobAlert", "#Careers", "#Hiring", "#JobBridgeIndia"],
    storyboard: [
      { time: "0-4s", visual: "Bold job-alert title and employer name", overlay: job.title },
      { time: "4-10s", visual: "Location and work arrangement", overlay: location },
      { time: "10-18s", visual: "Experience and key skills", overlay: job.experience ?? "Check eligibility" },
      { time: "18-24s", visual: "Deadline reminder", overlay: `Apply by ${deadline}` },
      { time: "24-30s", visual: "Official-source call to action", overlay: "Read the guide · Apply at source" }
    ]
  };
}
