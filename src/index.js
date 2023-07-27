import fetch from 'node-fetch';
import cron from 'node-cron';

cron.schedule(process.env.CRON_EXPRESSION, async () => {
    logger.info(`running a task ${new Date().toISOString()}`);
    await main();
});

async function main() {
    try {
        const zone_id = process.env.ZONE_ID;
        const api_token = process.env.API_TOKEN;
        const record_id = process.env.RECORD_ID;
        if (!zone_id || !api_token || !record_id) {
            throw new Error('Missing required environment variables.');
        }
        const dnsRecordIp = await getCloudflareDnsRecordIp(zone_id, api_token, record_id);
        const currentIp = await resolveCurrentIp();
        if (dnsRecordIp === currentIp) {
            logger.info(`Record IP did not need updating, current IP is already correct ${currentIp}`);
        } else {
            await updateCloudflareDnsRecord(zone_id, api_token, record_id, currentIp);
        }
    } catch (err) {
        logger.error(err.message);
    }
}

async function resolveCurrentIp() {
    const ip_request_url = 'https://api.ipify.org?format=json';
    const currentIpResponse = await fetch(ip_request_url);
    if (!currentIpResponse.ok) {
        throw new Error('Failed to fetch the current IP (API may be down).');
    }
    const currentIpData = await currentIpResponse.json();
    return currentIpData.ip;
}

async function getCloudflareDnsRecordIp(zone_id, api_token, record_id) {
    const cloudflareApi = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records/${record_id}`;
    const headers = {
        'Authorization': `Bearer ${api_token}`,
        'Content-Type': 'application/json',
    };
    const aRecordResponse = await fetch(cloudflareApi, { headers });
    if (!aRecordResponse.ok) {
        throw new Error('Failed to fetch the A record data.');
    }
    const aRecordData = await aRecordResponse.json();
    return aRecordData.result.content;
}

async function updateCloudflareDnsRecord(zone_id, api_token, record_id, currentIp) {
    const cloudflareApi = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records/${record_id}`;
    const payload = {content: currentIp};
    const headers = {
        'Authorization': `Bearer ${api_token}`,
        'Content-Type': 'application/json',
    };
    await fetch(cloudflareApi, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
    }).catch(err => {
        logger.error(`Failed to update the A record. ${err.message}`);
    })
    logger.info(`A record IP updated -> ${currentIp}`);
}

const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} ~ ${message}`),
    error: (message) => console.error(`[ERROR] ${new Date().toISOString()} ~ ${message}`),
}
