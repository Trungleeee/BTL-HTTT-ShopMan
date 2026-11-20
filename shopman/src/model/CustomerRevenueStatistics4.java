package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class CustomerRevenueStatistics4 extends Customer4 {
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private int orderCount;

    public CustomerRevenueStatistics4() {}
    public CustomerRevenueStatistics4(int id) { setId(id); }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { if (totalRevenue == null || totalRevenue.signum() < 0) throw new IllegalArgumentException("totalRevenue must be non-negative"); this.totalRevenue = totalRevenue; }

    public int getOrderCount() { return orderCount; }
    public void setOrderCount(int orderCount) { if (orderCount < 0) throw new IllegalArgumentException("orderCount must be non-negative"); this.orderCount = orderCount; }

}
