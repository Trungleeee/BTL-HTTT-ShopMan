package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class Product4 {
    private int id;
    private String productCode;
    private String productName;
    private BigDecimal sellingPrice = BigDecimal.ZERO;
    private int stockQuantity;
    private String description;
    private String imageUrl;
    private String unit;

    public Product4() {}
    public Product4(int id) { this.id = id; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { if (sellingPrice == null || sellingPrice.signum() < 0) throw new IllegalArgumentException("sellingPrice must be non-negative"); this.sellingPrice = sellingPrice; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { if (stockQuantity < 0) throw new IllegalArgumentException("stockQuantity must be non-negative"); this.stockQuantity = stockQuantity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }


}
