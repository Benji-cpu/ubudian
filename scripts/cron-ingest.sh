#!/usr/bin/env bash
set -euo pipefail

# Cron script: Trigger event ingestion via the Ubudian API
#
# Crontab entry (every 3 hours):
#   0 */3 * * * /path/to/cron-ingest.sh >> /var/log/ubudian-ingest.log 2>&1
#
# Required environment variables:
#   UBUDIAN_URL  — Base URL of the Ubudian app (e.g. https://theubudian.com)
#   CRON_SECRET  — Bearer token matching the app's CRON_SECRET env var

if [[ -z "${UBUDIAN_URL:-}" ]]; then
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: UBUDIAN_URL is not set"
  exit 1
fi

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: CRON_SECRET is not set"
  exit 1
fi

ENDPOINT="${UBUDIAN_URL}/api/cron/ingest-events"

echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Starting ingestion request to ${ENDPOINT}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${ENDPOINT}")

HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -1)

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] SUCCESS (HTTP ${HTTP_STATUS}): ${HTTP_BODY}"
else
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] FAILED (HTTP ${HTTP_STATUS}): ${HTTP_BODY}"
  exit 1
fi
