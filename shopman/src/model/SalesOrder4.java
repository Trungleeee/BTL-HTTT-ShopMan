package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class SalesOrder4 {
    private int id;
    private String orderCode;
    private LocalDateTime orderDate;
    private String status;
    private String shippingAddress;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private Customer4 customer;
    private SalesStaff4 approvedBy;
    private List<SalesOrderDetail4> details;

    public SalesOrder4() {}
    public SalesOrder4(int id) { this.id = id; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    /** Tinh tu chi tiet da tai; neu chua tai chi tiet thi dung tong truy van. */
    public BigDecimal getTotalAmount() {
        if (details == null) return totalAmount;
        BigDecimal sum = BigDecimal.ZERO;
        for (SalesOrderDetail4 detail : details) sum = sum.add(detail.getLineTotal());
        return sum;
    }
    public void setTotalAmount(BigDecimal totalAmount) { if (totalAmount == null || totalAmount.signum() < 0) throw new IllegalArgumentException("totalAmount must be non-negative"); this.totalAmount = totalAmount; }

    public Customer4 getCustomer() { return customer; }
    public void setCustomer(Customer4 customer) { this.customer = customer; }

    public SalesStaff4 getApprovedBy() { return approvedBy; }
    public void setApprovedBy(SalesStaff4 approvedBy) { this.approvedBy = approvedBy; }

    public List<SalesOrderDetail4> getDetails() { return details; }
    public void setDetails(List<SalesOrderDetail4> details) { this.details = details; }

}
