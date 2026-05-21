const USER_SERVICE_URL = 'http://localhost:8001';

async function validateUser(userId) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(`${USER_SERVICE_URL}/users/${userId}`, { signal: ctrl.signal });
    if (r.status === 404) return false;
    if (!r.ok) throw new Error(`user service status ${r.status}`);
    return true;
  } catch (e) {
    const code = e.cause?.code || e.code;
    if (e.name === 'AbortError' || code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error('user service unavailable');
      err.code = 'USER_SERVICE_DOWN';
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

module.exports = { validateUser };
