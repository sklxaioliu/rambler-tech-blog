---
title: "MySQL 知识图解 05：建表、改表与结构检查"
date: 2026-11-13 08:00:15
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "理解表结构演变，逐步完成改名、改类型、加列与删列。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 5
source_pages: "32-46"
---

本篇是 **MySQL 知识图解第 05 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

创建、检查和修改表结构；理解改名、改类型、加列与删列的影响；知道图形工具中的“设计表”最终对应什么操作。

## 先用一个例子理解

员工登记表最初只有编号、姓名和工资，后来需要增加邮箱。增加一列是在改变登记模板；更新某个人的邮箱才是在改变记录内容。`ALTER TABLE` 与 `UPDATE` 处理的是不同层次。

把列从可空改为非空，也不只是勾一下复选框。如果已有记录没有填写该列，就要先处理这些记录，否则结构修改可能失败。

## 基础知识

建表时，列名、类型和属性共同组成列定义。表名是当前数据库下的名称，表里的每一行都遵循这些定义。常用结构命令包括：

| 操作 | 对应语句 | 是否改变存量记录的结构 |
| --- | --- | --- |
| 新建表 | CREATE TABLE | 创建新结构 |
| 改表名 | RENAME TABLE 或 ALTER TABLE ... RENAME | 改变对象名称 |
| 改列名 | RENAME COLUMN | 改变字段名称 |
| 改列类型 | MODIFY COLUMN | 可能转换存量值 |
| 加列 | ADD COLUMN | 增加可保存的属性 |
| 删列或删表 | DROP COLUMN、DROP TABLE | 丢弃对应结构与数据 |

`CHANGE COLUMN` 可以同时改列名和定义，但需要重写类型及相关属性；MySQL 8.4 只改列名时，`RENAME COLUMN` 更直接。修改类型时需要完整考虑原有的 NOT NULL、DEFAULT 等属性，别因漏写而丢掉需要保留的设置。

## 图示详解

![表结构修改前后](/img/mysql-guide/05.svg)

左框是一张原有登记模板，中框表示对结构执行修改，右框表示增加邮箱之后的新模板。箭头指的是结构演变，不是复制出第二套员工数据。修改后，应用程序使用的列名也要同步核对。

把图形工具的“字段名”“类型”“长度”“允许空值”与 SQL 中相应部分对照，就能理解设计界面的含义，而不是只会照着截图点按钮。

## 操作步骤

在实验库里独立创建表，避免修改后续查询需要的统一样例表：

```sql
CREATE TABLE table_demo (
  id INT PRIMARY KEY,
  full_name VARCHAR(40) NOT NULL,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB;
SHOW TABLES;
SHOW CREATE TABLE table_demo;
DESCRIBE table_demo;

ALTER TABLE table_demo RENAME TO employee_demo;
ALTER TABLE employee_demo RENAME COLUMN full_name TO name;
ALTER TABLE employee_demo
  MODIFY COLUMN name VARCHAR(60) NOT NULL;
ALTER TABLE employee_demo
  ADD COLUMN email VARCHAR(100) NULL;
SHOW CREATE TABLE employee_demo;
```

最后的定义应有 `id`、`name`、`salary`、`email` 四列。`MODIFY COLUMN` 中保留了 NOT NULL；`ADD COLUMN` 使用 NULL，意味着已有行可以暂时不填写邮箱。

再演示需要明确确认的清理操作：

```sql
-- 仅对本篇创建的空实验表演示。
ALTER TABLE employee_demo DROP COLUMN email;
DROP TABLE employee_demo;
```

删除列会丢掉这一列的数据；删除表会丢掉整张表。不要把删列当成“先隐藏一下”，也不要认为普通 ROLLBACK 能撤回这些 DDL 操作。

## 实际应用

真正业务的表结构变更，应先查看定义、存量数据和依赖。把姓名长度从 60 缩到 10 之前，先查询是否存在超过 10 个字符的值；给已有表加非空列时，先设计默认值或回填方案。大表修改还可能影响锁、执行时间与应用兼容性。

图形工具保存设计时，留意它准备执行的 SQL。看一遍预览，确认没有把“修改列”误操作成“删除列再新建”。

## 易错点

提示没有选择数据库，先执行 USE；提示表已存在，先核对是不是同名练习对象；提示数据截断或转换失败，不要直接关闭严格模式，先查存量值是否符合新定义。

删除表与清空表不同：DELETE 保留结构并按条件删除行，TRUNCATE 清空表，DROP TABLE 连结构一起删除。

## 知识总结

结构设计决定每一条记录怎样保存。修改前看定义和数据，修改后重新检查实际结构，并核对应用、索引和约束是否仍然匹配。


## 下一篇教程

继续阅读：[MySQL 知识图解 06：主键、外键与数据约束](/posts/mysql-knowledge-06-constraints/)。

上一篇：[MySQL 知识图解 04：字段类型、字符集与精度选择](/posts/mysql-knowledge-04-data-types/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/alter-table.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
