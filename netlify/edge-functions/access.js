const encoder = new TextEncoder();
const cookieName = '__Host-report-access';
const lifetime = 12 * 60 * 60;
const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Netlify-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};

function equal(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function digest(value) {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function escape(value) {
  return value.replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
}

function destination(value) {
  return value && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/.test(value) && !value.startsWith('/__access/') ? value : '/';
}

function loginPage(next, error = false) {
  return new Response(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>访问验证 · 课堂评价报告</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f5f7fb;color:#18263c;font-family:"PingFang SC",-apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif}.card{width:100%;max-width:420px;background:white;border:1px solid #e8edf5;border-radius:16px;padding:36px;box-shadow:0 12px 40px #18263c08}.icon{width:48px;height:48px;display:grid;place-items:center;border-radius:12px;background:#edf4ff;color:#1d70f2;margin-bottom:24px}h1{font-size:24px;line-height:1.5;margin:0 0 8px;font-weight:600}p{font-size:14px;line-height:24px;color:#6d7a8c;margin:0 0 28px}label{display:block;font-size:14px;color:#536176;margin-bottom:10px}input{width:100%;height:46px;border:1px solid #dce3ed;border-radius:8px;padding:0 14px;font:inherit;outline:none}input:focus{border-color:#1d70f2;box-shadow:0 0 0 3px #1d70f214}button{width:100%;border:0;border-radius:8px;background:#1d70f2;color:white;height:46px;font:inherit;font-size:14px;font-weight:500;margin-top:20px;cursor:pointer}button:hover{background:#1761d8}.error{color:#c63838;font-size:13px;margin:10px 0 0}.hint{text-align:center;color:#8490a0;font-size:12px;margin:22px 0 0}
</style></head><body><main class="card"><div class="icon"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></div><h1>课堂评价报告</h1><p>此报告已开启访问保护，请输入密码继续查看。</p><form method="post" action="/__access/login"><input type="hidden" name="next" value="${escape(next)}"><label for="password">访问密码</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="请输入访问密码" maxlength="256" required autofocus ${error ? 'aria-invalid="true" aria-describedby="error"' : ''}>${error ? '<p class="error" id="error" role="alert">密码不正确，请重新输入。</p>' : ''}<button type="submit">进入报告</button></form><p class="hint">验证通过后，本次访问有效期为 12 小时</p></main></body></html>`, {
    status: error ? 401 : 200,
    headers: {...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"},
  });
}

export default async function access(request, context) {
  const hash = Netlify.env.get('DEMO_PASSWORD_HASH');
  const salt = Netlify.env.get('DEMO_PASSWORD_SALT');
  const secret = Netlify.env.get('DEMO_SESSION_SECRET');
  if (!hash || !salt || !secret) return new Response('访问保护正在配置中，请稍后重试。', {status: 503, headers});
  const url = new URL(request.url);

  if (url.pathname === '/__access/login' && request.method === 'POST') {
    if (request.headers.get('Origin') !== url.origin) return new Response('Forbidden', {status: 403, headers});
    if (Number(request.headers.get('Content-Length') || 0) > 4096) return new Response('Request too large', {status: 413, headers});
    let form;
    try { form = await request.formData(); } catch { return new Response('Bad request', {status: 400, headers}); }
    const next = destination(String(form.get('next') || '/'));
    const password = form.get('password');
    if (typeof password !== 'string' || password.length > 256 || !equal(await digest(salt + ':' + password), hash)) return loginPage(next, true);
    const expires = String(Math.floor(Date.now() / 1000) + lifetime);
    const token = expires + '.' + await sign(expires + ':' + hash, secret);
    return new Response(null, {status: 303, headers: {...headers, Location: next, 'Set-Cookie': `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${lifetime}`}});
  }

  const cookie = (request.headers.get('Cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
  const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(cookie);
  const now = Math.floor(Date.now() / 1000);
  if (match && Number(match[1]) > now && Number(match[1]) <= now + lifetime && equal(match[2], await sign(match[1] + ':' + hash, secret))) {
    const response = await context.next();
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    return response;
  }

  if ((request.method === 'GET' || request.method === 'HEAD') && request.headers.get('Accept')?.includes('text/html')) return loginPage(destination(url.pathname + url.search));
  return new Response('请输入访问密码后查看报告。', {status: 401, headers});
}
