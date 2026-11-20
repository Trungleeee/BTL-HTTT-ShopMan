<%@ page isELIgnored="true" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8"><base href="<%= request.getContextPath() %>/">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Trang chủ quản lý - ShopMan</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body data-role="manager"><div id="shell"></div>
<template id="page">
<section class="customer-welcome" aria-labelledby="home-title">
  <h1 id="home-title">Trang chủ quản lý</h1>
  <p>Chào mừng bạn đến với hệ thống quản lý cửa hàng ShopMan.</p>
  <p class="muted">Chọn <strong>Thống kê</strong> trên thanh menu để xem các chức năng thống kê.</p>
</section>
</template>

<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script>
<script src="assets/routes.js"></script><script src="assets/ui.js"></script>

</body>
</html>
