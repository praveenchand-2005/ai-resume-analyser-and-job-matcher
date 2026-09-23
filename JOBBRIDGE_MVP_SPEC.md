# JobBridge MVP Specification

## Product
Job discovery and recruitment platform.

## Phase 1
- Responsive job search UI
- Filters: keyword, location, remote, experience, date
- Job detail pages
- Original employer application links
- Transparent referral/click tracking
- Source attribution
- Freshness and deduplication
- Admin ingestion interface

## Data model
### jobs
id, title, company_id, description, location, remote_type, employment_type, experience_min, experience_max, salary_min, salary_max, currency, skills, source_name, source_url, apply_url, posted_at, expires_at, status, content_hash, created_at, updated_at

### companies
id, name, website, logo_url, description, created_at, updated_at

### application_clicks
id, job_id, clicked_at, referrer, user_agent_hash, source_campaign

## Important rules
Only ingest jobs from permitted/authorized public sources or employer career pages. Preserve the original application destination. Do not bypass anti-bot controls or access restricted data.

## Future phases
- Employer dashboard
- Candidate sourcing
- AI screening
- Real-time voice interviews
- Structured candidate reports
- Employer recruitment workflows
