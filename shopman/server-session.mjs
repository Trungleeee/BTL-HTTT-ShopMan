import { randomBytes } from 'node:crypto';
import './WebContent/assets/mock-data.js';

const sessions = new Map();
const ttl = 30 * 60 * 1000;
const cookieName = 'shopman_session';
export function readSession(req) {
  const token = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return null; }
  session.expires = Date.now() + ttl;
  return session;
}
export async function readForm(req) {
  let content = '', size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw new Error('Yêu cầu quá lớn.');
    content += chunk.toString('utf8');
  }
  return Object.fromEntries(new URLSearchParams(content));
}
export function sameOrigin(req, address) {
  return req.headers.origin === address.origin && !['cross-site', 'same-site'].includes(req.headers['sec-fetch-site']);
}
export function login(req, res, form) {
  const expected = form.role === 'manager' ? 'Admin' : form.role === 'customer' ? 'khachhang' : null;
  if (!expected || form.username?.trim() !== expected || form.password !== 'demo123') return null;
  const old = readSession(req);
  if (old) sessions.delete(old.token);
  for (const [key, value] of sessions) if (value.expires < Date.now()) sessions.delete(key);
  const token = randomBytes(32).toString('hex');
  const user = form.role === 'manager' ? { role: 'manager', fullName: 'Admin', code: 'QL001' } : { role: 'customer', fullName: 'Nguyễn Văn A', code: 'KH001' };
  sessions.set(token, { token, user, selections: {}, expires: Date.now() + ttl });
  res.setHeader('Set-Cookie', `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1800${req.socket.encrypted ? '; Secure' : ''}`);
  return user;
}
export function logout(req, res) {
  const session = readSession(req);
  if (session) sessions.delete(session.token);
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}
export function expectedRole(name) { return ['store', 'products', 'product'].includes(name) ? 'customer' : name === 'login' ? null : 'manager'; }
export async function selectRecord(session, name, input) {
  const idKey = { product: 'productId', purchaseHistory: 'customerId', invoice: 'orderId' }[name];
  if (!idKey || !/^[1-9][0-9]{0,8}$/.test(input[idKey] || '')) throw new Error('Vui lòng chọn bản ghi từ danh sách.');
  const selection = { [idKey]: input[idKey] };
  if (name === 'product') {
    if (!await ShopData.getMatHangTheoId(input.productId)) throw new Error('Không tìm thấy mặt hàng.');
    for (const key of ['tuKhoa', 'categoryId', 'sort', 'view']) if (input[key] !== undefined) selection[key] = input[key].slice(0, 150);
  } else {
    const start = input.ngayBatDau || '2026-09-01', end = input.ngayKetThuc || '2026-09-30';
    ShopData.validatePeriod(start, end);
    Object.assign(selection, { ngayBatDau: start, ngayKetThuc: end });
    if (name === 'purchaseHistory') {
      if (!await ShopData.getCustomer(input.customerId)) throw new Error('Không tìm thấy khách hàng.');
      delete session.selections.invoice;
    } else {
      const parent = session.selections.purchaseHistory;
      if (!parent || parent.customerId !== input.customerId || parent.ngayBatDau !== start || parent.ngayKetThuc !== end) throw new Error('Vui lòng chọn hóa đơn từ lịch sử mua hàng hiện tại.');
      if (!await ShopData.getHoaDonTrongKy(input.orderId, parent.customerId, start, end)) throw new Error('Hóa đơn không thuộc khách hàng hoặc kỳ đã chọn.');
      selection.customerId = parent.customerId;
    }
  }
  session.selections[name] = selection;
}
export function pageContext(session, name) { return { user: session?.user || null, selection: session?.selections[name] || {} }; }
