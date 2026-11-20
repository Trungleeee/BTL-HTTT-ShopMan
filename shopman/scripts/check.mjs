import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../WebContent/', import.meta.url));
const context = vm.createContext({ URL, URLSearchParams });
vm.runInContext(await readFile(path.join(root, 'assets/routes.js'), 'utf8'), context);
vm.runInContext(await readFile(path.join(root, 'assets/mock-data.js'), 'utf8'), context);
const data = context.ShopData;
const routing = context.ShopRoutes;
for (const base of ['http://127.0.0.1:4173/', 'https://example.com/ShopMan/']) {
  for (const route of routing.routes) {
    const params = { productId: 1, customerId: 2, orderId: 17, ngayBatDau: '2026-09-01', ngayKetThuc: '2026-09-30' };
    const target = routing.href(route.name, params, base);
    assert.ok(target.startsWith(base));
    assert.ok(!target.includes('.jsp'));
    assert.ok(!/[?&](?:productId|customerId|orderId|categoryId)=/i.test(target));
    assert.ok(!/\/\d+(?:[/?#]|$)/.test(new URL(target).pathname));
    assert.equal(routing.match(new URL(target).pathname, base).name, route.name);
    assert.equal(routing.parameters(target, base).get('ngayBatDau'), '2026-09-01');
    await access(path.join(root, route.file));
  }
  const product = routing.href('product', { productId: 1, tuKhoa: 'cà phê & trà' }, base);
  assert.equal(routing.parameters(product, base).get('tuKhoa'), 'cà phê & trà');
  assert.ok(new URL(product).pathname.endsWith('/san-pham/chi-tiet'));
  assert.equal(new URL(product).searchParams.has('productId'), false);
  assert.equal(routing.parameters(product + '&productId=99', base).get('productId'), null);
  const legacy = routing.legacy(base + 'CustomerPurchaseHistoryView4.jsp?customerId=2&ngayBatDau=2026-09-01', base);
  assert.ok(legacy.includes('/quan-ly/bao-cao/doanh-thu-khach-hang'));
  assert.equal(new URL(legacy).searchParams.get('ngayBatDau'), '2026-09-01');
  assert.equal(routing.match(new URL(base).pathname + 'not-found', base), null);
  assert.equal(new URL(routing.href('products', { categoryId: 1 }, base)).searchParams.get('danh-muc'), 'laptop');
  assert.equal(routing.parameters(routing.href('products', { categoryId: 1 }, base), base).get('categoryId'), '1');
}
const rows = await data.getKhachHangTheoDoanhThu('2026-09-01', '2026-09-30');
assert.equal(rows[0].customerCode, 'KH001');
assert.equal(rows[0].tongDoanhThu, 45000000);
assert.equal(rows[0].soHoaDon, 3);
assert.equal(rows[1].tongDoanhThu, 32500000);
assert.ok(rows.every((r, i) => i === 0 || rows[i - 1].tongDoanhThu >= r.tongDoanhThu));
let overall = 0;
for (const customer of rows) {
  const orders = await data.getHoaDonCuaKhachHang(customer.id, '2026-09-01', '2026-09-30');
  assert.equal(orders.length, customer.soHoaDon);
  assert.equal(orders.reduce((s, o) => s + o.totalAmount, 0), customer.tongDoanhThu);
  for (const order of orders) {
    assert.equal(order.status, 'Đã giao');
    const details = await data.getChiTietHoaDon(order.id, customer.id, '2026-09-01', '2026-09-30');
    assert.equal(details.reduce((s, d) => s + d.quantity * d.unitPrice, 0), order.totalAmount);
  }
  overall += customer.tongDoanhThu;
}
assert.equal(overall, 92775000);
const allPeriod = await data.getKhoangThoiGianDuLieu();
const allRows = await data.getKhachHangTheoDoanhThu(allPeriod.ngayBatDau, allPeriod.ngayKetThuc);
assert.equal(allRows.reduce((sum, row) => sum + row.tongDoanhThu, 0), 94210000, 'Overview includes August and October orders');
assert.equal(allRows.reduce((sum, row) => sum + row.soHoaDon, 0), 10);
const overview = await data.getStoreOverview();
assert.equal(overview.totalRevenue, 94210000, 'Store revenue excludes cancelled and shipping orders');
assert.equal(overview.totalOrders, 12, 'Store order count includes all statuses');
assert.equal(overview.shippingOrders, 1);
assert.equal(overview.cancelledOrders, 1);
assert.equal(overview.monthlyRevenue.map(row => row.month).join(','), '2026-08,2026-09,2026-10');
assert.equal(overview.monthlyRevenue.map(row => row.revenue).join(','), '185000,92775000,1250000');
assert.equal(overview.monthlyRevenue.reduce((sum, row) => sum + row.revenue, 0), overview.totalRevenue);
assert.equal((await data.getHoaDonCuaKhachHang(6, '2026-09-30', '2026-09-30')).length, 1, 'Include end-date 23:59');
assert.equal((await data.getHoaDonCuaKhachHang(1, '2026-09-05', '2026-09-05')).length, 1, 'Include same-day interval');
assert.equal(await data.getHoaDonTrongKy(17, 2, '2026-09-01', '2026-09-30'), null, 'Reject wrong customer');
assert.equal(await data.getHoaDonTrongKy(25, 1, '2026-09-01', '2026-09-30'), null, 'Reject outside period');
assert.equal(await data.getHoaDonTrongKy(23, 1, '2026-09-01', '2026-09-30'), null, 'Reject cancelled order');
assert.equal((await data.getChiTietHoaDon(17, 2, '2026-09-01', '2026-09-30')).length, 0);
assert.equal((await data.getKhachHangTheoDoanhThu('2030-01-01', '2030-01-31')).length, 0);
for (const [start, end] of [['2026-09-31', '2026-10-01'], ['2026-10-01', '2026-09-01'], ['', '2026-09-30'], ['abc', '2026-09-30']]) {
  await assert.rejects(() => data.getKhachHangTheoDoanhThu(start, end));
}
assert.equal((await data.getMatHangTheoTen('  LAPTOP  ')).length, 2);
assert.equal((await data.getMatHangTheoTen('ca phe'))[0].id, 6);
assert.equal((await data.getMatHangTheoTen('<script>')).length, 0);
assert.equal(await data.getMatHangTheoId(999), null);
const changed = await data.getMatHangTheoId(1); changed.sellingPrice = 1;
assert.equal((await data.getMatHangTheoId(1)).sellingPrice, 15000000, 'Returned data must not mutate the seed');
const products = await data.getMatHangTheoTen('');
for (const p of products) await access(path.join(root, p.imageUrl));

const pages = (await readdir(root)).filter(name => name.endsWith('.jsp') && name !== 'doDangNhap.jsp');
assert.equal(pages.filter(name => name.endsWith('View4.jsp')).length, 8);
assert.ok(pages.includes('LoginView.jsp'));
const webXml = await readFile(path.join(root, 'WEB-INF/web.xml'), 'utf8');
assert.match(webXml, /<servlet-name>session<\/servlet-name>\s*<jsp-file>\/doDangNhap\.jsp<\/jsp-file>/);
assert.match(webXml, /<servlet-name>session<\/servlet-name>\s*<url-pattern>\/api\/session<\/url-pattern>/);
let scripts = 0, links = 0;
for (const file of pages) {
  const html = await readFile(path.join(root, file), 'utf8');
  assert.match(html, /pageEncoding="UTF-8"/);
  assert.match(html, /<html lang="vi">/);
  for (const match of html.matchAll(/<script([^>]*)>([^]*?)<\/script>/g)) {
    if (!match[1].includes('application/json') && match[2].trim()) { new vm.Script(match[2], { filename: file }); scripts++; }
  }
  for (const match of html.matchAll(/(?:href|src|action)="([^"?#]+)(?:[^\"]*)"/g)) {
    const target = match[1];
    if (target.includes('${') || target.includes('<%') || target.includes(':') || target.startsWith('#')) continue;
    if (file === 'LoginView.jsp' && match[0].startsWith('action=') && target === 'api/session') { links++; continue; }
    const route = routing.match(new URL(target, 'http://localhost/').pathname);
    await access(path.join(root, route ? route.file : target)); links++;
  }
}
new vm.Script(await readFile(path.join(root, 'assets/ui.js'), 'utf8'));
console.log(`PASS: 9 clean routes, absolute URLs, context paths, legacy redirects, data rules, totals, ${products.length} images, ${scripts} page scripts, ${links} static references.`);
