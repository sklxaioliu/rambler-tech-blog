---
title: SQL 数据类型、约束与表结构设计
date: 2026-10-22 08:31:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [SQL, MySQL, 数据建模, 约束]
description: 从客户与订单设计理解主键、外键、唯一约束、CHECK、金额精度和 NULL，准备统一的 SQL 进阶实验库。
cover: /img/sql.svg
---

## 学习目标

为字段选择类型，用约束表达业务规则，建立后续七篇进阶教程共享的练习库。示例基于 MySQL 8.4 与 InnoDB，不直接用于生产库；先完成 [MySQL 安装](/posts/mysql-install/) 与基础 CRUD。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 表结构像一张提前写好的填表规则

报名表要求姓名必填、编号不能重复、年龄不能为负。数据库里的NOT NULL、PRIMARY KEY/UNIQUE、CHECK分别负责这类规则。它们不是好看的说明文字，而是写入时真正可能拒绝数据的条件。

DECIMAL像按固定十进制刻度记金额。DECIMAL(10,2)里的10是总位数，不是小数点前十位；2是其中的小数位。VARCHAR适合可变长度文字，DATE只表示日期，不包含几点几分。

外键像“订单上客户号必须能在客户名册找到”。它只检查引用关系，不自动知道商品是否促销，也不替你完成所有业务验证。

## 基础知识

INT 适合一般整数；DECIMAL 适合需要明确十进制精度的金额；FLOAT/DOUBLE 是近似浮点数，不应随意用于严格金额计算。`DECIMAL(10,2)` 表示总共最多十位数字，其中两位小数。日期用 DATE，需要时分秒可考虑 DATETIME 或 TIMESTAMP，并明确时区策略。

VARCHAR 长度限制文本字符数，但实际存储还受字符集与行大小影响。编号即使全是数字，只要前导零有意义或不参与计算，也可用字符类型。NULL 表示未知，不等于 0；NOT NULL、DEFAULT 和 CHECK 分别表达必填、默认值与值域限制，不能互相替代。

主键唯一识别行；唯一约束防重复业务键；外键防引用不存在的对象。MySQL 的唯一索引允许多个 NULL，因此“可空唯一列”不等同于“所有行必须有唯一非空值”。CHECK 条件遇到 UNKNOWN（如 NULL）与 FALSE 不同，要求必填时仍应加 NOT NULL。

## 操作步骤：准备统一实验库

1. 下载本站 [SQL 进阶样例脚本](/downloads/sql-advanced-lab.sql)，保存到自己知道的目录。
2. 用 MySQL 客户端登录。脚本只创建独立 `tech_advanced` 库与 `kb_` 前缀教学表；先阅读文件，不含删除原库操作。
3. 在 mysql 客户端内执行 SOURCE，使用你实际保存的路径，Windows 路径可写正斜杠：

```sql
SOURCE D:/你的目录/sql-advanced-lab.sql;
USE tech_advanced;
SHOW TABLES;
SELECT * FROM kb_customer ORDER BY id;
SELECT * FROM kb_order ORDER BY id;
```

4. 首次导入应有 3 位客户、4 张订单、2 条库存。脚本用 INSERT IGNORE 便于重复导入，但不会恢复已修改数据；如果出现警告，用 SHOW WARNINGS 检查，不能把忽略当成修复。
5. 读一张表的定义，理解主外键和金额规则：

```sql
SHOW CREATE TABLE kb_order;
DESCRIBE kb_order;
```

### 分步拆解：为什么这样操作

**先读脚本说明。** tech_advanced是与原tech_lab分开的练习库。kb_customer是客户，kb_order是订单，kb_stock是库存，kb_audit用来记库存变化。

**SOURCE在哪里运行？** 在mysql客户端提示符后运行，不在PowerShell或浏览器里直接当SQL执行。把下载文件的真实路径替换进去，路径只是示例，不存在“你的目录”这个必备文件夹。

**导入后先数数据。** 客户3位、订单4张、库存2条。重复运行INSERT IGNORE不会把已改数据重置，所以后续期望值以前提“初始数据尚未修改”为准。

**故意失败的两条测试要分开跑。** 客户999不存在的订单应被外键拒绝；金额-10应被CHECK拒绝。观察错误后再SELECT确认没有写入，别把错误提示当成教程失败。

## 实际应用：阻止无效订单

```sql
USE tech_advanced;
-- 以下两条是故意失败的独立测试，逐条运行观察错误。
INSERT INTO kb_order VALUES (901,999,10.00,'2026-10-10','paid');
INSERT INTO kb_order VALUES (902,1,-10.00,'2026-10-10','paid');
```

第一条引用不存在的客户，应被外键拒绝；第二条金额为负，应被 CHECK 拒绝。MySQL 8.4 支持并执行这里使用的 CHECK，不把旧版本忽略 CHECK 的行为套用过来。失败后查询订单，确认没有新增这两条。

设计时把客户名保存在客户表、订单存客户编号，避免一位客户改名就改所有订单。如果业务要求保留下单时的收货信息，则应额外存明确的历史快照字段；规范化不意味着所有重复都绝对禁止，关键是清楚其含义。

## 常见问题与解决方法

- **Cannot add foreign key**：检查两边字段类型/符号、索引、引擎和现有脏数据。
- **Data too long**：字段长度不足或输入异常，先核对业务，不直接无限扩大。
- **小数与预期不同**：核对字段精度、计算表达式、输入格式和舍入策略。
- **SOURCE 找不到文件**：它读取的是客户端本地路径，替换示例目录；脚本不是在浏览器地址栏执行。

## 练习与参考答案

**练习：** 某订单金额未知，填0和NULL一样吗？不一样，0明确表示零金额，NULL表示未知；本例amount为NOT NULL，必须按规则提供数值，不能自己随意放空。

**练习：** 为何姓名不能直接做主键？现实可能重名也可能改名，用稳定唯一编号更适合识别对象。姓名仍可以保留在普通字段中。

## 知识总结

好的表结构让不合法的数据更难进入。练习为库存写一句规则：“编号唯一、SKU 非空且唯一、数量非负”，再把它与样例 DDL 逐项对应。

## 下一篇教程

[SQL 聚合、子查询与集合思维](/posts/sql-aggregation/)

## 官方参考

[MySQL 数据类型](https://dev.mysql.com/doc/refman/8.4/en/data-types.html)、[CHECK 约束](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html)
