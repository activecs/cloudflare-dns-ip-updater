docker build -t deduard/tools:cloudflare-dns-ip-updater-$(date +%Y%m%d) . --rm
docker push deduard/tools:cloudflare-dns-ip-updater-$(date +%Y%m%d)