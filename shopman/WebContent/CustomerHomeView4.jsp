<%@ page isELIgnored="true" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8"><base href="<%= request.getContextPath() %>/">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Trang chủ khách hàng - ShopMan</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body data-role="customer"><div id="shell"></div>
<template id="page">
<section class="customer-welcome" aria-labelledby="home-title">
  <h1 id="home-title">Trang chủ khách hàng</h1>
  <p>Chào mừng bạn đến với cửa hàng ShopMan.</p>
  <p class="muted">Chọn <strong>Tìm mặt hàng</strong> trên thanh menu để bắt đầu tìm kiếm.</p>
</section>
</template>
<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/routes.js"></script><script src="assets/ui.js"></script>
</body>
</html>
