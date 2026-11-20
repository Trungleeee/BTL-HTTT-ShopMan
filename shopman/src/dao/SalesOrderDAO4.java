package dao;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.TreeMap;
import java.math.BigDecimal;
import java.time.YearMonth;
import model.SalesOrder4;

public class SalesOrderDAO4 extends DAO4 {
    public SalesOrderDAO4() {}
    public SalesOrderDAO4(Connection connection) { super(connection); }
    /** Du lieu tong hop dashboard, khong tao them lop thuc the. */
    public Map<String, Object> getStoreOverview() throws SQLException {
        String sql = "SELECT DATE_FORMAT(o.orderDate, '%Y-%m') orderMonth, o.status, COUNT(*) orderCount, COALESCE(SUM(totals.orderAmount), 0) revenue FROM tblSalesOrder4 o LEFT JOIN "
            + ORDER_SUMS + " totals ON totals.salesOrderId = o.id GROUP BY DATE_FORMAT(o.orderDate, '%Y-%m'), o.status ORDER BY orderMonth";
        Connection opened = openConnection();
        try (PreparedStatement ps = opened.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            BigDecimal revenue = BigDecimal.ZERO;
            long total = 0, shipping = 0, cancelled = 0;
            TreeMap<String, BigDecimal> months = new TreeMap<String, BigDecimal>();
            while (rs.next()) {
                String month = rs.getString("orderMonth"), status = rs.getString("status");
                long count = rs.getLong("orderCount");
                total += count;
                if (!months.containsKey(month)) months.put(month, BigDecimal.ZERO);
                if (deliveredStatus().equals(status)) {
                    BigDecimal amount = rs.getBigDecimal("revenue");
                    revenue = revenue.add(amount); months.put(month, months.get(month).add(amount));
                }
                if ("Đang giao".equals(status)) shipping += count;
                if ("Đã hủy".equals(status)) cancelled += count;
            }
            List<Map<String, Object>> trend = new ArrayList<Map<String, Object>>();
            if (!months.isEmpty()) {
                YearMonth last = YearMonth.parse(months.lastKey());
                for (YearMonth current = YearMonth.parse(months.firstKey()); !current.isAfter(last); current = current.plusMonths(1)) {
                    Map<String, Object> row = new LinkedHashMap<String, Object>();
                    row.put("month", current.toString());
                    row.put("revenue", months.containsKey(current.toString()) ? months.get(current.toString()) : BigDecimal.ZERO);
                    trend.add(row);
                }
            }
            Map<String, Object> result = new LinkedHashMap<String, Object>();
            result.put("totalRevenue", revenue); result.put("totalOrders", total);
            result.put("shippingOrders", shipping); result.put("cancelledOrders", cancelled);
            result.put("monthlyRevenue", trend);
            return result;
        } finally { releaseConnection(opened); }
    }
    public SalesOrder4[] getOrdersByCustomer(int customerId, LocalDate startDate, LocalDate endDate) throws SQLException {
        validateId(customerId); validatePeriod(startDate, endDate);
        Connection opened = openConnection();
        try (PreparedStatement ps = opened.prepareStatement("SELECT " + ORDER_COLUMNS + ORDER_FROM + " WHERE o.customerId = ? AND " + PERIOD_FILTER + " ORDER BY o.orderDate DESC, o.id DESC")) {
            ps.setInt(1, customerId); ps.setString(2, deliveredStatus()); bindPeriod(ps, 3, startDate, endDate);
            try (ResultSet rs = ps.executeQuery()) {
                List<SalesOrder4> orders = new ArrayList<SalesOrder4>();
                while (rs.next()) orders.add(readOrder(rs));
                return orders.toArray(new SalesOrder4[orders.size()]);
            }
        } finally { releaseConnection(opened); }
    }
}
