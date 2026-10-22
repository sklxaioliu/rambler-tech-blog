-- MySQL 8.4：独立教学库。首次导入样例；重复执行不会重置已修改的记录。
CREATE DATABASE IF NOT EXISTS tech_advanced CHARACTER SET utf8mb4;
USE tech_advanced;
CREATE TABLE IF NOT EXISTS kb_customer (
  id INT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  city VARCHAR(30) NOT NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS kb_order (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  ordered_at DATE NOT NULL,
  status VARCHAR(12) NOT NULL,
  CONSTRAINT fk_kb_customer FOREIGN KEY (customer_id) REFERENCES kb_customer(id),
  CONSTRAINT chk_kb_amount CHECK (amount >= 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS kb_stock (
  id INT PRIMARY KEY,
  sku VARCHAR(30) NOT NULL UNIQUE,
  quantity INT NOT NULL,
  CONSTRAINT chk_kb_quantity CHECK (quantity >= 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS kb_audit (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  stock_id INT NOT NULL,
  old_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT IGNORE INTO kb_customer VALUES (1,'小林','上海'),(2,'小周','杭州'),(3,'小陈','上海');
INSERT IGNORE INTO kb_order VALUES
(101,1,120.00,'2026-10-01','paid'),(102,1,80.00,'2026-10-02','paid'),
(103,2,200.00,'2026-10-02','paid'),(104,2,50.00,'2026-10-03','pending');
INSERT IGNORE INTO kb_stock VALUES (1,'BOOK-SQL',10),(2,'BOOK-NET',8);
