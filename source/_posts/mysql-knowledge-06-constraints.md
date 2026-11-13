---
title: "MySQL 知识图解 06：主键、外键与数据约束"
date: 2026-11-13 08:00:14
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "从参照关系看懂主键、外键、唯一、非空、默认值与 CHECK。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 6
source_pages: "47-67"
---

本篇是 **MySQL 知识图解第 06 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

理解主键、外键、唯一、非空、默认值和 CHECK；能在建表及改表时表达约束；明白约束失败通常是在保护数据一致性。

## 先用一个例子理解

员工编号不能重复，姓名必须填写，邮箱不能被两个人同时使用，部门编号需要能在部门表里找到。这些要求如果只靠人在页面上注意，换一个导入入口就可能被绕过。约束让数据库也参与检查。

例如员工填了部门 99，而部门表只有 10、20、30，外键可以阻止这条无效引用。它检查的是对应关系，不是根据名字猜这个部门是否存在。

## 基础知识

| 约束 | 作用 | 容易混淆的地方 |
| --- | --- | --- |
| PRIMARY KEY | 唯一且非空地标识行 | 一个表只有一个主键，主键可以包含多列 |
| UNIQUE | 防止约束列值或组合重复 | MySQL 唯一索引通常允许多个 NULL |
| NOT NULL | 必须有非空值 | 空字符串仍然不是 NULL |
| FOREIGN KEY | 限定参照关系 | 引用列可空时，NULL 不要求匹配父表 |
| DEFAULT | 省略值时使用默认值 | 显式写 NULL 不等于使用默认值 |
| CHECK | 检查表达式规则 | CHECK 不自动替代 NOT NULL |

AUTO_INCREMENT 是生成编号的列属性，不等同于主键本身。初学者通常把它用于整数主键，一个表只设一个自增列；它必须满足索引等相关要求。编号可能有空洞，不能拿“最大编号”当作总人数。

现代 MySQL 会执行受支持的 CHECK 约束。表达式结果为 FALSE 时拒绝相应写入；如果也要禁止 NULL，就还应设置 NOT NULL，而不是只写 `CHECK (salary >= 0)`。

## 图示详解

![主键与外键如何连接员工和部门](/img/mysql-guide/06.svg)

左框表示员工保存的部门编号，箭头指向右边部门表的主键。员工 2 的部门编号为 10，数据库检查部门表里是否有编号 10；它不要求员工编号也等于 10。

中间的约束像一道检查入口：不符合规则的数据写不进去。箭头代表参照关系，不表示复制整个部门名称到每个员工记录中。

## 操作步骤

下面使用独立实验表：

```sql
CREATE TABLE constraint_depts (
  id INT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE
) ENGINE=InnoDB;
INSERT INTO constraint_depts VALUES (10,'技术部');

CREATE TABLE constraint_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  email VARCHAR(100),
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  dept_id INT NULL,
  CONSTRAINT uq_constraint_email UNIQUE(email),
  CONSTRAINT ck_constraint_salary CHECK(salary >= 0),
  CONSTRAINT fk_constraint_dept
    FOREIGN KEY(dept_id) REFERENCES constraint_depts(id)
) ENGINE=InnoDB;
INSERT INTO constraint_staff(name,email,dept_id)
VALUES ('小陈','chen@example.test',10);
SHOW CREATE TABLE constraint_staff;
```

省略 id 让数据库生成编号，省略 salary 使用默认值。不要为了取得下一个编号，自己先查最大值再加一，这在并发下容易冲突。

已有表可以添加约束，例如：

```sql
ALTER TABLE constraint_staff
  ADD CONSTRAINT uq_constraint_name UNIQUE(name);
ALTER TABLE constraint_staff DROP INDEX uq_constraint_name;
ALTER TABLE constraint_staff DROP FOREIGN KEY fk_constraint_dept;
```

唯一约束通过唯一索引实现，删除时使用索引名；外键删除使用外键约束名，两者不是同一个命令。需要再加回外键时，先检查现有 dept_id 都能匹配父表。

## 实际应用

修改主键前，先检查其他表是否引用它；自增列依赖索引，移除主键前需要妥善处理自增属性与其他索引。把可空列改为非空之前，应先补齐已有 NULL。结构修改不会自动替你决定缺失数据的正确业务值。

用 `SHOW CREATE TABLE` 查看约束定义，用 `information_schema.table_constraints` 查看约束信息，比只记住图形工具里钥匙的颜色可靠。

## 易错点

重复键错误先核对现有数据与约束列；外键错误先核对父表、类型和被引用值；NOT NULL 错误先确认是否漏填。不要把关闭外键检查当成日常导入错误的默认解决方案。

外键允许 NULL，并不意味着允许随意填写任意编号。主键不能为 NULL，也不代表所有业务唯一性都已经解决，邮箱等仍可能需要单独的唯一约束。

## 知识总结

约束把业务要求落实到写入入口。主键识别记录，外键校验参照，唯一和非空分别控制重复与缺失，默认值与 CHECK 则补充具体规则。


## 下一篇教程

继续阅读：[MySQL 知识图解 07：插入、默认值、更新与删除](/posts/mysql-knowledge-07-dml/)。

上一篇：[MySQL 知识图解 05：建表、改表与结构检查](/posts/mysql-knowledge-05-table-ddl/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/create-table.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
