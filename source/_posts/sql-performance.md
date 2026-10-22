---
title: 索引、事务与数据库优化
date: 2026-10-05 09:00:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [MySQL, 索引, 事务, 性能优化]
description: 使用 EXPLAIN 理解索引，通过库存扣减掌握事务边界，建立先测量后优化的习惯。
cover: /img/sql.svg
---

## 学习目标

会创建简单索引、阅读执行计划中的关键字段，理解提交和回滚，知道为什么索引并非越多越好。本文使用 MySQL 8.4 与 InnoDB。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 索引像书后面的关键词目录

查“事务”这一页，目录能帮你少翻很多页；但每次改书也要维护目录。索引同样可能减少查找，也占空间并增加写入成本，不能给所有列都建一个就算优化。

事务像转账的两步：甲减少100、乙增加100，应一起完成或一起撤回。只有一半成功会破坏业务一致性，因此要明确哪些操作属于一组，以及错误时谁负责回滚。

EXPLAIN像执行前的路线计划，其中rows是估计，不是已经实测扫描了那么多行。小表有时全表扫也便宜，所以看到没选索引不应直接认定优化器坏了。

## 基础知识

索引类似书的目录，让数据库有机会减少扫描范围，但也占空间，并增加插入和更新的维护成本。优化器会估计成本，小表或低选择性条件可能仍选择全表扫描，创建了索引不等于查询一定使用它。

事务是一组作为整体提交的操作。ACID 分别描述原子性、一致性、隔离性与持久性。它不是“任何错误都自动回滚所有业务”的保证：应用程序需要处理异常，并在必要时明确回滚整个事务。

## 操作步骤：观察索引

```sql
CREATE DATABASE IF NOT EXISTS tech_lab CHARACTER SET utf8mb4;
USE tech_lab;
CREATE TABLE lab_stock (
  id INT PRIMARY KEY,
  sku VARCHAR(30) NOT NULL,
  quantity INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO lab_stock VALUES (1, 'BOOK-SQL', 10), (2, 'BOOK-NET', 8);
EXPLAIN SELECT quantity FROM lab_stock WHERE sku = 'BOOK-SQL';
CREATE UNIQUE INDEX idx_stock_sku ON lab_stock(sku);
EXPLAIN SELECT quantity FROM lab_stock WHERE sku = 'BOOK-SQL';
```

比较 `key`（选择的索引）、`type`（访问方式）和 `rows`（估计扫描行数）。这里没有生成大型数据集，不宣称有可测的提速。唯一索引还会拒绝重复 sku，这是数据约束价值。

联合索引如 `(category, created_at)` 通常适合以 category 为前导条件的查询。不要只按“常用字段”盲目建索引，应结合 WHERE、排序和数据分布判断。

### 分步拆解：为什么这样操作

**先跑正确查询。** 用sku找库存，确认结果是你要的那一行，再看EXPLAIN。错误SQL即使跑得快也没有价值。

**建索引前后只比较一个因素。** 保留同一条查询，记录key、type、rows的变化。本例数据很小，不编造“提升100倍”的测速结果。

**扣库存把条件一起写进去。** quantity>=1与quantity-1在同条UPDATE里，避免先看还有1个、两人随后都扣的简单竞态。执行后立即看影响行数，0表示没完成扣减，不能继续当成功下单。

**练习先回滚。** 先看库存，再开启事务扣一次，观察后ROLLBACK，重新查询是否恢复。真实业务提交前还应核对关联操作。

## 实际应用：安全扣库存

```sql
START TRANSACTION;
UPDATE lab_stock
SET quantity = quantity - 1
WHERE id = 1 AND quantity >= 1;
SELECT ROW_COUNT() AS changed_rows;
SELECT quantity FROM lab_stock WHERE id = 1;
ROLLBACK;
```

条件更新避免“先读取库存再无条件扣减”的竞争窗口。应用程序必须检查影响行数：为 1 才能继续该订单流程；为 0 说明库存不足或商品不存在。本例最后回滚，便于重复实验；真实业务要在所有关联操作成功后提交。

不要把建索引或建表混入期待整体回滚的业务事务，MySQL 的许多 DDL 会造成隐式提交。事务也应尽量短，不要等待用户输入，否则可能长时间持锁。

## 常见问题与解决方法

- **索引没被选中**：先看数据量、过滤比例与函数表达式，再看 EXPLAIN。`WHERE YEAR(date_column)=...` 等写法可能不利于普通索引，常可改成范围条件。
- **回滚无效**：确认是 InnoDB、未提前提交，且操作不是会隐式提交的 DDL。
- **死锁**：并发事务可能产生死锁。统一访问顺序，缩短事务，并由应用程序有限重试完整事务。
- **LIKE 很慢**：`LIKE '%SQL%'` 通常无法用普通 B-tree 索引做前缀范围定位，全文搜索应另作设计。

## 练习与参考答案

**练习：** 建了sku唯一索引后，多插相同sku应该怎样？应被拒绝。这说明索引除了可能提速，还可以表达唯一性规则。

**练习：** 库存不足导致影响0行，是否应该自动告诉用户购买成功？不能，应作为业务失败处理，检查商品是否存在及库存是否足够。

## 知识总结

### 隔离级别、锁与优化顺序

MySQL InnoDB 常见默认隔离级别为 REPEATABLE READ，但应在自己的实例检查，不能只靠记忆。不同隔离级别影响并发可见性；“在事务里”不等于任何读取都会锁住业务对象。锁定读取如 SELECT…FOR UPDATE 需要结合事务、索引与访问范围理解。

```sql
SELECT @@transaction_isolation,@@autocommit;
SHOW INDEX FROM lab_stock;
EXPLAIN SELECT id,quantity FROM lab_stock
WHERE sku='BOOK-SQL';
```

排查慢查询可按“确认正确结果→用接近真实的数据量复现→查看计划→只改一个因素→比较代价”的顺序。EXPLAIN ANALYZE 会实际执行相关查询，不应把它当成完全不运行语句的静态查看按钮。不要在不了解负载时对生产库试跑。

分页越来越慢时，OFFSET 可能跳过大量行，可根据业务用稳定排序键进行游标式/键集分页；这里的“游标式分页”是一种查询分页策略，与存储程序 DECLARE CURSOR 不是同一功能。

接下来进入 [数据类型与约束](/posts/sql-schema/)，再学习窗口函数、视图、[存储过程](/posts/sql-procedures/) 与 [游标](/posts/sql-cursors/)，把性能、正确性和维护结合起来。

先保证 SQL 正确，再用实际数据和执行计划找瓶颈。只取需要的列、使用合适索引、控制事务范围，比随意修改服务器参数更适合入门。

练习：再次检查回滚后的库存，应该恢复原值。然后写下“索引成本”和“事务边界”各一个例子。

## 下一篇教程

[SQL 数据类型、约束与表结构设计](/posts/sql-schema/)。也可返回 [SQL 基础](/posts/sql-basics/) 独立完成整套实验。

## 官方参考

[MySQL 事务](https://dev.mysql.com/doc/refman/8.4/en/commit.html)、[EXPLAIN](https://dev.mysql.com/doc/refman/8.4/en/explain.html)
