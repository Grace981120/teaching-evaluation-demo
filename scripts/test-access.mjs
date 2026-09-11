import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../netlify/edge-functions/access.js', import.meta.url), 'utf8');
const { default: access } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const password = 'test-password-only';
const settings = {
  DEMO_PASSWORD_SALT: 'test-salt',
  DEMO_PASSWORD_HASH: createHash('sha256').update('test-salt:' + password).digest('hex'),
  DEMO_SESSION_SECRET: 'test-only-secret-32-bytes-long-123456',
};
globalThis.Netlify = {env: {get: name => settings[name]}};
let forwarded = 0;
const context = {next: async () => { forwarded++; return new Response('protected report'); }};
const origin = 'https://example.test';
const request = (path, options) => new Request(origin + path, options);
const post = (value, next = '/') => request('/__access/login', {
  method: 'POST', headers: {Origin: origin}, body: new URLSearchParams({password: value, next}),
});

const gate = await access(request('/', {headers: {Accept: 'text/html'}}), context);
assert.match(await gate.text(), /访问密码/);
assert.equal(gate.headers.get('Cache-Control'), 'private, no-store, max-age=0');
for (const path of ['/app.js', '/assets/figma/overview-imgVector.png', '/attitude-data.js']) {
  assert.equal((await access(request(path), context)).status, 401);
}
assert.equal(forwarded, 0);
assert.equal((await access(post('wrong'), context)).status, 401);
const good = await access(post(password, '/?view=report'), context);
assert.equal(good.status, 303);
assert.equal(good.headers.get('Location'), '/?view=report');
const setCookie = good.headers.get('Set-Cookie');
assert.match(setCookie, /HttpOnly; Secure; SameSite=Lax/);
const cookie = setCookie.split(';')[0];
const protectedResponse = await access(request('/app.js', {headers: {Cookie: cookie}}), context);
assert.equal(await protectedResponse.text(), 'protected report');
assert.equal(forwarded, 1);
assert.equal(protectedResponse.headers.get('Netlify-CDN-Cache-Control'), 'no-store');
const tampered = cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0');
assert.equal((await access(request('/app.js', {headers: {Cookie: tampered}}), context)).status, 401);
assert.equal((await access(post(password, '//evil.example'), context)).headers.get('Location'), '/');
const crossSite = request('/__access/login', {method: 'POST', headers: {Origin: 'https://evil.example'}, body: new URLSearchParams({password})});
assert.equal((await access(crossSite, context)).status, 403);
settings.DEMO_PASSWORD_HASH = 'changed';
assert.equal((await access(request('/app.js', {headers: {Cookie: cookie}}), context)).status, 401);
delete settings.DEMO_SESSION_SECRET;
assert.equal((await access(request('/'), context)).status, 503);
console.log('PASS: login, wrong password, protected assets, signed cookies, password rotation, redirect and origin checks, fail-closed configuration');
