<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8"><base href="<%= request.getContextPath() %>/">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Báo cáo - ShopMan</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body data-role="manager"><div id="shell"></div>
<template id="page">
<div class="page-heading"><h1>Báo cáo</h1></div>
<div class="report-list">
  <div class="report-row"><div><h2>Khách hàng theo doanh thu</h2></div><a class="btn" href="quan-ly/bao-cao/doanh-thu-khach-hang">Xem báo cáo</a></div>
  <div class="report-row unavailable"><h2>Hàng nhập</h2><span>Chưa có</span></div>
  <div class="report-row unavailable"><h2>Hàng xuất</h2><span>Chưa có</span></div>
  <div class="report-row unavailable"><h2>Nhà cung cấp</h2><span>Chưa có</span></div>
</div>
</template>
<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/routes.js"></script><script src="assets/ui.js"></script>
</body>
</html>
