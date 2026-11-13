-- MySQL 8.4 学习样例。仅在自己的全新实验环境执行。
-- 若已有 kb_mysql_lab，请先核对用途，不要覆盖；此脚本不删除现有库或表。
CREATE DATABASE kb_mysql_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE kb_mysql_lab;

CREATE TABLE locations (
  location_id INT PRIMARY KEY,
  city VARCHAR(30) NOT NULL
) ENGINE=InnoDB;
CREATE TABLE departments (
  department_id INT PRIMARY KEY,
  department_name VARCHAR(40) NOT NULL UNIQUE,
  location_id INT NOT NULL,
  CONSTRAINT fk_department_location FOREIGN KEY (location_id) REFERENCES locations(location_id)
) ENGINE=InnoDB;
CREATE TABLE employees (
  employee_id INT PRIMARY KEY,
  employee_name VARCHAR(40) NOT NULL,
  email VARCHAR(100) UNIQUE,
  salary DECIMAL(10,2) NOT NULL,
  commission_pct DECIMAL(4,2) NULL,
  hire_date DATE NOT NULL,
  job_id VARCHAR(20) NOT NULL,
  department_id INT NULL,
  manager_id INT NULL,
  CONSTRAINT ck_employee_salary CHECK (salary >= 0),
  CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
) ENGINE=InnoDB;
CREATE TABLE salary_grades (
  grade VARCHAR(2) PRIMARY KEY,
  lowest_salary DECIMAL(10,2) NOT NULL,
  highest_salary DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;
CREATE TABLE accounts (
  account_id INT PRIMARY KEY,
  owner_name VARCHAR(30) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  CONSTRAINT ck_account_balance CHECK (balance >= 0)
) ENGINE=InnoDB;

INSERT INTO locations VALUES (1,'长沙'),(2,'北京');
INSERT INTO departments VALUES (10,'技术部',1),(20,'运营部',2),(30,'设计部',1);
INSERT INTO employees VALUES
 (1,'林经理','lin@example.test',12000,NULL,'2023-01-10','DEV',10,NULL),
 (2,'陈工程','chen@example.test',8000,NULL,'2024-03-01','DEV',10,1),
 (3,'王销售','wang@example.test',6000,0.10,'2024-05-20','SALES',20,1),
 (4,'赵助理',NULL,5000,NULL,'2025-02-01','CLERK',NULL,1),
 (5,'周销售','zhou@example.test',8000,0.00,'2025-06-01','SALES',20,3);
INSERT INTO salary_grades VALUES ('A',0,5999.99),('B',6000,9999.99),('C',10000,19999.99);
INSERT INTO accounts VALUES (1,'张同学',1000),(2,'李同学',500);

-- 首次导入后的预期：员工 5 人，总薪水 39000.00，平均薪水 7800.000000。
SELECT COUNT(*) AS employee_count, SUM(salary) AS total_salary, AVG(salary) AS average_salary FROM employees;
