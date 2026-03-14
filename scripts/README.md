# Scripts

Utility scripts for The Ubudian.

## Cron Jobs

### Ingestion Health Check (Vercel)

Configured in `vercel.json`. Runs daily at 9:00 AM UTC via Vercel Cron.

- **Endpoint:** `/api/cron/ingestion-health`
- **Schedule:** `0 9 * * *`

### Event Ingestion (DigitalOcean Droplet)

Runs every 3 hours from the DigitalOcean droplet via `cron-ingest.sh`.

**Setup:**

1. Copy `cron-ingest.sh` to the droplet (e.g. `/opt/ubudian/cron-ingest.sh`)
2. Set environment variables in `/etc/environment` or a sourced env file:
   ```bash
   export UBUDIAN_URL="https://theubudian.com"
   export CRON_SECRET="your-cron-secret-here"
   ```
3. Add the crontab entry:
   ```bash
   crontab -e
   # Add:
   0 */3 * * * /opt/ubudian/cron-ingest.sh >> /var/log/ubudian-ingest.log 2>&1
   ```
4. Create the log file:
   ```bash
   sudo touch /var/log/ubudian-ingest.log
   sudo chown $USER /var/log/ubudian-ingest.log
   ```

**Endpoint:** `/api/cron/ingest-events`
**Schedule:** `0 */3 * * *` (every 3 hours)

## Utility Scripts

| Script | Description |
|--------|-------------|
| `telegram-setup.ts` | Configure Telegram bot settings for event ingestion |
| `telegram-webhook.ts` | Set up Telegram webhook URL |
| `telegram-poll.ts` | Poll Telegram for messages (alternative to webhook) |
| `seed-blog-posts.ts` | Seed initial blog post data |
| `apply-schema.ts` | Apply the main database schema |
| `apply-ingestion-schema.ts` | Apply ingestion-related schema additions |
