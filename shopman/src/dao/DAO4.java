package dao;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.*;
import java.time.LocalDate;
import java.time.DateTimeException;
import java.util.Properties;
import model.*;

/** Ket noi JDBC va anh xa dung chung; khong log thong tin xac thuc. */
public class DAO4 {
    /** Ket noi do caller cap se khong bi DAO dong. */
    protected Connection connection;
    public DAO4() {}
    public DAO4(Connection connection) {
        if (connection == null) throw new IllegalArgumentException("connection is required");
        this.connection = connection;
    }
    protected Connection openConnection() throws SQLException {
        if (connection != null) return connection;
        Properties config = new Properties();
        String file = setting("shopman.db.config", "SHOPMAN_DB_CONFIG");
        if (file != null) {
            try (InputStream stream = Files.newInputStream(Paths.get(file))) { config.load(stream); }
            catch (IOException e) { throw new SQLException("Cannot read external ShopMan DB configuration", "08001"); }
        }
        String url = value(config, "url", "shopman.jdbc.url", "SHOPMAN_JDBC_URL");
        if (url == null || !url.startsWith("jdbc:mysql:"))
            throw new SQLException("Set SHOPMAN_JDBC_URL (jdbc:mysql:...) or external url property", "08001");
        Properties credentials = new Properties();
        String user = value(config, "user", "shopman.jdbc.user", "SHOPMAN_JDBC_USER");
        String password = value(config, "password", "shopman.jdbc.password", "SHOPMAN_JDBC_PASSWORD");
        if (user != null) credentials.setProperty("user", user);
        if (password != null) credentials.setProperty("password", password);
        // Also register the driver when loaded from Tomcat WEB-INF/lib.
        try { Class.forName("com.mysql.cj.jdbc.Driver"); }
        catch (ClassNotFoundException ex) {
            throw new SQLException("MySQL Connector/J is missing from the runtime classpath", "08001");
        }
        return DriverManager.getConnection(url, credentials);
    }
    private static String setting(String property, String environment) {
        String value = System.getProperty(property);
        return value != null ? value : System.getenv(environment);
    }
    private static String value(Properties config, String key, String property, String env) {
        String override = setting(property, env);
        return override != null ? override : config.getProperty(key);
    }
    protected void releaseConnection(Connection opened) throws SQLException {
        if (opened != connection) opened.close();
    }
    protected static void validatePeriod(LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isAfter(end))
            throw new IllegalArgumentException("A valid startDate <= endDate is required");
        try { end.plusDays(1); }
        catch (DateTimeException ex) { throw new IllegalArgumentException("endDate is outside supported range", ex); }
    }
    protected static void validateId(int id) {
        if (id <= 0) throw new IllegalArgumentException("A positive record id is required");
    }
    protected static void bindPeriod(PreparedStatement statement, int index, LocalDate start, LocalDate end) throws SQLException {
        statement.setTimestamp(index, Timestamp.valueOf(start.atStartOfDay()));
        statement.setTimestamp(index + 1, Timestamp.valueOf(end.plusDays(1).atStartOfDay()));
    }
    protected static String deliveredStatus() {
        String value = setting("shopman.delivered.status", "SHOPMAN_DELIVERED_STATUS");
        return value == null ? "Đã giao" : value;
    }
    protected static String memberColumns(String alias, String prefix) {
        StringBuilder columns = new StringBuilder();
        for (String field : new String[]{"username", "fullName", "dateOfBirth", "address", "phoneNumber", "email", "role", "note"}) {
            if (columns.length() > 0) columns.append(", ");
            columns.append(alias).append('.').append(field).append(' ').append(prefix).append(field);
        }
        return columns.toString();
    }
    protected static final String PRODUCT_COLUMNS = "p.id product_id, p.productCode, p.productName, p.sellingPrice, p.stockQuantity, p.description product_description, p.imageUrl, p.unit";
    protected static final String PRODUCT_FROM = " FROM tblProduct4 p JOIN tblCategory4 cat ON cat.id = p.categoryId";
    protected static final String CUSTOMER_COLUMNS = "c.id customer_id, c.customerCode, c.defaultShippingAddress, c.loyaltyPoints, " + memberColumns("m", "customer_");
    protected static final String ORDER_SUMS = "(SELECT salesOrderId, SUM(quantity * unitPrice) orderAmount FROM tblSalesOrderDetail4 GROUP BY salesOrderId)";
    protected static final String ORDER_COLUMNS = "o.id order_id, o.orderCode, o.orderDate, o.status, o.shippingAddress, totals.orderAmount order_totalAmount, " + CUSTOMER_COLUMNS + ", s.id staff_id, s.employeeCode, s.workShift, " + memberColumns("sm", "staff_");
    protected static final String ORDER_FROM = " FROM tblSalesOrder4 o JOIN " + ORDER_SUMS + " totals ON totals.salesOrderId = o.id JOIN tblCustomer4 c ON c.id = o.customerId JOIN tblMember4 m ON m.id = c.id LEFT JOIN tblSalesStaff4 s ON s.id = o.salesStaffId LEFT JOIN tblMember4 sm ON sm.id = s.id";
    protected static final String PERIOD_FILTER = "o.status = ? AND o.orderDate >= ? AND o.orderDate < ?";
    protected static Product4 readProduct(ResultSet rs) throws SQLException {
        Product4 product = new Product4(rs.getInt("product_id"));
        product.setProductCode(rs.getString("productCode")); product.setProductName(rs.getString("productName"));
        product.setSellingPrice(rs.getBigDecimal("sellingPrice")); product.setStockQuantity(rs.getInt("stockQuantity"));
        product.setDescription(rs.getString("product_description")); product.setImageUrl(rs.getString("imageUrl")); product.setUnit(rs.getString("unit"));
        return product;
    }
    protected static void readMember(ResultSet rs, String prefix, Member4 member) throws SQLException {
        member.setUsername(rs.getString(prefix + "username")); member.setFullName(rs.getString(prefix + "fullName"));
        Date date = rs.getDate(prefix + "dateOfBirth"); member.setDateOfBirth(date == null ? null : date.toLocalDate());
        member.setAddress(rs.getString(prefix + "address")); member.setPhoneNumber(rs.getString(prefix + "phoneNumber"));
        member.setEmail(rs.getString(prefix + "email")); member.setRole(rs.getString(prefix + "role")); member.setNote(rs.getString(prefix + "note"));
    }
    protected static void readCustomer(ResultSet rs, Customer4 customer) throws SQLException {
        customer.setId(rs.getInt("customer_id")); readMember(rs, "customer_", customer);
        customer.setCustomerCode(rs.getString("customerCode")); customer.setDefaultShippingAddress(rs.getString("defaultShippingAddress")); customer.setLoyaltyPoints(rs.getInt("loyaltyPoints"));
    }
    protected static SalesOrder4 readOrder(ResultSet rs) throws SQLException {
        SalesOrder4 order = new SalesOrder4(rs.getInt("order_id")); order.setOrderCode(rs.getString("orderCode"));
        order.setOrderDate(rs.getTimestamp("orderDate").toLocalDateTime()); order.setStatus(rs.getString("status"));
        order.setShippingAddress(rs.getString("shippingAddress")); order.setTotalAmount(rs.getBigDecimal("order_totalAmount"));
        Customer4 customer = new Customer4(); readCustomer(rs, customer); order.setCustomer(customer);
        int staffId = rs.getInt("staff_id");
        if (!rs.wasNull()) {
            SalesStaff4 staff = new SalesStaff4(staffId); readMember(rs, "staff_", staff);
            staff.setEmployeeCode(rs.getString("employeeCode")); staff.setWorkShift(rs.getString("workShift")); order.setApprovedBy(staff);
        }
        return order;
    }
}
