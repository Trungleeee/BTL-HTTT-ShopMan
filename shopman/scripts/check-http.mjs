import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const port = 4187;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['preview.mjs'], { cwd, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let errors = '';
let startupTimer;
server.stderr.on('data', data => { errors += data; });
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(() => { throw new Error(errors || 'Preview did not start'); }),
    new Promise((_, reject) => { startupTimer = setTimeout(() => reject(new Error('Preview startup timed out')), 10000); })
  ]);
  clearTimeout(startupTimer);
  const request = (pathname, cookie = '', form, origin = base) => fetch(base + pathname, {
    redirect: 'manual', method: form ? 'POST' : 'GET',
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(form ? { Origin: origin } : {}) },
    ...(form ? { body: new URLSearchParams(form) } : {})
  });
  const readContext = html => JSON.parse(html.match(/id="shopman-context">([^]*?)<\/script>/)[1]);
  const signIn = async (role, endpoint = '/api/session') => {
    const response = await request(endpoint, '', { action: 'login', role, username: role === 'manager' ? 'Admin' : 'khachhang', password: 'demo123' });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const manager = await signIn('manager'), customer = await signIn('customer');
  assert.equal((await request('/doDangNhap.jsp')).status, 405, 'Login handler only accepts POST');
  assert.equal((await request('/doDangNhap.jsp', '', { action: 'login', role: 'manager', username: 'Admin', password: 'wrong' })).status, 401);
  assert.equal((await request('/doDangNhap.jsp', '', { action: 'logout' }, 'https://evil.example')).status, 403);
  const protectedPaths = ['/cua-hang', '/san-pham', '/san-pham/chi-tiet', '/quan-ly', '/quan-ly/bao-cao', '/quan-ly/bao-cao/doanh-thu-khach-hang', '/quan-ly/khach-hang/lich-su-mua-hang', '/quan-ly/hoa-don/chi-tiet'];
  for (const pathname of protectedPaths) {
    const response = await request(pathname);
    assert.equal(response.status, 303, 'Anonymous access: ' + pathname);
    assert.equal(response.headers.get('location'), base + '/dang-nhap');
  }
  for (const pathname of ['/dang-nhap', ...protectedPaths]) {
    const cookie = pathname.startsWith('/quan-ly') ? manager : customer;
    const response = await request(pathname, cookie);
    assert.equal(response.status, 200, pathname);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const html = await response.text();
    assert.ok(html.includes('<base href="/">'), pathname + ' asset base');
    assert.ok(!html.includes('<%'), pathname + ' JSP expressions must be rendered');
    assert.ok(!/(?:href|action)="[^"\n]*\.jsp/.test(html), pathname + ' old links');
    for (const asset of html.matchAll(/(?:href|src)="(assets\/[^"?#]+)"/g)) {
      assert.equal((await fetch(base + '/' + asset[1])).status, 200, asset[1]);
    }
  }
  const legacy = await request('/gdChiTietMatHang4.jsp?productId=1&tuKhoa=laptop');
  assert.equal(legacy.status, 302);
  assert.equal(legacy.headers.get('location'), base + '/san-pham?tuKhoa=laptop');
  const history = await request('/gdLichSuMuaHang4.jsp?customerId=1&ngayBatDau=2026-09-01&ngayKetThuc=2026-09-30');
  assert.equal(history.headers.get('location'), base + '/quan-ly/bao-cao/doanh-thu-khach-hang?ngayBatDau=2026-09-01&ngayKetThuc=2026-09-30');
  const selection = { customerId: '1', ngayBatDau: '2026-09-01', ngayKetThuc: '2026-09-30' };
  const path = '/quan-ly/khach-hang/lich-su-mua-hang', invoice = '/quan-ly/hoa-don/chi-tiet';
  assert.equal((await request(path, customer, selection)).status, 403, 'Customer cannot select manager records');
  assert.equal((await request(path, manager, selection, 'https://evil.example')).status, 403, 'Reject cross-origin POST');
  assert.equal((await request(invoice, manager, { ...selection, orderId: '17' })).status, 400, 'Invoice requires selected history');
  const selected = await request(path, manager, selection);
  assert.equal(selected.status, 303);
  assert.equal(selected.headers.get('location'), base + path);
  let context = readContext(await (await request(path, manager)).text());
  assert.equal(context.selection.customerId, '1');
  const secondManager = await signIn('manager', '/doDangNhap.jsp');
  assert.deepEqual(readContext(await (await request(path, secondManager)).text()).selection, {}, 'Selection isolated between sessions');
  const invoicePost = await request(invoice, manager, { ...selection, orderId: '17' });
  assert.equal(invoicePost.status, 303);
  assert.equal(invoicePost.headers.get('location'), base + invoice);
  context = readContext(await (await request(invoice, manager)).text());
  assert.equal(context.selection.orderId, '17');
  for (const orderId of ['18', '23', '25', '999']) {
    assert.equal((await request(invoice, manager, { ...selection, orderId })).status, 400, 'Reject wrong customer, cancelled, out-of-range or missing invoice');
  }
  assert.equal((await request(invoice, manager, { ...selection, customerId: '2', orderId: '18' })).status, 400, 'Reject mismatched history context');
  const injected = await request(invoice + '?orderId=18&customerId=2', manager);
  assert.equal(injected.status, 302);
  assert.equal(injected.headers.get('location'), base + invoice, 'IDs stripped, never used from GET');
  const keyword = '$& </script><script>';
  assert.equal((await request('/san-pham/chi-tiet', customer, { productId: '1', tuKhoa: keyword })).status, 303);
  const productHtml = await (await request('/san-pham/chi-tiet', customer)).text();
  assert.equal(readContext(productHtml).selection.productId, '1');
  assert.equal(readContext(productHtml).selection.tuKhoa, keyword, 'Safe JSON insertion of user-controlled text');
  assert.ok(productHtml.match(/id="shopman-context">([^]*?)<\/script>/)[1].includes('\\u003c/script>'), 'Script terminator escaped inside JSON');
  assert.equal((await request('/quan-ly', customer)).headers.get('location'), base + '/dang-nhap');
  assert.equal((await request('/api/session', manager, { action: 'logout' })).status, 200);
  assert.equal((await request(invoice, manager)).status, 303, 'Logout invalidates server session');
  assert.equal((await fetch(base + '/', { redirect: 'manual' })).headers.get('location'), base + '/dang-nhap');
  const slash = await request('/quan-ly/bao-cao/');
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.get('location'), '/quan-ly/bao-cao');
  for (const pathname of ['/khong-ton-tai', '/WEB-INF/web.xml', '/san-pham/1/khong-ton-tai', '/assets/../preview.mjs']) {
    assert.equal((await fetch(base + pathname)).status, 404, pathname);
  }
  console.log('PASS: server authentication, role checks, HttpOnly session cookie, POST selections, CSRF origin checks, session isolation, invoice scope, logout, ID-free redirects, assets and private paths.');
} finally {
  clearTimeout(startupTimer);
  server.kill();
}
