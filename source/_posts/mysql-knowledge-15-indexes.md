---
title: "MySQL 知识图解 15：普通、唯一与联合索引的使用"
date: 2026-11-13 08:00:05
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "看懂索引顺序、最左前缀与维护成本，用执行计划核对访问路径。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 15
source_pages: "183-195"
---

本篇是 **MySQL 知识图解第 15 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

认识普通、唯一、主键和联合索引；理解索引的收益与维护成本；看懂最左前缀示意图；用 EXPLAIN 检查计划，而不是凭直觉宣称查询已经加速。

## 先用一个例子理解

在一本通讯录里找“运营部工资大于 7000 的人”，如果通讯录先按部门、再按工资排好，就更容易定位相关范围。联合索引的列顺序，类似这种分层整理方式。

但每增加一个人、修改工资，也要维护这套整理结构。索引不是没有代价的加速按钮，更不是给每一列都加一个就最好。

## 基础知识

| 类型 | 作用 | 注意点 |
| --- | --- | --- |
| 普通索引 | 提供访问路径 | 不负责禁止重复值 |
| 唯一索引 | 限制非空值或非空组合重复 | NULL 的规则要单独理解 |
| 主键索引 | 唯一且非空识别行 | InnoDB 中主键与数据组织关系紧密 |
| 联合索引 | 按多个列组织键值 | 顺序影响适用查询 |

联合索引 `(department_id, salary)` 的常见用途，是先缩小部门范围，再在部门内按工资定位或读取。它不是两个完全独立的单列索引。

“不用最左列，索引绝对不会被使用”也过于绝对。数据库可能选择扫描索引或其他优化方式，但这不等于得到了同样高效的按前缀查找。应结合实际执行计划、数据量和选择性判断。

## 图示详解

![联合索引按部门再按工资组织](/img/mysql-guide/15.svg)

图中先划分部门 10 与 20，每个部门里面再排列工资。条件 `department_id = 20 AND salary >= 7000` 可以先找到 20 这一段，再看其中的工资范围。

如果只按 salary 查询，相同工资可能分散在多个部门段中。图解释的是键的有序结构与列顺序，不表示所有查询都严格按手工翻目录的步骤执行。

## 操作步骤

```sql
USE kb_mysql_lab;
SHOW INDEX FROM employees;
CREATE INDEX idx_emp_dept_salary
ON employees(department_id, salary);

EXPLAIN SELECT employee_id, employee_name, salary
FROM employees
WHERE department_id = 20 AND salary >= 7000;
```

对统一样例，查询应找到周销售；但只有五行的小表，优化器可能认为全表扫描更便宜。这不说明索引“创建失败”，也不能拿小样例宣称真实系统提高了多少倍性能。

查看计划时，先关注访问的表、可能使用的索引、实际选择的 key、估计扫描行数与 Extra 信息。估计值不是最终耗时；EXPLAIN ANALYZE 会实际执行相应查询，使用前要了解对象与开销。

其他创建与删除写法：

```sql
CREATE TABLE index_demo (
  id INT PRIMARY KEY,
  email VARCHAR(100),
  city VARCHAR(40),
  UNIQUE INDEX uq_index_email(email),
  INDEX idx_index_city(city)
) ENGINE=InnoDB;
ALTER TABLE index_demo ADD INDEX idx_index_email_city(email,city);
DROP INDEX idx_index_email_city ON index_demo;
```

表定义中的 PRIMARY KEY 已经建立主键相关索引，不要再无目的地给同一列创建重复索引。删除唯一索引还会移除相应唯一性保证，需要检查业务规则。

## 实际应用

为经常使用的筛选、连接和排序设计索引时，把完整 SQL 与数据分布一起看。字段只有少量不同值，是否有用还取决于查询返回比例、其他条件和是否覆盖输出；不能只凭“重复值多”就一概禁止。

字符串前缀索引可以限制索引的前缀长度，例如对适用字符串列建立 `name(10)`，但前缀较短可能降低区分能力，也未必能满足完整字符串排序或覆盖查询需求。不要把它与联合索引的“最左前缀”混成同一个概念。

索引占空间，也增加写入维护成本。经常修改的表不等于不能有索引，而是需要权衡读写需求与实际收益。

## 易错点

对列应用函数、隐式类型转换或以 `%` 开头的模式，可能影响普通索引的直接查找能力；具体行为仍应看计划。索引出现于 possible_keys 不表示一定被使用，key 非空也不代表整个查询已经足够高效。

## 知识总结

索引服务于具体查询。先看访问方式，再选列与顺序，最后用计划和真实环境中的测量验证效果；不要用概念图代替性能证据。


## 下一篇教程

继续阅读：[MySQL 知识图解 16：事务、并发与隔离级别](/posts/mysql-knowledge-16-transactions/)。

上一篇：[MySQL 知识图解 14：单行、多行与相关子查询](/posts/mysql-knowledge-14-subqueries/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
