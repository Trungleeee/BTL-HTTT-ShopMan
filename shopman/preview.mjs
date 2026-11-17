import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './WebContent/assets/routes.js';
import { readSession, readForm, sameOrigin, login, logout, expectedRole, selectRecord, pageContext } from './server-session.mjs';

// Local UI preview only. JSP directives are removed, never evaluated.
const root = fileURLToPath(new URL('./WebContent/', import.meta.url));
const types = { '.jsp': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const port = Number(process.env.PORT || 4173);
const origin = `http://127.0.0.1:${port}`;
http.createServer(async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const address = new URL(req.url, `http://${req.headers.host || new URL(origin).host}`);
    const pathname = decodeURIComponent(address.pathname);
    if (pathname === '/api/session' || pathname === '/doDangNhap.jsp') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }); return res.end('{}'); }
      if (!sameOrigin(req, address)) { res.writeHead(403); return res.end('{}'); }
      const form = await readForm(req);
      if (form.action === 'logout') { logout(req, res); return res.end('{"ok":true}'); }
      const user = login(req, res, form);
      if (!user) { res.writeHead(401); return res.end('{"error":"Tên đăng nhập hoặc mật khẩu không đúng."}'); }
      return res.end(JSON.stringify({ user }));
    }
    const canonical = ShopRoutes.legacy(address.href, address.origin + '/');
    if (canonical) {
      res.writeHead(302, { Location: canonical, 'Cache-Control': 'no-store' });
      return res.end();
    }
    if (pathname.length > 1 && pathname.endsWith('/')) {
      address.pathname = pathname.replace(/\/+$/, '');
      res.writeHead(308, { Location: address.pathname + address.search });
      return res.end();
    }
    const route = ShopRoutes.match(pathname);
    if (!route && !pathname.startsWith('/assets/')) throw new Error('Unknown route');
    const session = readSession(req);
    if (route && expectedRole(route.name) && session?.user.role !== expectedRole(route.name)) {
      if (req.method === 'POST') { res.writeHead(403); return res.end('Không có quyền truy cập.'); }
      res.writeHead(303, { Location: ShopRoutes.href('login', {}, address.origin + '/') }); return res.end();
    }
    if (req.method === 'POST' && route) {
      if (!sameOrigin(req, address)) { res.writeHead(403); return res.end('Yêu cầu không hợp lệ.'); }
      try { await selectRecord(session, route.name, await readForm(req)); }
      catch (err) { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(err.message); }
      res.writeHead(303, { Location: ShopRoutes.href(route.name, {}, address.origin + '/') }); return res.end();
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const file = path.resolve(root, '.' + (route ? '/' + route.file : pathname));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).includes('WEB-INF')) {
      res.writeHead(403); return res.end('Forbidden');
    }
    if (!(await stat(file)).isFile()) throw new Error('Missing file');
    let content = await readFile(file);
    if (path.extname(file) === '.jsp') content = content.toString('utf8')
      .replace(/<%@[^]*?%>/g, '')
      .replaceAll('<%= request.getContextPath() %>', '')
      .replaceAll('<%= request.getAttribute("shopmanContext") %>', () => JSON.stringify(pageContext(session, route.name)).replace(/</g, '\\u003c'));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Không tìm thấy trang.'); }
}).listen(port, '127.0.0.1', () => console.log(`ShopMan: http://127.0.0.1:${port}\nBản xem trước giao diện, chưa xử lý Java/DAO. Nhấn Ctrl+C để dừng.`));
