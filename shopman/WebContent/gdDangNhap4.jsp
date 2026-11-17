<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="WEB-INF/request-context.jspf" %>
<!doctype html>
<html lang="vi">
<head><meta charset="UTF-8"><base href="<%= request.getContextPath() %>/"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đăng nhập - ShopMan</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css"></head>
<body>
<div class="login-page">
  <div class="login-brand"><a class="brand" href="dang-nhap">SHOPMAN</a></div>
  <main class="login-content" id="main">
    <h1>Đăng nhập</h1>
    <form id="login-form">
      <fieldset class="role-options"><legend>Vai trò</legend>
        <label class="role-option"><input type="radio" name="role" value="customer" checked>Khách hàng</label>
        <label class="role-option"><input type="radio" name="role" value="manager">Admin</label>
      </fieldset>
      <div class="field"><label for="username">Tên đăng nhập</label><input id="username" name="username" autocomplete="off" value="khachhang" required maxlength="50"></div>
      <div class="field"><label for="password">Mật khẩu</label><input id="password" name="password" type="password" autocomplete="off" value="demo123" required></div>
      <div id="login-error" class="alert" role="alert"></div>
      <button class="btn" type="submit">Đăng nhập</button>
    </form>
    <div class="demo-box"><p>Tài khoản thử: khachhang / Admin</p><p>Mật khẩu: demo123</p></div>
  </main>
</div>
<script type="application/json" id="shopman-context"><%= request.getAttribute("shopmanContext") %></script><script src="assets/routes.js"></script><script src="assets/ui.js"></script>
<script>
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('change', event => { if (event.target.name === 'role') { loginForm.username.value = event.target.value === 'manager' ? 'Admin' : 'khachhang'; document.querySelector('#login-error').textContent = ''; } });
loginForm.addEventListener('submit', async event => {
  event.preventDefault(); const role = new FormData(loginForm).get('role');
  const expected = role === 'manager' ? 'Admin' : 'khachhang';
  if (loginForm.username.value.trim() !== expected || loginForm.password.value !== 'demo123') { document.querySelector('#login-error').textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.'; return; }
  try { await UI.auth.login(role, loginForm.username.value, loginForm.password.value); } catch (err) { document.querySelector('#login-error').textContent = err.message || 'Không thể đăng nhập. Vui lòng thử lại.'; }
});
</script>
</body></html>
