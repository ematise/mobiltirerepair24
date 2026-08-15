import dns from 'node:dns';
import dnsPromises from 'node:dns/promises';

let dnsConfigured = false;

function configureDns(): void {
  if (dnsConfigured) return;
  dnsConfigured = true;

  const configured = process.env.MONGODB_DNS_SERVERS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured?.length) {
    dns.setServers(configured);
    dnsPromises.setServers(configured);
  } else if (process.platform === 'win32') {
    const fallback = ['8.8.8.8', '8.8.4.4'];
    dns.setServers(fallback);
    dnsPromises.setServers(fallback);
  }
}

/** Convert mongodb+srv:// to mongodb:// using explicit DNS (avoids broken SRV on some Windows networks). */
export async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  configureDns();

  const withoutScheme = uri.slice('mongodb+srv://'.length);
  const at = withoutScheme.indexOf('@');
  const creds = at >= 0 ? withoutScheme.slice(0, at + 1) : '';
  const rest = at >= 0 ? withoutScheme.slice(at + 1) : withoutScheme;

  const slash = rest.indexOf('/');
  const hostname = slash >= 0 ? rest.slice(0, slash) : rest.split('?')[0] ?? rest;
  const pathAndQuery = slash >= 0 ? rest.slice(slash) : '';
  const srvName = `_mongodb._tcp.${hostname}`;

  const [records, txtRecords] = await Promise.all([
    dnsPromises.resolveSrv(srvName),
    dnsPromises.resolveTxt(srvName).catch(() => [] as string[][]),
  ]);

  const hosts = records.map((r) => `${r.name}:${r.port}`).join(',');
  const txtOpts = txtRecords.flat().join('&');
  const pathOnly = pathAndQuery.split('?')[0] ?? '';
  const query = pathAndQuery.includes('?') ? pathAndQuery.slice(pathAndQuery.indexOf('?') + 1) : '';
  const options = [txtOpts, query, 'ssl=true'].filter(Boolean).join('&');

  return `mongodb://${creds}${hosts}${pathOnly}?${options}`;
}
