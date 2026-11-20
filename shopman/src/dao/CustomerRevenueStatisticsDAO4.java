package dao;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import model.CustomerRevenueStatistics4;

public class CustomerRevenueStatisticsDAO4 extends DAO4 {
    public CustomerRevenueStatisticsDAO4() {}
    public CustomerRevenueStatisticsDAO4(Connection connection) { super(connection); }
    /** Tong hop tung hoa don truoc, nen hoa don nhieu dong chi duoc dem mot lan. */
    public CustomerRevenueStatistics4[] getCustomerRevenueStatistics(LocalDate startDate, LocalDate endDate) throws SQLException {
        validatePeriod(startDate, endDate);
        String sql = "SELECT " + CUSTOMER_COLUMNS + ", revenue.totalRevenue, revenue.orderCount FROM tblCustomer4 c JOIN tblMember4 m ON m.id = c.id JOIN (SELECT o.customerId, SUM(totals.orderAmount) totalRevenue, COUNT(*) orderCount FROM tblSalesOrder4 o JOIN " + ORDER_SUMS + " totals ON totals.salesOrderId = o.id WHERE " + PERIOD_FILTER + " GROUP BY o.customerId) revenue ON revenue.customerId = c.id ORDER BY revenue.totalRevenue DESC, c.id";
        Connection opened = openConnection();
        try (PreparedStatement ps = opened.prepareStatement(sql)) {
            ps.setString(1, deliveredStatus()); bindPeriod(ps, 2, startDate, endDate);
            try (ResultSet rs = ps.executeQuery()) {
                List<CustomerRevenueStatistics4> rows = new ArrayList<CustomerRevenueStatistics4>();
                while (rs.next()) {
                    CustomerRevenueStatistics4 row = new CustomerRevenueStatistics4(); readCustomer(rs, row);
                    row.setTotalRevenue(rs.getBigDecimal("totalRevenue")); row.setOrderCount(rs.getInt("orderCount")); rows.add(row);
                }
                return rows.toArray(new CustomerRevenueStatistics4[rows.size()]);
            }
        } finally { releaseConnection(opened); }
    }
}
