CREATE TABLE tblMember4 (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    dateOfBirth DATE,
    address VARCHAR(255),
    phoneNumber VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(30) NOT NULL,
    note TEXT,

    PRIMARY KEY (id),
    CONSTRAINT uq_member_username UNIQUE (username)
);

CREATE TABLE tblManager4 (
    id INT NOT NULL,
    employeeCode VARCHAR(30) NOT NULL,
    position VARCHAR(100),

    PRIMARY KEY (id),
    CONSTRAINT uq_manager_code UNIQUE (employeeCode),
    CONSTRAINT fk_manager_member
        FOREIGN KEY (id) REFERENCES tblMember4(id)
);

CREATE TABLE tblSalesStaff4 (
    id INT NOT NULL,
    employeeCode VARCHAR(30) NOT NULL,
    workShift VARCHAR(50),

    PRIMARY KEY (id),
    CONSTRAINT uq_salesstaff_code UNIQUE (employeeCode),
    CONSTRAINT fk_salesstaff_member
        FOREIGN KEY (id) REFERENCES tblMember4(id)
);

CREATE TABLE tblCustomer4 (
    id INT NOT NULL,
    customerCode VARCHAR(30) NOT NULL,
    defaultShippingAddress VARCHAR(255),
    loyaltyPoints INT NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT uq_customer_code UNIQUE (customerCode),
    CONSTRAINT ck_customer_points CHECK (loyaltyPoints >= 0),
    CONSTRAINT fk_customer_member
        FOREIGN KEY (id) REFERENCES tblMember4(id)
);

CREATE TABLE tblCategory4 (
    id INT NOT NULL AUTO_INCREMENT,
    categoryCode VARCHAR(30) NOT NULL,
    categoryName VARCHAR(100) NOT NULL,
    description TEXT,

    PRIMARY KEY (id),
    CONSTRAINT uq_category_code UNIQUE (categoryCode)
);

CREATE TABLE tblProduct4 (
    id INT NOT NULL AUTO_INCREMENT,
    productCode VARCHAR(30) NOT NULL,
    productName VARCHAR(150) NOT NULL,
    sellingPrice DECIMAL(18,2) NOT NULL,
    stockQuantity INT NOT NULL DEFAULT 0,
    description TEXT,
    imageUrl VARCHAR(500),
    unit VARCHAR(30) NOT NULL,
    categoryId INT NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT uq_product_code UNIQUE (productCode),
    CONSTRAINT ck_product_price CHECK (sellingPrice >= 0),
    CONSTRAINT ck_product_stock CHECK (stockQuantity >= 0),
    CONSTRAINT fk_product_category
        FOREIGN KEY (categoryId) REFERENCES tblCategory4(id)
);

CREATE TABLE tblSupplier4 (
    id INT NOT NULL AUTO_INCREMENT,
    supplierCode VARCHAR(30) NOT NULL,
    supplierName VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phoneNumber VARCHAR(20),
    email VARCHAR(100),
    note TEXT,

    PRIMARY KEY (id),
    CONSTRAINT uq_supplier_code UNIQUE (supplierCode)
);

CREATE TABLE tblShoppingCart4 (
    id INT NOT NULL AUTO_INCREMENT,
    customerId INT NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT uq_cart_customer UNIQUE (customerId),
    CONSTRAINT fk_cart_customer
        FOREIGN KEY (customerId) REFERENCES tblCustomer4(id)
);

CREATE TABLE tblCartItem4 (
    id INT NOT NULL AUTO_INCREMENT,
    quantity INT NOT NULL,
    shoppingCartId INT NOT NULL,
    productId INT NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT uq_cartitem_product
        UNIQUE (shoppingCartId, productId),
    CONSTRAINT ck_cartitem_quantity CHECK (quantity > 0),
    CONSTRAINT fk_cartitem_cart
        FOREIGN KEY (shoppingCartId)
        REFERENCES tblShoppingCart4(id),
    CONSTRAINT fk_cartitem_product
        FOREIGN KEY (productId) REFERENCES tblProduct4(id)
);

CREATE TABLE tblSalesOrder4 (
    id INT NOT NULL AUTO_INCREMENT,
    orderCode VARCHAR(30) NOT NULL,
    orderDate DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL,
    shippingAddress VARCHAR(255) NOT NULL,
    customerId INT NOT NULL,
    salesStaffId INT,

    PRIMARY KEY (id),
    CONSTRAINT uq_order_code UNIQUE (orderCode),
    CONSTRAINT fk_order_customer
        FOREIGN KEY (customerId) REFERENCES tblCustomer4(id),
    CONSTRAINT fk_order_salesstaff
        FOREIGN KEY (salesStaffId) REFERENCES tblSalesStaff4(id)
);

CREATE TABLE tblSalesOrderDetail4 (
    id INT NOT NULL AUTO_INCREMENT,
    quantity INT NOT NULL,
    unitPrice DECIMAL(18,2) NOT NULL,
    salesOrderId INT NOT NULL,
    productId INT NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT ck_orderdetail_quantity CHECK (quantity > 0),
    CONSTRAINT ck_orderdetail_price CHECK (unitPrice >= 0),
    CONSTRAINT fk_orderdetail_order
        FOREIGN KEY (salesOrderId) REFERENCES tblSalesOrder4(id),
    CONSTRAINT fk_orderdetail_product
        FOREIGN KEY (productId) REFERENCES tblProduct4(id)
);

CREATE TABLE tblImportInvoice4 (
    id INT NOT NULL AUTO_INCREMENT,
    invoiceNumber VARCHAR(30) NOT NULL,
    importDate DATETIME NOT NULL,
    supplierId INT NOT NULL,
    managerId INT NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT uq_import_number UNIQUE (invoiceNumber),
    CONSTRAINT fk_import_supplier
        FOREIGN KEY (supplierId) REFERENCES tblSupplier4(id),
    CONSTRAINT fk_import_manager
        FOREIGN KEY (managerId) REFERENCES tblManager4(id)
);

CREATE TABLE tblImportInvoiceDetail4 (
    id INT NOT NULL AUTO_INCREMENT,
    quantity INT NOT NULL,
    importPrice DECIMAL(18,2) NOT NULL,
    importInvoiceId INT NOT NULL,
    productId INT NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT ck_importdetail_quantity CHECK (quantity > 0),
    CONSTRAINT ck_importdetail_price CHECK (importPrice >= 0),
    CONSTRAINT fk_importdetail_invoice
        FOREIGN KEY (importInvoiceId) REFERENCES tblImportInvoice4(id),
    CONSTRAINT fk_importdetail_product
        FOREIGN KEY (productId) REFERENCES tblProduct4(id)
);