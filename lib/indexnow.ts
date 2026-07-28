/**
 * IndexNow — real-time URL submission to Bing, Yandex, and AI search crawlers.
 *
 * How it works:
 *   1. We host a key file at https://knowledge.nssapros.com/{key}.txt
 *   2. On publish, we POST the new URL(s) to api.indexnow.org
 *   3. Bing, Yandex, and connected AI engines (Copilot, etc.) index within minutes
 *
 * Key: 33d48f5c512943f490a653201040e499
 * Key file: /public/33d48f5c512943f490a653201040e499.txt
 *
 * Docs: https://www.indexnow.org/documentation
 */

const HOST    = 'https://knowledge.nssapros.com';
const API_URL = 'https://api.indexnow.org/indexnow';

/**
 * Ping IndexNow with one or more newly-published page URLs.
 * Non-fatal — never throws. Logs outcome to console.
 */
export async function pingIndexNow(slugs: { slug: string; category: string }[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn('pingIndexNow: INDEXNOW_KEY not set — skipping');
    return;
  }

  const urls = slugs.map(
    ({ slug, category }) => `${HOST}/${category}/${slug}`
  );

  // Always include the section index pages too — they update on every publish
  const categories = [...new Set(slugs.map(s => s.category))];
  for (const cat of categories) {
    urls.push(`${HOST}/${cat}`);
  }
  urls.push(HOST); // root index

  try {
    const body = {
      host:    'knowledge.nssapros.com',
      key,
      keyLocation: `${HOST}/${key}.txt`,
      urlList: [...new Set(urls)], // dedupe
    };

    const res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body:    JSON.stringify(body),
    });

    if (res.ok || res.status === 202) {
      console.log(`IndexNow: pinged ${body.urlList.length} URL(s) — HTTP ${res.status}`);
    } else {
      const text = await res.text().catch(() => '');
      console.warn(`IndexNow: unexpected status ${res.status} — ${text}`);
    }
  } catch (err) {
    // Never block a publish for this
    console.error('IndexNow ping failed (non-fatal):', err);
  }
}
