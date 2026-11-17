<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html><html lang="vi"><head><meta charset="UTF-8"><base href="<%= request.getContextPath() %>/"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Doanh thu khách hàng • ShopMan</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css"></head><body data-role="manager"><div id="shell"></div><template id="page">
<div class="page-heading"><div><h1>Khách hàng theo doanh thu</h1></div><div class="actions no-print"><a href="quan-ly/bao-cao" class="btn secondary">Quay lại</a></div></div>
<section class="panel"><form class="period-form" id="period-form" method="get" action="quan-ly/bao-cao/doanh-thu-khach-hang"><div class="field"><label for="start-date">Từ ngày</label><input id="start-date" type="date" name="ngayBatDau" required></div><div class="field"><label for="end-date">Đến ngày</label><input id="end-date" type="date" name="ngayKetThuc" required></div><button type="submit" class="btn">Xem thống kê </button></form><div class="alert" role="alert" id="period-error"></div><p class="filter-note">Chỉ tính hóa đơn đã giao.</p></section><div id="report-content" aria-live="polite"></div>
</template><script src="assets/mock-data.js"></script><script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/routes.js"></script><script src="assets/ui.js"></script><script>
(async () => {
  if (UI.auth.user?.role !== 'manager') return;
  let rows = [], descending = true; const period = UI.period();
  const form = document.querySelector('#period-form'); form.ngayBatDau.value = period.ngayBatDau; form.ngayKetThuc.value = period.ngayKetThuc;
  form.addEventListener('submit', e => { try { ShopData.validatePeriod(form.ngayBatDau.value, form.ngayKetThuc.value); } catch (err) { e.preventDefault(); document.querySelector('#period-error').textContent = err.message; } });
  function render() {
    const total = rows.reduce((s, r) => s + r.tongDoanhThu, 0), count = rows.reduce((s, r) => s + r.soHoaDon, 0);
    const sorted = [...rows].sort((a,b) => descending ? b.tongDoanhThu-a.tongDoanhThu : a.tongDoanhThu-b.tongDoanhThu);
    document.querySelector('#report-content').innerHTML = `<div class="panel-header"><h2>Danh sách khách hàng</h2></div>` + (!rows.length ? UI.empty('Chưa có doanh thu trong kỳ', 'Không có hóa đơn đã giao trong khoảng ngày đã chọn.') : `<div class="table-wrap"><table><caption class="hidden">Khách hàng theo doanh thu</caption><thead><tr><th scope="col">Hạng</th><th scope="col">Khách hàng</th><th scope="col">Điện thoại</th><th scope="col" class="number">Số hóa đơn</th><th scope="col" class="number"><button type="button" class="sort-button" id="sort-revenue">Doanh thu ${descending ? '(giảm dần)' : '(tăng dần)'}</button></th><th scope="col">Lịch sử mua</th></tr></thead><tbody>${sorted.map((r, i) => `<tr><td class="muted">${String(i + 1).padStart(2, '0')}</td><td><div class="cell-product"><div><strong>${UI.esc(r.fullName)}</strong><small>${UI.esc(r.customerCode)}</small></div></div></td><td class="muted">${UI.esc(r.phoneNumber)}</td><td class="number">${r.soHoaDon}</td><td class="number price">${UI.money(r.tongDoanhThu)}</td><td>${UI.selection('purchaseHistory', { customerId: r.id, ...period }, 'Xem lịch sử', { label: 'Xem lịch sử của ' + r.fullName })}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3"><strong>Tổng cộng</strong></td><td class="number"><strong>${count}</strong></td><td class="number price">${UI.money(total)}</td><td></td></tr></tfoot></table></div>`);
    document.querySelector('#sort-revenue')?.addEventListener('click', () => { descending = !descending; render(); });
  }
  try { rows = await ShopData.getKhachHangTheoDoanhThu(period.ngayBatDau, period.ngayKetThuc); render(); }
  catch (err) { document.querySelector('#period-error').textContent = err.message; }
})();
</script></body></html>
