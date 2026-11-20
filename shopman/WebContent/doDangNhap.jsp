<%@ page session="false" isELIgnored="true" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8" import="java.util.*,java.sql.SQLException,java.security.GeneralSecurityException,dao.MemberDAO4,model.Member4,model.Manager4,model.Customer4" %>
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
Member4 member;
try {
    member = new MemberDAO4().authenticate(request.getParameter("username"), request.getParameter("password"));
} catch (SQLException error) {
    application.log("ShopMan login database error (SQLState " + error.getSQLState() + ").");
    response.setStatus(503); out.print("{\"error\":\"Không thể đăng nhập lúc này. Vui lòng thử lại.\"}"); return;
} catch (GeneralSecurityException error) {
    application.log("ShopMan could not verify the password hash.", error);
    response.setStatus(500); out.print("{\"error\":\"Không thể đăng nhập lúc này. Vui lòng thử lại.\"}"); return;
}
if (member == null) {
    response.setStatus(401); out.print("{\"error\":\"Tên đăng nhập hoặc mật khẩu không đúng.\"}"); return;
}
jakarta.servlet.http.HttpSession previous = request.getSession(false);
if (previous != null) previous.invalidate();
jakarta.servlet.http.HttpSession newSession = request.getSession(true);
Map<String, String> user = new LinkedHashMap<String, String>();
user.put("role", member.getRole());
user.put("fullName", member.getFullName());
user.put("code", member instanceof Manager4 ? ((Manager4) member).getEmployeeCode() : ((Customer4) member).getCustomerCode());
newSession.setAttribute("shopmanUser", user);
out.print("{\"ok\":true,\"user\":{\"role\":\"" + member.getRole() + "\"}}");
%>
