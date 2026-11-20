(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const siteBase = document.baseURI;
  const url = (name, params = {}) => ShopRoutes.href(name, params, siteBase);
  const money = amount => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  const date = value => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value.length === 10 ? value + 'T00:00:00' : value));
  const context = JSON.parse(document.querySelector('#shopman-context')?.textContent || '{}');
  const auth = {
    user: context.user || null,
    async login(username, password) {
      const response = await fetch(new URL('api/session', siteBase), { method: 'POST', credentials: 'same-origin', body: new URLSearchParams({ action: 'login', username, password }) });
      if (response.status === 401) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
      if (!response.ok) throw new Error('Không thể đăng nhập lúc này. Vui lòng thử lại.');
      const { user } = await response.json();
      location.href = url(user.role === 'manager' ? 'management' : 'store');
    },
    async logout() {
      const response = await fetch(new URL('api/session', siteBase), { method: 'POST', credentials: 'same-origin', body: new URLSearchParams({ action: 'logout' }) });
      if (!response.ok) { error('Không thể đăng xuất. Vui lòng thử lại.'); return; }
      location.href = url('login');
    }
  };
  const params = ShopRoutes.parameters(location.href, siteBase);
  for (const [key, value] of Object.entries(context.selection || {})) params.set(key, value);
  const period = () => ({ ngayBatDau: params.get('ngayBatDau'), ngayKetThuc: params.get('ngayKetThuc') });
  const status = text => `<span class="status">${esc(text)}</span>`;
  const empty = (title, text, action = '') => `<div class="empty"><h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ''}${action}</div>`;
  function error(message, target = document.querySelector('main')) {
    if (target) target.innerHTML = `<div class="alert" role="alert">${esc(message)}</div>`;
  }
  function card(p, q = '', context = {}) {
    return selection('product', { ...context, productId: p.id, tuKhoa: q }, `
      <div class="product-art"><img src="${esc(p.imageUrl)}" alt="${esc(p.productName)}" loading="lazy"></div>
      <div class="product-copy"><small>${esc(p.productCode)}</small>
      <h3>${esc(p.productName)}</h3><strong>${money(p.sellingPrice)}</strong>
      <span class="stock ${p.stockQuantity ? '' : 'sold'}">${p.stockQuantity ? 'Còn hàng' : 'Hết hàng'}</span></div>`, { formClass: 'product-card', className: 'product-card-button', html: true, label: 'Xem ' + p.productName });
  }
  function selection(name, values, text, options = {}) {
    const fields = Object.entries(values).filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `<input type="hidden" name="${esc(key)}" value="${esc(value)}">`).join('');
    return `<form class="selection-form ${esc(options.formClass || '')}" method="post" action="${esc(url(name))}">${fields}<button type="submit" class="${esc(options.className || 'selection-link')}" ${options.label ? `aria-label="${esc(options.label)}"` : ''}>${options.html ? text : esc(text)}</button></form>`;
  }
  function stats(items) {
    return `<dl class="stats">${items.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
  }
  function shell() {
    const role = document.body.dataset.role;
    if (!role) return;
    if (!auth.user || auth.user.role !== role) {
      location.replace(url('login')); return;
    }
    const manager = role === 'manager';
    const current = ShopRoutes.match(location.pathname, siteBase)?.name;
    const home = url(manager ? 'management' : 'store');
    const links = manager
      ? [['management', 'Tổng quan'], ['reports', 'Thống kê']]
      : [['store', 'Trang chủ'], ['products', 'Tìm mặt hàng']];
    const active = file => current === file
      || (file === 'products' && current === 'product')
      || (file === 'reports' && ['customerRevenue', 'purchaseHistory', 'invoice'].includes(current));
    document.querySelector('#shell').innerHTML = `
      <a class="skip" href="#main">Đến nội dung chính</a>
      <header class="site-header"><div class="header-inner">
        <a class="brand" href="${home}">SHOPMAN</a>
        <nav aria-label="Điều hướng chính">${links.map(([file, label]) => `<a href="${esc(url(file))}" ${active(file) ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
        <div class="account"><span>${esc(auth.user.fullName)}</span><button type="button" id="logout">Đăng xuất</button></div>
      </div></header>
      <main id="main" tabindex="-1">${document.querySelector('#page').innerHTML}</main>`;
    document.querySelector('#page').remove();
    document.querySelector('#logout').addEventListener('click', auth.logout);
  }
  window.UI = { esc, url, money, date, auth, params, period, status, empty, error, card, selection, stats };
  const canonical = ShopRoutes.legacy(location.href, siteBase);
  if (canonical) { location.replace(canonical); return; }
  shell();
  document.querySelectorAll('a[href], form[action]').forEach(element => {
    const attribute = element.tagName === 'FORM' ? 'action' : 'href';
    const value = element.getAttribute(attribute);
    const target = value.startsWith('#') ? new URL(value, location.href) : new URL(value, siteBase);
    element.setAttribute(attribute, target.href);
  });
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form.matches('form.selection-form')) return;
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const response = await fetch(form.action, { method: 'POST', credentials: 'same-origin', body: new URLSearchParams(new FormData(form)) });
      if (!response.ok) throw new Error(await response.text());
      location.assign(response.url);
    } catch (err) {
      error(err.message || 'Không thể mở bản ghi. Vui lòng thử lại.');
      if (button) button.disabled = false;
    }
  });
})();
