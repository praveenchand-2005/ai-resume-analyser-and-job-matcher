create index if not exists jobbridge_apply_clicks_job_clicked_idx on public.jobbridge_apply_clicks(job_id, clicked_at desc);
create index if not exists jobbridge_ingestion_runs_source_started_idx on public.jobbridge_ingestion_runs(source_id, started_at desc);
drop policy if exists "Service role manages JobBridge sources" on public.jobbridge_sources;
create policy "Service role manages JobBridge sources" on public.jobbridge_sources for all to service_role using (true) with check (true);
drop policy if exists "Service role manages JobBridge ingestion runs" on public.jobbridge_ingestion_runs;
create policy "Service role manages JobBridge ingestion runs" on public.jobbridge_ingestion_runs for all to service_role using (true) with check (true);
drop policy if exists "Service role manages JobBridge video queue" on public.jobbridge_video_queue;
create policy "Service role manages JobBridge video queue" on public.jobbridge_video_queue for all to service_role using (true) with check (true);