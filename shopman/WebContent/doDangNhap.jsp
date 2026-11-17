<%@ page contentType="application/json; charset=UTF-8" pageEncoding="UTF-8" import="java.util.*" %>
<%
request.setCharacterEncoding("UTF-8");
response.setHeader("Cache-Control", "no-store");
response.setHeader("Referrer-Policy", "no-referrer");
response.setHeader("X-Content-Type-Options", "nosniff");
if (!"POST".equals(request.getMethod())) { response.setStatus(405); response.setHeader("Allow", "POST"); out.print("{}"); return; }
java.net.URL address = new java.net.URL(request.getRequestURL().toString());
if (!(address.getProtocol() + "://" + address.getAuthority()).equals(request.getHeader("Origin"))) { response.setStatus(403); out.print("{}"); return; }
if ("logout".equals(request.getParameter("action"))) {
    jakarta.servlet.http.HttpSession currentSession = request.getSession(false);
    if (currentSession != null) currentSession.invalidate();
    out.print("{\"ok\":true}"); return;
}
String role = request.getParameter("role");
String expected = "manager".equals(role) ? "Admin" : "customer".equals(role) ? "khachhang" : null;
if (expected == null || !expected.equals(request.getParameter("username")) || !"demo123".equals(request.getParameter("password"))) {
    response.setStatus(401); out.print("{\"error\":\"Tên đăng nhập hoặc mật khẩu không đúng.\"}"); return;
}
jakarta.servlet.http.HttpSession previous = request.getSession(false);
if (previous != null) previous.invalidate();
jakarta.servlet.http.HttpSession newSession = request.getSession(true);
Map<String, String> user = new LinkedHashMap<String, String>();
user.put("role", role);
user.put("fullName", "manager".equals(role) ? "Admin" : "Nguyễn Văn A");
user.put("code", "manager".equals(role) ? "QL001" : "KH001");
newSession.setAttribute("shopmanUser", user);
out.print("{\"ok\":true}");
%>
