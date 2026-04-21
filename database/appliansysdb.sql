CREATE DATABASE IF NOT EXISTS appliansys_db;
USE appliansys_db;

CREATE TABLE `USER` (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    fname          VARCHAR(100) NOT NULL,
    mname          VARCHAR(100),
    lname          VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    contact_num    VARCHAR(30),
    status         VARCHAR(50),
    created_at     DATETIME,
    last_login     DATETIME,
    user_type      VARCHAR(20) NOT NULL
);

CREATE TABLE CUSTOMER_USER (
    user_id        INT PRIMARY KEY,
    street         VARCHAR(255),
    barangay       VARCHAR(255),
    city           VARCHAR(100),
    province       VARCHAR(100),
    CONSTRAINT fk_customer_user_user
        FOREIGN KEY (user_id) REFERENCES `USER`(user_id)
);

CREATE TABLE STAFF_USER (
    user_id        INT PRIMARY KEY,
    role_type      VARCHAR(50) NOT NULL,
    CONSTRAINT fk_staff_user_user
        FOREIGN KEY (user_id) REFERENCES `USER`(user_id)
);

CREATE TABLE CATEGORY (
    category_id            INT AUTO_INCREMENT PRIMARY KEY,
    category_name          VARCHAR(100) NOT NULL,
    category_description   TEXT
);

CREATE TABLE SUBCATEGORY (
    subcategory_id           INT AUTO_INCREMENT PRIMARY KEY,
    category_id              INT NOT NULL,
    subcategory_name         VARCHAR(100) NOT NULL,
    subcategory_description  TEXT,
    CONSTRAINT fk_subcategory_category
        FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id)
);

CREATE TABLE SUB_SUBCATEGORY (
    subcategory_id               INT NOT NULL,
    sub_subcategory_id           INT NOT NULL AUTO_INCREMENT,
    sub_subcategory_name         VARCHAR(100) NOT NULL,
    sub_subcategory_description  TEXT,
    PRIMARY KEY (subcategory_id, sub_subcategory_id),
    CONSTRAINT uq_sub_subcategory_id UNIQUE (sub_subcategory_id),
    CONSTRAINT fk_sub_subcategory_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES SUBCATEGORY(subcategory_id)
);

CREATE TABLE PRODUCT (
    product_id             INT AUTO_INCREMENT PRIMARY KEY,
    subcategory_id         INT NOT NULL,
    sub_subcategory_id     INT NULL,
    product_name           VARCHAR(150) NOT NULL,
    product_description    TEXT,
    price                  DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_product_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES SUBCATEGORY(subcategory_id),

    CONSTRAINT fk_product_sub_subcategory
        FOREIGN KEY (subcategory_id, sub_subcategory_id)
        REFERENCES SUB_SUBCATEGORY(subcategory_id, sub_subcategory_id)
);

CREATE TABLE INVENTORY (
    inventory_id     INT AUTO_INCREMENT PRIMARY KEY,
    product_id       INT NOT NULL,
    stock_quantity   INT NOT NULL,
    status           VARCHAR(50),
    last_updated     DATETIME,
    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id)
);

CREATE TABLE CART (
    cart_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    CONSTRAINT fk_cart_customer_user
        FOREIGN KEY (user_id) REFERENCES CUSTOMER_USER(user_id)
);

CREATE TABLE CART_ITEM (
    cart_id         INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (cart_id, product_id),
    CONSTRAINT fk_cart_item_cart
        FOREIGN KEY (cart_id) REFERENCES CART(cart_id),
    CONSTRAINT fk_cart_item_product
        FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id)
);

CREATE TABLE PROMO (
    promo_id         INT AUTO_INCREMENT PRIMARY KEY,
    promo_code       VARCHAR(100) NOT NULL,
    description      TEXT,
    discount_type    VARCHAR(50),
    discount_value   DECIMAL(10,2),
    start_date       DATE,
    end_date         DATE,
    status           VARCHAR(50)
);

CREATE TABLE PAYMENT_DETAILS (
    payment_id        INT AUTO_INCREMENT PRIMARY KEY,
    payment_amount    DECIMAL(10,2) NOT NULL,
    payment_method    VARCHAR(50) NOT NULL,
    payment_date      DATETIME,
    payment_status    VARCHAR(50)
);

CREATE TABLE `ORDER` (
    order_id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    promo_id          INT,
    payment_id        INT,
    order_date        DATETIME,
    total_amount      DECIMAL(10,2) NOT NULL,
    order_status      VARCHAR(50),
    delivery_method   VARCHAR(20),
    CONSTRAINT fk_order_customer_user
        FOREIGN KEY (user_id) REFERENCES CUSTOMER_USER(user_id),
    CONSTRAINT fk_order_promo
        FOREIGN KEY (promo_id) REFERENCES PROMO(promo_id),
    CONSTRAINT fk_order_payment
        FOREIGN KEY (payment_id) REFERENCES PAYMENT_DETAILS(payment_id)
);

CREATE TABLE ORDER_ITEM (
    order_id         INT NOT NULL,
    product_id       INT NOT NULL,
    quantity         INT NOT NULL,
    price            DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id),
    CONSTRAINT fk_order_item_product
        FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id)
);

CREATE TABLE DELIVERY (
    order_id           INT PRIMARY KEY,
    user_id            INT NOT NULL,
    delivery_fee       DECIMAL(10,2),
    estimated_date     DATE,
    delivery_status    VARCHAR(50),
    CONSTRAINT fk_delivery_order
        FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id),
    CONSTRAINT fk_delivery_staff
        FOREIGN KEY (user_id) REFERENCES STAFF_USER(user_id)
);

CREATE TABLE PICKUP (
    order_id          INT PRIMARY KEY,
    user_id           INT NOT NULL,
    pickup_date       DATETIME,
    pickup_status     VARCHAR(50),
    CONSTRAINT fk_pickup_order
        FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id),
    CONSTRAINT fk_pickup_staff
        FOREIGN KEY (user_id) REFERENCES STAFF_USER(user_id)
);

CREATE INDEX idx_subcategory_category
    ON SUBCATEGORY(category_id);

CREATE INDEX idx_sub_subcategory_name
    ON SUB_SUBCATEGORY(sub_subcategory_name);

CREATE INDEX idx_product_subcategory
    ON PRODUCT(subcategory_id);

CREATE INDEX idx_product_subcategory_subsub
    ON PRODUCT(subcategory_id, sub_subcategory_id);

CREATE INDEX idx_inventory_product
    ON INVENTORY(product_id);

CREATE INDEX idx_cart_user
    ON CART(user_id);

CREATE INDEX idx_order_user
    ON `ORDER`(user_id);

CREATE INDEX idx_order_promo
    ON `ORDER`(promo_id);

CREATE INDEX idx_order_payment
    ON `ORDER`(payment_id);

CREATE INDEX idx_delivery_user
    ON DELIVERY(user_id);

CREATE INDEX idx_pickup_user
    ON PICKUP(user_id);