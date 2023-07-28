import fetch from "node-fetch";
import cron from "node-cron";
import NodeCache from "node-cache";

const cfDnsRecordCache = new NodeCache({ stdTTL: 60 * 60, maxKeys: 1 });

cron.schedule(process.env.CRON_EXPRESSION, async () => {
  logger.info(`running a task ${new Date().toISOString()}`);
  await main()
    .then((result) => logger.info(result))
    .catch((err) => logger.error(err.message));
});

async function main() {
  const cfAccount = {
    zone: process.env.ZONE_ID,
    token: process.env.API_TOKEN,
    record: process.env.RECORD_ID,
  };
  const [currentIp, dnsRecordIp] = await Promise.all([
    resolveCurrentIp(),
    getCfDnsRecordIp(cfAccount),
  ]);
  if (currentIp === dnsRecordIp) {
    return Promise.resolve(
      `Record IP did not need updating, current IP is already correct ${currentIp}`,
    );
  } else {
    return updateCloudflareDnsRecord(cfAccount, currentIp);
  }
}

async function resolveCurrentIp() {
  const currentIpResponse = await fetch("https://api.ipify.org?format=json");
  if (!currentIpResponse.ok) {
    throw new Error("Failed to fetch the current IP (API may be down).");
  }
  return currentIpResponse.json().then((data) => data.ip);
}

async function getCfDnsRecordIp(cfAccount) {
  const cachedDnsRecord = cfDnsRecordCache.get("cfDnsRecordIp");
  if (cachedDnsRecord) {
    return Promise.resolve(cachedDnsRecord);
  }
  return resolveCfDnsRecordIp(cfAccount).then((resolvedDnsRecord) => {
    cfDnsRecordCache.del("cfDnsRecordIp");
    cfDnsRecordCache.set("cfDnsRecordIp", resolvedDnsRecord);
    return resolvedDnsRecord;
  });
}

async function resolveCfDnsRecordIp(cfAccount) {
  if (!cfAccount.zone || !cfAccount.token || !cfAccount.record) {
    throw new Error("Missing required environment variables.");
  }
  const cloudflareApi = `https://api.cloudflare.com/client/v4/zones/${cfAccount.zone}/dns_records/${cfAccount.record}`;
  const headers = {
    Authorization: `Bearer ${cfAccount.token}`,
    "Content-Type": "application/json",
  };
  return fetch(cloudflareApi, { headers }).then(async (aRecordResponse) => {
    if (!aRecordResponse.ok) {
      throw new Error("Failed to fetch the A record data.");
    }
    return aRecordResponse.json().then((data) => data.result.content);
  });
}

async function updateCloudflareDnsRecord(cfAccount, currentIp) {
  const cloudflareApi = `https://api.cloudflare.com/client/v4/zones/${cfAccount.zone}/dns_records/${cfAccount.record}`;
  const payload = { content: currentIp };
  const headers = {
    Authorization: `Bearer ${cfAccount.token}`,
    "Content-Type": "application/json",
  };
  return fetch(cloudflareApi, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  }).then((r) => `A record IP updated -> ${currentIp}`);
}

const logger = {
  info: (message) =>
    console.log(`[INFO] ${new Date().toISOString()} ~ ${message}`),
  error: (message) =>
    console.error(`[ERROR] ${new Date().toISOString()} ~ ${message}`),
};
