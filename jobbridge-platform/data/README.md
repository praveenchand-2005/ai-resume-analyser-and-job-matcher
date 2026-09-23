# JobBridge ingestion

The production ingestion layer should accept jobs only from permitted public sources, employer career pages, feeds, or authorized APIs.

Required normalization:
- title
- company
- location
- work mode
- experience
- skills
- source URL
- original apply URL
- posted/expiry timestamps

Deduplicate by canonical source URL and content hash before inserting into jobbridge_jobs.
Never bypass robots.txt, authentication, paywalls, rate limits, or source terms.
