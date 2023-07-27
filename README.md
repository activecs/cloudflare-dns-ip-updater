# cloudflare-dns-ip-updater
Script for servers with dynamic IPs that automatically updates Cloudflare DNS records whenever it changes.

Sample docker-compose
```yaml
version: '3'
services:
  cloudflare-dns-ip-updater:
    image: deduard/tools:cloudflare-dns-ip-updater-20230727
    container_name: cloudflare-dns-ip-updater
    environment:
      - ZONE_ID=REPLACE_ME
      - API_TOKEN=REPLACE_ME
      - RECORD_ID=REPLACE_ME
      - CRON_EXPRESSION=*/5 * * * * // every 5 minutes
    restart: unless-stopped
```