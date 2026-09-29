// POST /api/publish  { data, secret, message? }  -> commits data/store.json to GitHub
// Env (Vercel -> Settings -> Environment Variables):
//   GITHUB_TOKEN  - personal access token (classic) with `repo` scope. NEVER expose to frontend.
//   GITHUB_REPO   - "owner/repo", e.g. "bharattech/btechdevecom"
//   GITHUB_PATH   - repo path of the data file, default "data/store.json"
//                   (if the store lives in a subfolder, e.g. "mainsite/data/store.json")
//   GITHUB_BRANCH - default "main"
//   PUBLISH_SECRET- shared secret typed in Admin -> Backup before publishing
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { data, secret, message } = body;
    if (!process.env.PUBLISH_SECRET || secret !== process.env.PUBLISH_SECRET)
      return res.status(401).json({ error: 'bad secret' });
    if (!data || !data.settings || !data.products)
      return res.status(400).json({ error: 'bad data' });
    const repo = (process.env.GITHUB_REPO || '').trim();
    const path = (process.env.GITHUB_PATH || 'data/store.json').trim();
    const branch = (process.env.GITHUB_BRANCH || 'main').trim();
    const token = (process.env.GITHUB_TOKEN || '').trim();
    if (!repo.includes('/') || !token) return res.status(500).json({ error: 'server not configured (GITHUB_REPO/GITHUB_TOKEN)' });

    const api = 'https://api.github.com/repos/' + repo + '/contents/' + encodeURIComponent(path).replace(/%2F/g, '/');
    const H = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'bharat-store-publish' };

    let sha = null;
    const cur = await fetch(api + '?ref=' + encodeURIComponent(branch), { headers: H });
    if (cur.ok) { const j = await cur.json(); sha = j.sha || null; }
    else if (cur.status !== 404) { const t = await cur.text(); return res.status(502).json({ error: 'github read failed: ' + t.slice(0, 200) }); }

    const content = Buffer.from(JSON.stringify(data, null, 1), 'utf8').toString('base64');
    const put = await fetch(api, {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, H),
      body: JSON.stringify({ message: message || ('store update rev ' + (data.rev || '?')), content, branch, sha: sha || undefined })
    });
    const pj = await put.json().catch(() => ({}));
    if (!put.ok) return res.status(502).json({ error: 'github write failed: ' + JSON.stringify(pj).slice(0, 300) });
    return res.status(200).json({ ok: true, sha: (pj.content && pj.content.sha) || null, rev: data.rev || null });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
