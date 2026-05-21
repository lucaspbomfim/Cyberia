const USER_SERVICE_URL = 'http://localhost:8001';

async function validateUser(userId) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);

  let response;
  try {
    response = await fetch(`${USER_SERVICE_URL}/users/${userId}`, { signal: ctrl.signal });
  } catch (e) {
    const err = new Error('user service unavailable');
    err.code = 'USER_SERVICE_DOWN';
    err.cause = e;
    throw err;
  } finally {
    clearTimeout(t);
  }

  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`user service status ${response.status}`);
  return true;
}

module.exports = { validateUser };
