-- Phase 8 gaps: admin notification on new reports

drop trigger if exists on_report_created_notify on public.reports;
create trigger on_report_created_notify
after insert on public.reports
for each row
execute function public.trigger_notification_dispatch('report');
