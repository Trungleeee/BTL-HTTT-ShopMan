/* Data queried by JSP through the report's Java DAOs. No sample-data fallback. */
(function (global) {
  'use strict';
  const context = JSON.parse(document.querySelector('#shopman-context').textContent);
  const data = context.data || {};
  function read(key) {
    if (data.error) throw new Error(data.error);
    if (!(key in data)) throw new Error('Không có dữ liệu từ máy chủ. Hãy chạy hệ thống bằng Tomcat.');
    return data[key];
  }
  function validatePeriod(start, end) {
    const valid = value => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
      const date = new Date(value + 'T00:00:00Z');
      return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    };
    if (!valid(start) || !valid(end)) throw new Error('Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc hợp lệ.');
    if (start > end) throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
  }
  global.ShopData = Object.freeze({
    validatePeriod,
    async getMatHangTheoTen() { return read('products'); },
    async getMatHangTheoId() { return read('product'); },
    async getStoreOverview() { return read('overview'); },
    async getKhachHangTheoDoanhThu() { return read('customers'); },
    async getCustomer() { return read('customer'); },
    async getHoaDonCuaKhachHang() { return read('orders'); },
    async getHoaDonTrongKy() { return read('order'); },
    async getChiTietHoaDon() { return read('details'); }
  });
})(globalThis);
