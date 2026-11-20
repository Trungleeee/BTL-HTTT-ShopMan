package dao;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import model.SalesOrderDetail4;

public class SalesOrderDetailDAO4 extends DAO4 {
    public SalesOrderDetailDAO4() {}
    public SalesOrderDetailDAO4(Connection connection) { super(connection); }
    /** Caller phai kiem tra ngu canh hoa don truoc khi goi phuong thuc nay. */
    public SalesOrderDetail4[] getOrderDetails(int orderId) throws SQLException {
        validateId(orderId);
        Connection opened = openConnection();
        try (PreparedStatement ps = opened.prepareStatement("SELECT d.id detail_id, d.detailCode, d.quantity, d.unitPrice, " + PRODUCT_COLUMNS + " FROM tblSalesOrderDetail4 d JOIN tblProduct4 p ON p.id = d.productId JOIN tblCategory4 cat ON cat.id = p.categoryId WHERE d.salesOrderId = ? ORDER BY d.id")) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                List<SalesOrderDetail4> details = new ArrayList<SalesOrderDetail4>();
                while (rs.next()) {
                    SalesOrderDetail4 detail = new SalesOrderDetail4(rs.getInt("detail_id"));
                    detail.setDetailCode(rs.getString("detailCode")); detail.setQuantity(rs.getInt("quantity"));
                    detail.setUnitPrice(rs.getBigDecimal("unitPrice")); detail.setProduct(readProduct(rs)); details.add(detail);
                }
                return details.toArray(new SalesOrderDetail4[details.size()]);
            }
        } finally { releaseConnection(opened); }
    }
}
