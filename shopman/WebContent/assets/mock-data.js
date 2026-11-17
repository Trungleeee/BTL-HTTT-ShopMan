/* Dữ liệu minh họa thuần JS. Không thay thế Entity/DAO Java hoặc xác thực máy chủ.
 * Giao diện chỉ gọi ShopData; thay adapter này bằng dữ liệu từ JSP/Servlet khi tích hợp.
 * Giá trên hóa đơn là giá tại thời điểm mua, không lấy giá bán hiện tại. */
(function (global) {
  'use strict';
  const categories = [
    { id: 1, categoryCode: 'LAP', categoryName: 'Laptop' },
    { id: 2, categoryCode: 'ELE', categoryName: 'Điện tử' },
    { id: 3, categoryCode: 'FOOD', categoryName: 'Thực phẩm' },
    { id: 4, categoryCode: 'HOME', categoryName: 'Gia dụng' }
  ];
  const productRows = [
    [1, 'SP001', 'Laptop Dell Inspiron', 15000000, 50, 'Chiếc', 1, 'laptop', 'Học tập và làm việc nhẹ nhàng hơn với màn hình 15,6 inch, bộ nhớ 16 GB và SSD 512 GB.'],
    [2, 'SP002', 'Laptop HP 15', 17500000, 24, 'Chiếc', 1, 'laptop', 'Thiết kế gọn gàng, màn hình 15,6 inch và SSD 512 GB. Một lựa chọn linh hoạt cho học tập, công việc.'],
    [3, 'P003', 'Màn hình View 24 inch', 3250000, 18, 'Chiếc', 2, 'monitor', 'Màn hình Full HD 24 inch với chân đế vững chắc.'],
    [4, 'P004', 'Tai nghe không dây Air', 1250000, 36, 'Chiếc', 2, 'headphones', 'Tai nghe chụp tai không dây, đệm tai mềm và màu xanh thanh lịch.'],
    [5, 'P005', 'Gạo thơm ST25 5 kg', 185000, 85, 'Túi', 3, 'rice', 'Gạo thơm hạt dài, đóng túi 5 kg, dùng cho bữa ăn gia đình. Bảo quản ở nơi khô ráo.'],
    [6, 'P006', 'Cà phê nguyên chất 250 g', 95000, 64, 'Gói', 3, 'coffee', 'Cà phê rang xay, hương vị đậm đà. Đóng gói 250 g, bảo quản kín sau khi mở.'],
    [7, 'P007', 'Dầu ăn thực vật 1 lít', 58000, 100, 'Chai', 3, 'oil', 'Dầu thực vật dùng trong chế biến món ăn hằng ngày. Dung tích 1 lít.'],
    [8, 'P008', 'Bình giữ nhiệt Everyday', 320000, 42, 'Chiếc', 4, 'bottle', 'Bình giữ nhiệt 500 ml với thân thép không gỉ và nắp kín.'],
    [9, 'P009', 'Nồi cơm điện 1,8 lít', 890000, 12, 'Chiếc', 4, 'cooker', 'Nồi cơm điện dành cho bữa cơm gia đình, dung tích 1,8 lít, có chế độ giữ ấm.'],
    [10, 'P010', 'Nước giặt dịu nhẹ 3 lít', 159000, 0, 'Chai', 4, 'detergent', 'Nước giặt dùng cho giặt tay và giặt máy. Sản phẩm hiện tạm hết hàng.']
  ];
  const products = productRows.map(([id, productCode, productName, sellingPrice, stockQuantity, unit, categoryId, art, description]) => ({ id, productCode, productName, sellingPrice, stockQuantity, unit, category: categories.find(c => c.id === categoryId), imageUrl: `assets/products/${art}.svg`, description }));
  const customers = [
    [1, 'KH001', 'Nguyễn Văn A', '0901000001', 'kh001@example.com', 'Hà Đông, Hà Nội'],
    [2, 'KH002', 'Nguyễn Văn B', '0901000002', 'kh002@example.com', 'Cầu Giấy, Hà Nội'],
    [3, 'KH003', 'Trần Minh Anh', '0901000003', 'kh003@example.com', 'Đống Đa, Hà Nội'],
    [4, 'KH004', 'Lê Hoàng Nam', '0901000004', 'kh004@example.com', 'Thanh Xuân, Hà Nội'],
    [5, 'KH005', 'Phạm Thu Hà', '0901000005', 'kh005@example.com', 'Long Biên, Hà Nội'],
    [6, 'KH006', 'Đỗ Quang Huy', '0901000006', 'kh006@example.com', 'Hoàng Mai, Hà Nội']
  ].map(([id, customerCode, fullName, phoneNumber, email, address]) => ({ id, customerCode, fullName, phoneNumber, email, address, defaultShippingAddress: address, loyaltyPoints: 120 }));
  const orderRows = [
    [1, 'DH001', '2026-09-05T09:20:00', 1, 'Đã giao', [[1, 1, 15000000]]],
    [15, 'DH015', '2026-09-12T14:30:00', 1, 'Đã giao', [[1, 1, 12500000]]],
    [17, 'DH017', '2026-09-13T10:15:00', 1, 'Đã giao', [[2, 1, 17500000]]],
    [18, 'DH018', '2026-09-15T08:45:00', 2, 'Đã giao', [[1, 1, 15000000], [2, 1, 17500000]]],
    [19, 'DH019', '2026-09-17T16:00:00', 3, 'Đã giao', [[3, 2, 3250000], [4, 2, 1250000]]],
    [20, 'DH020', '2026-09-20T11:10:00', 4, 'Đã giao', [[8, 5, 320000], [9, 2, 890000]]],
    [21, 'DH021', '2026-09-23T13:40:00', 5, 'Đã giao', [[5, 6, 185000], [6, 4, 95000], [7, 5, 58000]]],
    [22, 'DH022', '2026-09-30T23:59:00', 6, 'Đã giao', [[6, 5, 95000], [8, 2, 320000]]],
    [23, 'DH023', '2026-09-25T09:00:00', 1, 'Đã hủy', [[2, 1, 17500000]]],
    [24, 'DH024', '2026-09-28T09:00:00', 3, 'Đang giao', [[1, 1, 15000000]]],
    [25, 'DH025', '2026-10-01T00:00:00', 1, 'Đã giao', [[4, 1, 1250000]]],
    [26, 'DH026', '2026-08-31T23:59:00', 2, 'Đã giao', [[5, 1, 185000]]]
  ];
  const orders = orderRows.map(([id, orderCode, orderDate, customerId, status, items]) => {
    const customer = customers.find(c => c.id === customerId);
    const details = items.map(([productId, quantity, unitPrice], i) => ({ id: id * 100 + i, product: products.find(p => p.id === productId), quantity, unitPrice, amount: quantity * unitPrice }));
    return { id, orderCode, orderDate, customer, status, shippingAddress: customer.address, salesStaff: { employeeCode: 'NV001', fullName: 'Lê Minh' }, details, totalAmount: details.reduce((n, d) => n + d.amount, 0) };
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ');
  function validatePeriod(start, end) {
    function valid(value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    }
    if (!valid(start) || !valid(end)) throw new Error('Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc hợp lệ.');
    if (start > end) throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
  }
  function inPeriod(order, start, end) { return order.status === 'Đã giao' && order.orderDate.slice(0, 10) >= start && order.orderDate.slice(0, 10) <= end; }
  global.ShopData = Object.freeze({
    normalize, validatePeriod,
    async getCategories() { return clone(categories); },
    async getMatHangTheoTen(tuKhoa = '') { const q = normalize(tuKhoa); return clone(products.filter(p => normalize(p.productName).includes(q))); },
    async getMatHangTheoId(productId) { return clone(products.find(p => p.id === Number(productId)) || null); },
    async getCustomer(customerId) { return clone(customers.find(c => c.id === Number(customerId)) || null); },
    async getStoreOverview() {
      const months = orders.map(order => order.orderDate.slice(0, 7)).sort();
      const revenueByMonth = new Map();
      if (months.length) {
        const [firstYear, firstMonth] = months[0].split('-').map(Number);
        const [lastYear, lastMonth] = months[months.length - 1].split('-').map(Number);
        for (let index = firstYear * 12 + firstMonth - 1; index <= lastYear * 12 + lastMonth - 1; index++) {
          revenueByMonth.set(`${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`, 0);
        }
      }
      let totalRevenue = 0;
      for (const order of orders) {
        if (order.status !== 'Đã giao') continue;
        totalRevenue += order.totalAmount;
        const month = order.orderDate.slice(0, 7);
        revenueByMonth.set(month, revenueByMonth.get(month) + order.totalAmount);
      }
      return {
        totalRevenue,
        totalOrders: orders.length,
        shippingOrders: orders.filter(order => order.status === 'Đang giao').length,
        cancelledOrders: orders.filter(order => order.status === 'Đã hủy').length,
        monthlyRevenue: [...revenueByMonth].map(([month, revenue]) => ({ month, revenue }))
      };
    },
    async getKhoangThoiGianDuLieu() {
      const dates = orders.map(order => order.orderDate.slice(0, 10)).sort();
      return dates.length ? { ngayBatDau: dates[0], ngayKetThuc: dates[dates.length - 1] } : null;
    },
    async getKhachHangTheoDoanhThu(start, end) {
      validatePeriod(start, end);
      return clone(customers.map(c => {
        const selected = orders.filter(o => o.customer.id === c.id && inPeriod(o, start, end));
        return { ...c, soHoaDon: selected.length, tongDoanhThu: selected.reduce((n, o) => n + o.totalAmount, 0) };
      }).filter(c => c.soHoaDon > 0).sort((a, b) => b.tongDoanhThu - a.tongDoanhThu || a.id - b.id));
    },
    async getHoaDonCuaKhachHang(customerId, start, end) {
      validatePeriod(start, end);
      return clone(orders.filter(o => o.customer.id === Number(customerId) && inPeriod(o, start, end)).sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
    },
    async getHoaDonTrongKy(orderId, customerId, start, end) {
      validatePeriod(start, end);
      return clone(orders.find(o => o.id === Number(orderId) && o.customer.id === Number(customerId) && inPeriod(o, start, end)) || null);
    },
    async getChiTietHoaDon(orderId, customerId, start, end) {
      const order = await this.getHoaDonTrongKy(orderId, customerId, start, end);
      return order ? order.details : [];
    }
  });
})(globalThis);
