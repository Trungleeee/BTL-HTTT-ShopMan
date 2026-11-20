package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class CartItem4 {
    private int id;
    private int quantity;
    private Product4 product;

    public CartItem4() {}
    public CartItem4(int id) { this.id = id; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { if (quantity < 0) throw new IllegalArgumentException("quantity must be non-negative"); this.quantity = quantity; }

    public Product4 getProduct() { return product; }
    public void setProduct(Product4 product) { this.product = product; }

}
