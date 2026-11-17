<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8"><base href="<%= request.getContextPath() %>/">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tổng quan cửa hàng - ShopMan</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body data-role="manager"><div id="shell"></div>
<template id="page">
  <div class="page-heading">
    <div><h1>Tổng quan cửa hàng</h1><p>Phạm vi: toàn bộ thời gian có dữ liệu.</p></div>
  </div>
  <div id="overview-stats"></div>
  <section class="panel" aria-labelledby="revenue-chart-title">
    <h2 id="revenue-chart-title">Doanh thu theo thời gian</h2>
    <figure class="overview-chart">
      <figcaption>Doanh thu theo tháng, tính từ các đơn hàng đã giao theo ngày đặt.</figcaption>
      <div id="revenue-chart" class="overview-chart-scroll" aria-live="polite"></div>
    </figure>
  </section>
</template>
<script src="assets/mock-data.js"></script>
<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script>
<script src="assets/routes.js"></script><script src="assets/ui.js"></script>
<script>
(async () => { try {
  if (UI.auth.user?.role !== 'manager') return;
  const overview = await ShopData.getStoreOverview();
  document.querySelector('#overview-stats').innerHTML = UI.stats([
    ['Doanh thu đã giao', UI.money(overview.totalRevenue)],
    ['Tổng đơn hàng', overview.totalOrders],
    ['Đang giao', overview.shippingOrders],
    ['Đã hủy', overview.cancelledOrders]
  ]);
  const rows = overview.monthlyRevenue;
  const container = document.querySelector('#revenue-chart');
  if (!rows.length || !overview.totalRevenue) {
    container.innerHTML = UI.empty('Chưa có dữ liệu doanh thu', 'Biểu đồ sẽ hiển thị khi có đơn hàng đã giao.');
    return;
  }
  const width = Math.max(800, rows.length * 120 + 100);
  const left = 85, right = 30, top = 50, height = 220, baseline = top + height;
  const maxRevenue = Math.max(1, ...rows.map(row => row.revenue));
  const tickSize = 10 ** Math.floor(Math.log10(maxRevenue));
  const ceiling = Math.ceil(maxRevenue / tickSize) * tickSize;
  const step = (width - left - right) / rows.length;
  const barWidth = Math.min(90, step * 0.45);
  const millions = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value / 1000000);
  const monthLabel = month => month.slice(5) + '/' + month.slice(0, 4);
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = ceiling * index / 4;
    const y = baseline - height * index / 4;
    return `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width-right}" y2="${y}"/><text x="${left-12}" y="${y+4}" text-anchor="end">${millions(value)}</text>`;
  }).join('');
  const bars = rows.map((row, index) => {
    const x = left + step * (index + 0.5);
    const barHeight = row.revenue ? Math.max(1.5, row.revenue / ceiling * height) : 0;
    return `<g><rect class="chart-bar" x="${x-barWidth/2}" y="${baseline-barHeight}" width="${barWidth}" height="${barHeight}"><title>${UI.esc(monthLabel(row.month))}: ${UI.esc(UI.money(row.revenue))}</title></rect><text class="chart-value" x="${x}" y="${baseline-barHeight-12}" text-anchor="middle">${UI.esc(UI.money(row.revenue))}</text><text x="${x}" y="${baseline+28}" text-anchor="middle">${UI.esc(monthLabel(row.month))}</text></g>`;
  }).join('');
  const description = rows.map(row => `${monthLabel(row.month)}: ${UI.money(row.revenue)}`).join('; ');
  container.innerHTML = `<svg viewBox="0 0 ${width} ${baseline+45}" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">Doanh thu theo tháng</title><desc id="chart-description">${UI.esc(description)}</desc><text x="${left}" y="20">Triệu đồng</text>${ticks}<line class="chart-baseline" x1="${left}" y1="${baseline}" x2="${width-right}" y2="${baseline}"/>${bars}</svg>`;
} catch (e) { UI.error(e.message); } })();
</script>
</body>
</html>
