(function (global) {
  'use strict';
  const routes = [
    { name: 'login', path: '/dang-nhap', file: 'gdDangNhap4.jsp' },
    { name: 'store', path: '/cua-hang', file: 'gdChinhKH4.jsp' },
    { name: 'products', path: '/san-pham', file: 'gdTimKiemMatHang4.jsp' },
    { name: 'product', path: '/san-pham/chi-tiet', file: 'gdChiTietMatHang4.jsp' },
    { name: 'management', path: '/quan-ly', file: 'gdChinhQL4.jsp' },
    { name: 'reports', path: '/quan-ly/bao-cao', file: 'gdChonTK4.jsp' },
    { name: 'customerRevenue', path: '/quan-ly/bao-cao/doanh-thu-khach-hang', file: 'gdTKKhachHang4.jsp' },
    { name: 'purchaseHistory', path: '/quan-ly/khach-hang/lich-su-mua-hang', file: 'gdLichSuMuaHang4.jsp' },
    { name: 'invoice', path: '/quan-ly/hoa-don/chi-tiet', file: 'gdChiTietHoaDon4.jsp' }
  ];
  const allowedQuery = new Set(['tuKhoa', 'sort', 'view', 'ngayBatDau', 'ngayKetThuc', 'danh-muc']);
  const categorySlugs = ['', 'laptop', 'dien-tu', 'thuc-pham', 'gia-dung'];
  function basePath(base) { return new URL(base).pathname.replace(/\/$/, ''); }
  function relativePath(pathname, base) {
    const prefix = basePath(base);
    if (prefix && pathname !== prefix && !pathname.startsWith(prefix + '/')) return null;
    return pathname.slice(prefix.length) || '/';
  }
  function match(pathname, base = 'http://localhost/') {
    const relative = relativePath(pathname, base);
    if (relative === null) return null;
    const route = routes.find(item => item.path === relative);
    return route ? { ...route, params: {} } : null;
  }
  function href(name, params = {}, base = 'http://localhost/') {
    const route = routes.find(item => item.name === name);
    if (!route) throw new Error('Không tìm thấy trang: ' + name);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === 'categoryId' && categorySlugs[Number(value)]) query.set('danh-muc', categorySlugs[Number(value)]);
      if (allowedQuery.has(key) && value !== null && value !== undefined && value !== '') query.set(key, String(value));
    }
    const target = new URL(route.path.slice(1), base.endsWith('/') ? base : base + '/');
    target.search = query.toString();
    return target.href;
  }
  function parameters(address, base = 'http://localhost/') {
    const target = new URL(address);
    const result = new URLSearchParams([...target.searchParams].filter(([key]) => allowedQuery.has(key)));
    const categoryId = categorySlugs.indexOf(result.get('danh-muc'));
    if (categoryId > 0) result.set('categoryId', String(categoryId));
    const route = match(target.pathname, base);
    if (route) for (const [key, value] of Object.entries(route.params)) result.set(key, value);
    return result;
  }
  function legacy(address, base = 'http://localhost/') {
    const target = new URL(address);
    const relative = relativePath(target.pathname, base);
    if (relative === '/' || relative === '/index.jsp') return href('login', Object.fromEntries(target.searchParams), base);
    const route = routes.find(item => relative === '/' + item.file);
    const oldNumericRoute = /^\/san-pham\/\d+$/.test(relative || '') ? 'products'
      : /^\/quan-ly\/(?:khach-hang\/\d+\/lich-su-mua-hang|hoa-don\/\d+)$/.test(relative || '') ? 'customerRevenue' : null;
    if (oldNumericRoute) return href(oldNumericRoute, Object.fromEntries(target.searchParams), base);
    if (route) {
      const name = route.name === 'product' ? 'products' : ['purchaseHistory', 'invoice'].includes(route.name) ? 'customerRevenue' : route.name;
      return href(name, Object.fromEntries(target.searchParams), base);
    }
    if ([...target.searchParams.keys()].some(key => !allowedQuery.has(key))) {
      const current = match(target.pathname, base);
      if (current) return href(current.name, Object.fromEntries(target.searchParams), base);
    }
    return null;
  }
  global.ShopRoutes = Object.freeze({ routes: Object.freeze(routes.map(Object.freeze)), match, href, parameters, legacy });
})(globalThis);
