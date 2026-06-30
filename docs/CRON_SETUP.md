# Cron job setup

Nexio uses two HTTP-triggered edge functions that require `CRON_SECRET` (already documented in [SUPABASE_SECRETS.md](./SUPABASE_SECRETS.md)).

| Function | Suggested schedule | Endpoint |
|----------|-------------------|----------|
| `evaluate-seller-levels` | Daily at 03:00 UTC | `POST /functions/v1/evaluate-seller-levels` |
| `expire-stories` | Hourly | `POST /functions/v1/expire-stories` |

Both expect:

```http
Authorization: Bearer <CRON_SECRET>
```

## Option A — External scheduler (recommended for hosted Supabase)

Use any cron service (GitHub Actions, cron-job.org, Vercel Cron, etc.).

Example GitHub Actions workflow (`.github/workflows/supabase-cron.yml`):

```yaml
name: Supabase cron
on:
  schedule:
    - cron: "0 * * * *"      # hourly — expire-stories
    - cron: "0 3 * * *"      # daily 03:00 UTC — evaluate-seller-levels
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Expire stories (hourly)
        if: github.event.schedule == '0 * * * *'
        run: |
          curl -sf -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://thqhypzcisewftszeuat.supabase.co/functions/v1/expire-stories"
      - name: Evaluate seller levels (daily)
        if: github.event.schedule == '0 3 * * *'
        run: |
          curl -sf -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://thqhypzcisewftszeuat.supabase.co/functions/v1/evaluate-seller-levels"
```

Store `CRON_SECRET` as a GitHub repository secret (same value as in Supabase).

## Option B — pg_cron + pg_net (if enabled on your project)

Run in SQL Editor (replace placeholders):

```sql
-- Requires extensions: pg_cron, pg_net
select cron.schedule(
  'expire-stories-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/expire-stories',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'evaluate-seller-levels-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/evaluate-seller-levels',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Set the secret once (superuser / dashboard):

```sql
alter database postgres set app.cron_secret = 'your-cron-secret-value';
```

## Verify

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://thqhypzcisewftszeuat.supabase.co/functions/v1/expire-stories
```

Expect HTTP 200 with a JSON body summarizing work done.
