<%@ page isELIgnored="true" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html><html lang="vi"><head><meta charset="UTF-8"><base href="<%= request.getContextPath() %>/"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Doanh thu khách hàng • ShopMan</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css"></head><body data-role="manager"><div id="shell"></div><template id="page">
<div class="page-heading"><div><h1>Khách hàng theo doanh thu</h1></div><div class="actions no-print"><a href="quan-ly/bao-cao" class="btn secondary">Quay lại</a></div></div>
<section class="panel">
  <form class="period-form" id="period-form" method="get" action="quan-ly/bao-cao/doanh-thu-khach-hang">
    <div class="field"><label for="start-date">Từ ngày</label><input id="start-date" type="date" name="ngayBatDau" required></div>
    <div class="field"><label for="end-date">Đến ngày</label><input id="end-date" type="date" name="ngayKetThuc" required></div>
    <input type="hidden" id="sort-field" name="sort" value="descending">
    <button type="submit" class="btn">Xem thống kê</button>
  </form>
  <div class="alert" role="alert" id="period-error"></div>
  <p class="filter-note">Chỉ tính hóa đơn đã giao.</p>
</section>
<section id="report-content" aria-labelledby="report-title" aria-live="polite" hidden>
  <div class="results-header">
    <div><h2 id="report-title">Danh sách khách hàng</h2></div>
    <div class="results-tools no-print" hidden>
      <label class="hidden" for="sort">Sắp xếp theo doanh thu</label>
      <select id="sort">
        <option value="descending">Doanh thu giảm dần</option>
        <option value="ascending">Doanh thu tăng dần</option>
      </select>
    </div>
  </div>
  <div id="report-results"></div>
</section>
</template><script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/database-data.js"></script><script src="assets/routes.js"></script><script src="assets/ui.js?v=3"></script><script>
(async () => {
  if (UI.auth.user?.role !== 'manager') return;
  const period = UI.period();
  const reportRequested = period.ngayBatDau !== null || period.ngayKetThuc !== null;
  const form = document.querySelector('#period-form');
  const periodError = document.querySelector('#period-error');
  const sortControl = document.querySelector('#sort');
  const sortField = document.querySelector('#sort-field');
  sortControl.value = UI.params.get('sort') === 'ascending' ? 'ascending' : 'descending';
  sortField.value = sortControl.value;
  form.ngayBatDau.value = period.ngayBatDau ?? '';
  form.ngayKetThuc.value = period.ngayKetThuc ?? '';
  form.addEventListener('submit', event => {
    try { ShopData.validatePeriod(form.ngayBatDau.value, form.ngayKetThuc.value); }
    catch (error) { event.preventDefault(); periodError.textContent = error.message; }
  });
  if (!reportRequested) return;

  try {
    ShopData.validatePeriod(period.ngayBatDau, period.ngayKetThuc);
    const rows = await ShopData.getKhachHangTheoDoanhThu(period.ngayBatDau, period.ngayKetThuc);
    const report = document.querySelector('#report-content');
    const results = document.querySelector('#report-results');
    if (!rows.length) {
      results.innerHTML = UI.empty('Chưa có doanh thu trong kỳ', 'Không có hóa đơn đã giao trong khoảng ngày đã chọn.');
      report.hidden = false;
      return;
    }

    const total = rows.reduce((sum, row) => sum + row.tongDoanhThu, 0);
    const count = rows.reduce((sum, row) => sum + row.soHoaDon, 0);
    results.innerHTML = `
      <div class="table-wrap">
        <table>
          <caption class="hidden">Khách hàng theo doanh thu</caption>
          <thead><tr>
            <th scope="col">Hạng</th>
            <th scope="col">Khách hàng</th>
            <th scope="col">Điện thoại</th>
            <th scope="col" class="number">Số hóa đơn</th>
            <th scope="col" class="number" id="revenue-column">Doanh thu</th>
            <th scope="col">Lịch sử mua</th>
          </tr></thead>
          <tbody></tbody>
          <tfoot><tr>
            <td colspan="3"><strong>Tổng cộng</strong></td>
            <td class="number"><strong>${count}</strong></td>
            <td class="number price">${UI.money(total)}</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>`;

    const revenueColumn = results.querySelector('#revenue-column');
    const tableBody = results.querySelector('tbody');
    function renderRows() {
      const sort = sortControl.value;
      const direction = sort === 'ascending' ? 1 : -1;
      const sorted = [...rows].sort((a, b) => direction * (a.tongDoanhThu - b.tongDoanhThu));
      revenueColumn.setAttribute('aria-sort', sort);
      tableBody.innerHTML = sorted.map((row, index) => `
        <tr>
          <td class="muted">${String(index + 1).padStart(2, '0')}</td>
          <td><div class="cell-product"><div><strong>${UI.esc(row.fullName)}</strong><small>${UI.esc(row.customerCode)}</small></div></div></td>
          <td class="muted">${UI.esc(row.phoneNumber)}</td>
          <td class="number">${row.soHoaDon}</td>
          <td class="number price">${UI.money(row.tongDoanhThu)}</td>
          <td>${UI.selection('purchaseHistory', { customerId: row.id, ...period, sort }, 'Xem lịch sử', { label: 'Xem lịch sử của ' + row.fullName })}</td>
        </tr>`).join('');
    }
    sortControl.addEventListener('change', () => {
      const sort = sortControl.value;
      sortField.value = sort;
      history.replaceState(null, '', UI.url('customerRevenue', { ...period, sort }));
      renderRows();
    });
    renderRows();
    sortControl.closest('.results-tools').hidden = false;
    report.hidden = false;
  } catch (error) { periodError.textContent = error.message; }
})();
</script></body></html>
