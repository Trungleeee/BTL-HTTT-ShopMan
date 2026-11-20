package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class ShoppingCart4 {
    private int id;
    private String cartCode;
    private Customer4 customer;
    private List<CartItem4> items;

    public ShoppingCart4() {}
    public ShoppingCart4(int id) { this.id = id; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCartCode() { return cartCode; }
    public void setCartCode(String cartCode) { this.cartCode = cartCode; }

    public Customer4 getCustomer() { return customer; }
    public void setCustomer(Customer4 customer) { this.customer = customer; }

    public List<CartItem4> getItems() { return items; }
    public void setItems(List<CartItem4> items) { this.items = items; }

}
