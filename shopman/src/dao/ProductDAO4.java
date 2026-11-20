package dao;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import model.Product4;

public class ProductDAO4 extends DAO4 {
    public ProductDAO4() {}
    public ProductDAO4(Connection connection) { super(connection); }
    /** Tim chuoi con; tu khoa rong tra tat ca mat hang. */
    public Product4[] getProductsByKeyword(String keyword) throws SQLException {
        String escaped = (keyword == null ? "" : keyword.trim()).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        Connection opened = openConnection();
        try (PreparedStatement ps = opened.prepareStatement("SELECT " + PRODUCT_COLUMNS + PRODUCT_FROM + " WHERE p.productName LIKE ? ESCAPE '!' ORDER BY p.id")) {
            ps.setString(1, "%" + escaped + "%");
            try (ResultSet rs = ps.executeQuery()) {
                List<Product4> products = new ArrayList<Product4>();
                while (rs.next()) products.add(readProduct(rs));
                return products.toArray(new Product4[products.size()]);
            }
        } finally { releaseConnection(opened); }
    }
    public Product4 getProductById(int productId) throws SQLException {
        validateId(productId);
        Connection opened = openConnection();
        try (PreparedStatement ps = opened.prepareStatement("SELECT " + PRODUCT_COLUMNS + PRODUCT_FROM + " WHERE p.id = ?")) {
            ps.setInt(1, productId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? readProduct(rs) : null; }
        } finally { releaseConnection(opened); }
    }
}
