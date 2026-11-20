<%@ page isELIgnored="true" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8"><base href="<%= request.getContextPath() %>/">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tìm mặt hàng - ShopMan</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body data-role="customer"><div id="shell"></div>
<template id="page">
  <div class="page-heading"><h1>Tìm mặt hàng</h1></div>
  <section class="panel" aria-label="Tìm kiếm theo tên mặt hàng">
    <form id="search-form" class="search-form" method="get" action="san-pham">
      <div class="search-field">
        <label for="keyword">Tên mặt hàng</label>
        <input type="search" id="keyword" name="tuKhoa" placeholder="Nhập tên mặt hàng cần tìm" maxlength="100">
      </div>
      <input type="hidden" id="sort-field" name="sort" value="default">
      <button type="submit" class="btn">Tìm kiếm</button>
    </form>
  </section>
  <section aria-labelledby="result-title">
    <div class="results-header">
      <div><h2 id="result-title">Tất cả mặt hàng</h2><p id="result-message" class="search-message" role="status" aria-live="polite">Đang tải mặt hàng…</p></div>
      <div class="results-tools">
        <label class="hidden" for="sort">Sắp xếp mặt hàng</label>
        <select id="sort"><option value="default">Sắp xếp mặc định</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="name">Tên A đến Z</option></select>
      </div>
    </div>
    <div id="results" aria-busy="true"></div>
  </section>
</template>

<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/database-data.js"></script>
<script src="assets/routes.js"></script><script src="assets/ui.js"></script>
<script>
(async () => {
  if (UI.auth.user?.role !== 'customer') return;
  const query = (UI.params.get('tuKhoa') || '').trim().replace(/\s+/g, ' ');
  const message = document.querySelector('#result-message');
  const results = document.querySelector('#results');
  const sortControl = document.querySelector('#sort');
  document.querySelector('#keyword').value = query;
  const initialSort = UI.params.get('sort');
  if (['default', 'price-asc', 'price-desc', 'name'].includes(initialSort)) sortControl.value = initialSort;
  function persist() {
    const address = UI.url('products', { tuKhoa: query, sort: sortControl.value });
    document.querySelector('#sort-field').value = sortControl.value;
    history.replaceState(null, '', address);
  }
  try {
    const source = await ShopData.getMatHangTheoTen(query);
    function render() {
      const products = [...source];
      const sort = sortControl.value;
      products.sort((a, b) => sort === 'price-asc' ? a.sellingPrice - b.sellingPrice : sort === 'price-desc' ? b.sellingPrice - a.sellingPrice : sort === 'name' ? a.productName.localeCompare(b.productName, 'vi') : a.id - b.id);
      document.querySelector('#result-title').textContent = query ? `Kết quả cho “${query}”` : 'Tất cả mặt hàng';
      message.textContent = '';
      if (!products.length) {
        results.innerHTML = UI.empty(query ? 'Không tìm thấy mặt hàng phù hợp' : 'Chưa có mặt hàng', query ? 'Thử tìm bằng tên mặt hàng khác.' : '');
        return;
      }
      results.innerHTML = `<div class="table-wrap"><table>
        <caption class="hidden">Danh sách mặt hàng tìm được</caption>
        <thead><tr><th scope="col">STT</th><th scope="col">Mặt hàng</th><th scope="col" class="number">Giá bán</th><th scope="col">Tình trạng</th><th scope="col">Chi tiết</th></tr></thead>
        <tbody>${products.map((p, i) => {
          const selection = { productId: p.id, tuKhoa: query, sort };
          return `<tr>
            <td class="muted">${i + 1}</td>
            <td>${UI.selection('product', selection, `<img src="${UI.esc(p.imageUrl)}" alt=""><div><strong>${UI.esc(p.productName)}</strong><small>${UI.esc(p.productCode)}</small></div>`, { className: 'cell-product', html: true, label: 'Xem chi tiết ' + p.productName })}</td>
            <td class="number price">${UI.money(p.sellingPrice)}</td>
            <td><span class="badge ${p.stockQuantity ? 'success' : 'sold'}">${p.stockQuantity ? 'Còn hàng' : 'Hết hàng'}</span></td>
            <td>${UI.selection('product', selection, 'Xem chi tiết', { label: 'Mở chi tiết ' + p.productName })}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }
    sortControl.addEventListener('change', () => { render(); persist(); });
    render();
    persist();
  } catch (e) {
    message.textContent = e.message || 'Không thể tải mặt hàng. Vui lòng thử lại.';
  } finally {
    results.setAttribute('aria-busy', 'false');
  }
})();
</script>
</body>
</html>
