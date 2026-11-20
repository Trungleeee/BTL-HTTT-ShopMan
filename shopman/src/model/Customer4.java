package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class Customer4 extends Member4 {
    private String customerCode;
    private String defaultShippingAddress;
    private int loyaltyPoints;

    public Customer4() {}
    public Customer4(int id) { setId(id); }

    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }

    public String getDefaultShippingAddress() { return defaultShippingAddress; }
    public void setDefaultShippingAddress(String defaultShippingAddress) { this.defaultShippingAddress = defaultShippingAddress; }

    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { if (loyaltyPoints < 0) throw new IllegalArgumentException("loyaltyPoints must be non-negative"); this.loyaltyPoints = loyaltyPoints; }

}
