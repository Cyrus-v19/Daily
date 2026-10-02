module.exports = async (req, res) => {
  const U = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const T = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const K = process.env.SYNC_KEY;
  if (!U || !T || !K) return res.status(500).json({ error: 'Server not configured' });
  if (req.headers['x-sync-key'] !== K) return res.status(401).json({ error: 'Wrong passphrase' });
  const call = async cmd => {
    const r = await fetch(U, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + T, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd)
    });
    return r.json();
  };
  try {
    if (req.method === 'GET') {
      const r = await call(['GET', 'daily:data']);
      return res.status(200).json({ data: r.result ? JSON.parse(r.result) : null });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await call(['SET', 'daily:data', JSON.stringify(body.data)]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Sync failed' });
  }
};
