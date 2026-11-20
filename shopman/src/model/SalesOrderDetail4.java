package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class SalesOrderDetail4 {
    private int id;
    private String detailCode;
    private int quantity;
    private BigDecimal unitPrice = BigDecimal.ZERO;
    private Product4 product;

    public SalesOrderDetail4() {}
    public SalesOrderDetail4(int id) { this.id = id; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getDetailCode() { return detailCode; }
    public void setDetailCode(String detailCode) { this.detailCode = detailCode; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive"); this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { if (unitPrice == null || unitPrice.signum() < 0) throw new IllegalArgumentException("unitPrice must be non-negative"); this.unitPrice = unitPrice; }

    /** Thanh tien su dung don gia tai thoi diem giao dich. */
    public BigDecimal getLineTotal() { return unitPrice.multiply(BigDecimal.valueOf(quantity)); }

    public Product4 getProduct() { return product; }
    public void setProduct(Product4 product) { this.product = product; }

}
