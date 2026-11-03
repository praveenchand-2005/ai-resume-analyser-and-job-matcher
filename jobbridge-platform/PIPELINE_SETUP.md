# JobBridge India — publishing pipeline

## Workflow

1. Discover vacancies from employer career pages, government notices, permitted feeds or authorized ATS APIs.
2. Normalize each vacancy to the JSON contract accepted by `POST /api/admin/jobs/ingest`.
3. The endpoint validates required fields and HTTPS URLs, upserts the company and vacancy as `draft` + `pending`, and records the batch in `jobbridge_ingestion_runs`.
4. An editor opens the source and application URLs, checks that the vacancy is still open, and verifies eligibility and deadline before calling `POST /api/admin/jobs/publish` with the job UUID.
5. Publishing marks the vacancy verified/active, creates an original source-attributed guide, and queues YouTube Shorts and Instagram Reels scripts/storyboards.
6. A human reviews each script, renders it with an approved provider, checks captions and links, then publishes through authorized YouTube/Instagram accounts. A queued script is not a rendered or published video.

## Required server-only environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (preferred) or `SUPABASE_SERVICE_ROLE_KEY`
- `JOBBRIDGE_INGEST_SECRET` (long random bearer token)

Never expose either secret to browser code or prefix it with `NEXT_PUBLIC_`. Keep the existing publishable key for public read-only pages.

## Ingestion payload

```json
{
  "jobs": [{
    "title": "Example role",
    "company_name": "Example employer",
    "company_website": "https://employer.example",
    "location": "Bengaluru, India",
    "work_mode": "onsite",
    "employment_type": "Full time",
    "experience": "As stated in the official vacancy",
    "salary_text": null,
    "skills": ["SQL", "Python"],
    "description": "A concise editorial summary, not copied job-ad text.",
    "source_name": "Employer careers",
    "source_url": "https://employer.example/careers/job-id",
    "apply_url": "https://employer.example/apply/job-id",
    "posted_at": "2026-11-03T00:00:00Z",
    "expires_at": null,
    "external_id": "job-id"
  }]
}
```

Send with `Authorization: Bearer $JOBBRIDGE_INGEST_SECRET`. Do not ingest a vacancy unless its source and application destination have been checked. Uncertain or expired listings remain unpublished.

## API calls

```bash
curl -X POST "$SITE_URL/api/admin/jobs/ingest" \
  -H "Authorization: Bearer $JOBBRIDGE_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary @jobs.json

curl -X POST "$SITE_URL/api/admin/jobs/publish" \
  -H "Authorization: Bearer $JOBBRIDGE_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"job_id":"<uuid>"}'
```

## Video distribution gate

The pipeline creates a 30-second script, five-scene storyboard, caption and hashtags for each platform. Rendering and publishing still require a connected video provider and authorized social accounts. Never auto-publish an unreviewed vacancy or promise employment.

## Monetization gate

Add ad placements only after the site has substantial original editorial value, privacy/cookie disclosures and provider approval. Keep candidate applications free. Do not put ads inside application redirects or present sponsored listings as verified organic vacancies.
