---
title: SQL 聚合、子查询与集合思维
date: 2026-10-22 08:32:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [SQL, MySQL, GROUP BY, 子查询]
description: 学习 GROUP BY、HAVING、EXISTS、NOT EXISTS 和 UNION ALL，解决客户消费汇总与未下单查询。
cover: /img/sql.svg
---

## 学习目标

能按客户汇总金额，区分筛选行与筛选分组，正确处理 NULL 和重复记录。先按 [表结构教程](/posts/sql-schema/) 导入共享样例，本文使用 MySQL 8.4。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### GROUP BY像先按人分堆，再计算每堆的钱

小林的120和80放一堆，小周的200和50放一堆。若只统计已付，先去掉小周待付的50，再分别求和，得到200与200。这就是WHERE先筛明细、GROUP BY再分组、聚合后HAVING筛组的直觉。

COUNT(*)数行，COUNT(列)数该列非NULL值。LEFT JOIN给未下单客户补的一行，COUNT(*)会数到，COUNT(订单id)不会。这和数“空椅子数量”还是数“真正坐着的人”类似。

EXISTS像问“名册里有没有这个人的付费记录”，只关心存在与否，不需要把所有匹配内容都带回来。

## 基础知识

SUM、COUNT、AVG、MIN、MAX 对集合计算。`COUNT(*)` 计行，`COUNT(列)` 忽略 NULL；SUM/AVG 也忽略 NULL，但空集合的 SUM 通常为 NULL，可用 COALESCE 按业务转成 0。

WHERE 在分组前筛记录，HAVING 在分组后筛结果。选出的非聚合字段应与分组规则一致，不建议为了让不明确的 SQL 能运行而关闭 ONLY_FULL_GROUP_BY。

子查询是嵌套查询；EXISTS 关注是否至少有匹配行。NOT IN 的子查询若含 NULL，可能得到意料之外的 UNKNOWN，查“没有关联记录”时常可优先考虑 NOT EXISTS。

## 操作步骤

```sql
USE tech_advanced;
SELECT customer_id, COUNT(*) AS orders, SUM(amount) AS total
FROM kb_order
WHERE status = 'paid'
GROUP BY customer_id
HAVING SUM(amount) >= 150
ORDER BY total DESC, customer_id;
```

1. 先单独执行 WHERE 对应的明细查询，确认 paid 订单是 101、102、103。
2. 再看分组：客户 1 共 200，客户 2 共 200，均通过 150 的条件。
3. 将阈值改为 210，应没有分组通过；不要误以为数据丢了。
4. 若要包括未下单客户，使用 LEFT JOIN，并把 paid 条件放进 ON，避免 WHERE 把无匹配行过滤掉。

```sql
SELECT c.id, c.name, COUNT(o.id) AS orders,
       COALESCE(SUM(o.amount),0) AS total
FROM kb_customer c
LEFT JOIN kb_order o ON o.customer_id=c.id AND o.status='paid'
GROUP BY c.id,c.name
ORDER BY c.id;
```

### 分步拆解：为什么这样操作

**先查看已付明细。** 不加GROUP BY，确认只有101、102、103三张订单，金额为120、80、200。先算总额400，作为后面核对基准。

**再分客户。** GROUP BY customer_id得到每人一组，SUM求总额，COUNT(*)求订单数。客户1是两张、客户2一张，不是二者订单数都为2。

**最后加HAVING。** 阈值150时两组都保留；改210时都不保留。此时空结果表示没有达标组，不是原始订单被删除。

**没有下单也要展示时换思路。** 用客户作为左表，LEFT JOIN已付订单，COALESCE把空集合总额按业务显示0。这里0是展示约定，不代表原库NULL都应改成0。

## 实际应用：找出未付费客户

```sql
SELECT c.id,c.name
FROM kb_customer c
WHERE NOT EXISTS (
  SELECT 1 FROM kb_order o
  WHERE o.customer_id=c.id AND o.status='paid'
);
```

在初始样例中应只有小陈。EXISTS 里的 SELECT 1 只是表达存在性，不是把客户编号变成 1。相关条件必须写上，若漏掉 `o.customer_id=c.id`，含义会变为“整个订单表有没有付费订单”。

比较 UNION 与 UNION ALL：前者会去除重复结果行，后者保留全部。合并历史与当前明细时，先明确是否可能重叠，不能用 UNION 当作无条件的数据清洗。两边列数要相同、类型应兼容，最终排序放在整个集合之后。

还可找出高于全部已付订单平均额的订单：

```sql
SELECT id,amount FROM kb_order
WHERE status='paid' AND amount > (
  SELECT AVG(amount) FROM kb_order WHERE status='paid'
)
ORDER BY id;
```

初始平均值约 133.33，只有 200 元订单通过。这里的“平均订单金额”不是“客户平均消费”，两者分母不同。

## 常见问题与解决方法

- **总额翻倍**：多表连接产生一对多重复，再聚合时重复计入，先检查连接基数。
- **未下单客户计数为 1**：LEFT JOIN 后用了 COUNT(*)，改成统计右表非空主键。
- **HAVING 找不到字段**：写清聚合表达式或合法别名，不依赖随意选取的组内值。
- **NOT IN 什么都查不到**：检查 NULL，按业务改用 NOT EXISTS 并补全相关条件。

## 练习与参考答案

**练习：** 小周待付50改成已付后，客户2已付总额和全库已付总额应是多少？

**答案：** 250与450。只在可回滚或独立副本中尝试，再恢复数据，避免影响后文初始例子。

**练习：** “平均每张订单金额”和“平均每位客户消费”一样吗？不一样，分母分别是订单数与客户数，还要约定是否包含零消费客户。

## 知识总结

先核对明细，再聚合，再筛组。练习把 paid 改成 pending，说明为什么只出现客户 2 的 50 元记录。

## 下一篇教程

[SQL CTE 与窗口函数](/posts/sql-window-cte/)

## 官方参考

[聚合函数](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html)、[子查询](https://dev.mysql.com/doc/refman/8.4/en/subqueries.html)
