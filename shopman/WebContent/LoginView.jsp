<%@ page isELIgnored="true" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head><meta charset="UTF-8"><base href="<%= request.getContextPath() %>/"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đăng nhập - ShopMan</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css"></head>
<body>
<div class="login-page">
  <div class="login-brand"><a class="brand" href="dang-nhap">SHOPMAN</a></div>
  <main class="login-content" id="main">
    <h1>Đăng nhập</h1>
    <form id="login-form" method="post" action="api/session">
      <div class="field"><label for="username">Tên đăng nhập</label><input id="username" name="username" autocomplete="username" required maxlength="50"></div>
      <div class="field"><label for="password">Mật khẩu</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
      <div id="login-error" class="alert" role="alert"></div>
      <button class="btn" type="submit">Đăng nhập</button>
    </form>
  </main>
</div>
<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/routes.js"></script><script src="assets/ui.js?v=2"></script>
<script>
const loginForm = document.querySelector('#login-form');
const loginError = document.querySelector('#login-error');
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.textContent = '';
  const fields = new FormData(loginForm);
  try {
    await UI.auth.login(fields.get('username'), fields.get('password'));
  } catch (error) {
    loginError.textContent = error.message || 'Không thể đăng nhập. Vui lòng thử lại.';
  }
});
</script>
</body></html>
