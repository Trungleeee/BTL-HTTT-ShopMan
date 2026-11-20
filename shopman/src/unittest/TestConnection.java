package unittest;

import dao.ProductDAO4;
import model.Product4;

public class TestConnection {
    public static void main(String[] args) throws Exception {
        System.setProperty(
            "shopman.db.config",
            "D:/Nam4/Kì 1/PTVTKHTTT/BTL/shopman/db.properties"
        );

        Product4[] products =
            new ProductDAO4().getProductsByKeyword("Lenovo");

        System.out.println("Kết nối MySQL thành công!");

        for (Product4 product : products) {
            System.out.println(
                product.getProductCode() + " - "
                + product.getProductName()
            );
        }
    }
}