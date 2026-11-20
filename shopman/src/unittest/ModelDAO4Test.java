package unittest;

import dao.*;
import model.*;
import org.junit.Test;
import static org.junit.Assert.*;
import java.math.BigDecimal;
import java.lang.reflect.Proxy;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;

/** Unit tests only: JDBC doubles do not claim to validate a live MySQL database. */
public class ModelDAO4Test {
    private static BigDecimal money(String value) { return new BigDecimal(value); }
    private static final LocalDate START = LocalDate.of(2026, 9, 1);
    private static final LocalDate END = LocalDate.of(2026, 9, 30);

    @Test public void salesTotalUsesTransactionPriceAndReflectsLoadedDetails() {
        Product4 product = new Product4(); product.setSellingPrice(money("15000000"));
        SalesOrderDetail4 detail = new SalesOrderDetail4(); detail.setProduct(product); detail.setQuantity(2); detail.setUnitPrice(money("12500000"));
        SalesOrder4 order = new SalesOrder4(); order.setTotalAmount(money("999"));
        assertEquals(0, money("999").compareTo(order.getTotalAmount()));
        order.setDetails(Arrays.asList(detail));
        assertEquals(0, money("25000000").compareTo(order.getTotalAmount()));
        detail.setQuantity(3);
        assertEquals(0, money("37500000").compareTo(order.getTotalAmount()));
    }
    @Test public void importTotalUsesImportPrice() {
        ImportInvoiceDetail4 detail = new ImportInvoiceDetail4(); detail.setQuantity(3); detail.setImportPrice(money("12.50"));
        ImportInvoice4 invoice = new ImportInvoice4(); invoice.setDetails(Arrays.asList(detail));
        assertEquals(0, money("37.50").compareTo(invoice.getTotalAmount()));
    }
    @Test public void statisticsInheritsCustomerIdentity() {
        CustomerRevenueStatistics4 row = new CustomerRevenueStatistics4(7); row.setCustomerCode("KH007"); row.setFullName("Customer");
        assertEquals(7, row.getId()); assertEquals("KH007", row.getCustomerCode()); assertTrue(row instanceof Member4);
    }
    @Test public void emptyKeywordsLoadProducts() throws Exception {
        for (String keyword : new String[]{null, "", "   "}) {
            JdbcFixture jdbc = new JdbcFixture(product());
            Product4[] rows = new ProductDAO4(jdbc.connection()).getProductsByKeyword(keyword);
            assertEquals(1, rows.length);
            assertEquals("SP001", rows[0].getProductCode());
            assertEquals("%%", jdbc.parameters.get(1));
        }
    }
    @Test public void productSearchBindsLiteralWildcardsAndMapsProduct() throws Exception {
        JdbcFixture jdbc = new JdbcFixture(product());
        Product4[] rows = new ProductDAO4(jdbc.connection()).getProductsByKeyword("  100%_!  ");
        assertEquals(1, rows.length); assertEquals("Laptop", rows[0].getProductName());
        assertEquals("%100!%!_!!%", jdbc.parameters.get(1)); assertTrue(jdbc.sql.contains("LIKE ? ESCAPE '!'"));
        assertEquals(0, jdbc.connectionCloses); assertEquals(1, jdbc.statementCloses); assertEquals(1, jdbc.resultCloses);
    }
    @Test public void missingRowsHaveEmptyListAndNullDetail() throws Exception {
        JdbcFixture jdbc = new JdbcFixture(); ProductDAO4 dao = new ProductDAO4(jdbc.connection());
        assertEquals(0, dao.getProductsByKeyword("missing").length); assertNull(dao.getProductById(999));
        assertEquals(0, new SalesOrderDetailDAO4(jdbc.connection()).getOrderDetails(999).length);
    }
    @Test public void revenuePeriodIncludesAllOfEndDay() throws Exception {
        Map<String,Object> row = customer(); row.put("totalRevenue", money("45000000")); row.put("orderCount",3);
        JdbcFixture jdbc = new JdbcFixture(row);
        CustomerRevenueStatistics4[] rows = new CustomerRevenueStatisticsDAO4(jdbc.connection()).getCustomerRevenueStatistics(START, END);
        assertEquals(3,rows[0].getOrderCount()); assertEquals(0,money("45000000").compareTo(rows[0].getTotalRevenue()));
        assertEquals("Đã giao",jdbc.parameters.get(1));
        assertEquals(Timestamp.valueOf("2026-09-01 00:00:00"),jdbc.parameters.get(2));
        assertEquals(Timestamp.valueOf("2026-10-01 00:00:00"),jdbc.parameters.get(3));
        assertTrue(jdbc.sql.contains("COUNT(*) orderCount")); assertTrue(jdbc.sql.contains("GROUP BY salesOrderId"));
        assertTrue(jdbc.sql.contains("ORDER BY revenue.totalRevenue DESC"));
    }
    @Test public void historyRetainsAggregateWithoutLoadedDetailsAndAllowsNullApprover() throws Exception {
        JdbcFixture jdbc = new JdbcFixture(order());
        SalesOrder4[] orders = new SalesOrderDAO4(jdbc.connection()).getOrdersByCustomer(1, START, END);
        assertEquals(1, orders.length); assertNull(orders[0].getDetails()); assertNull(orders[0].getApprovedBy());
        assertEquals(0, money("25000000").compareTo(orders[0].getTotalAmount()));
        assertEquals(1,jdbc.parameters.get(1)); assertEquals("Đã giao",jdbc.parameters.get(2));
        assertEquals(Timestamp.valueOf("2026-10-01 00:00:00"),jdbc.parameters.get(4));
    }
    @Test public void missingHistoryStillBindsCustomerAndPeriod() throws Exception {
        JdbcFixture jdbc = new JdbcFixture();
        assertEquals(0,new SalesOrderDAO4(jdbc.connection()).getOrdersByCustomer(2,START,END).length);
        assertEquals(2,jdbc.parameters.get(1));
        assertTrue(jdbc.sql.contains("o.customerId = ? AND o.status = ?"));
        assertEquals(Timestamp.valueOf("2026-10-01 00:00:00"),jdbc.parameters.get(4));
    }
    @Test public void invoiceDetailUsesHistoricalUnitPrice() throws Exception {
        Map<String,Object> row=product(); row.put("detail_id",1); row.put("detailCode","D1"); row.put("quantity",2); row.put("unitPrice",money("12500000"));
        JdbcFixture jdbc=new JdbcFixture(row);
        SalesOrderDetail4[] details=new SalesOrderDetailDAO4(jdbc.connection()).getOrderDetails(17);
        assertEquals(0,money("25000000").compareTo(details[0].getLineTotal()));
        assertEquals(17,jdbc.parameters.get(1)); assertEquals("Laptop",details[0].getProduct().getProductName());
    }
    @Test public void invalidPeriodAndIdsAreRejectedBeforeQuery() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> new CustomerRevenueStatisticsDAO4().getCustomerRevenueStatistics(null,END));
        assertThrows(IllegalArgumentException.class, () -> new SalesOrderDAO4().getOrdersByCustomer(1,END,START));
        assertThrows(IllegalArgumentException.class, () -> new SalesOrderDetailDAO4().getOrderDetails(0));
        assertThrows(IllegalArgumentException.class, () -> new ProductDAO4().getProductById(-1));
    }
    @Test public void queryFailureIsNotReportedAsAnEmptyResult() throws Exception {
        JdbcFixture jdbc=new JdbcFixture(); jdbc.failQuery=true;
        assertThrows(SQLException.class, () -> new ProductDAO4(jdbc.connection()).getProductsByKeyword("laptop"));
        assertEquals(1,jdbc.statementCloses); assertEquals(0,jdbc.connectionCloses);
    }
    private static Map<String,Object> product() {
        Map<String,Object> row=new HashMap<String,Object>();
        row.put("product_id",1); row.put("productCode","SP001"); row.put("productName","Laptop"); row.put("sellingPrice",money("15000000")); row.put("stockQuantity",50); row.put("unit","Chiếc");
        return row;
    }
    private static Map<String,Object> customer() {
        Map<String,Object> row=new HashMap<String,Object>(); row.put("customer_id",1); row.put("customerCode","KH001"); row.put("loyaltyPoints",0); row.put("customer_fullName","Customer"); return row;
    }
    private static Map<String,Object> order() {
        Map<String,Object> row=customer(); row.put("order_id",17); row.put("orderCode","DH017"); row.put("orderDate",Timestamp.valueOf("2026-09-30 23:59:59")); row.put("status","Đã giao"); row.put("order_totalAmount",money("25000000")); return row;
    }
    private static final class JdbcFixture {
        final List<Map<String,Object>> rows; final Map<Integer,Object> parameters=new HashMap<Integer,Object>();
        String sql; int connectionCloses,statementCloses,resultCloses; boolean failQuery;
        @SafeVarargs JdbcFixture(Map<String,Object>... rows) { this.rows=Arrays.asList(rows); }
        Connection connection() {
            return (Connection)Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[]{Connection.class}, (proxy, method, args) -> {
                if (method.getName().equals("prepareStatement")) { sql=(String)args[0]; parameters.clear(); return statement(); }
                if (method.getName().equals("close")) { connectionCloses++; return null; }
                if (method.getName().equals("isClosed")) return false;
                throw new UnsupportedOperationException(method.getName());
            });
        }
        PreparedStatement statement() {
            return (PreparedStatement)Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[]{PreparedStatement.class}, (proxy, method, args) -> {
                if (method.getName().startsWith("set")) { parameters.put((Integer)args[0],args[1]); return null; }
                if (method.getName().equals("executeQuery")) { if(failQuery)throw new SQLException("Test query failure"); return result(); }
                if (method.getName().equals("close")) { statementCloses++; return null; }
                throw new UnsupportedOperationException(method.getName());
            });
        }
        ResultSet result() {
            final int[] index={-1}; final boolean[] wasNull={false};
            return (ResultSet)Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[]{ResultSet.class}, (proxy, method, args) -> {
                String name=method.getName();
                if(name.equals("next"))return ++index[0]<rows.size();
                if(name.equals("close")){resultCloses++;return null;}
                if(name.equals("wasNull"))return wasNull[0];
                Object value=rows.get(index[0]).get(args[0]); wasNull[0]=value==null;
                if(name.equals("getInt"))return value==null?0:((Number)value).intValue();
                if(name.equals("getString"))return value==null?null:value.toString();
                if(name.equals("getBigDecimal")||name.equals("getDate")||name.equals("getTimestamp"))return value;
                throw new UnsupportedOperationException(name);
            });
        }
    }
}
