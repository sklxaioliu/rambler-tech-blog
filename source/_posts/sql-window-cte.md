---
title: SQL CTE 与窗口函数：排名、累计和前后比较
date: 2026-10-22 08:33:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [SQL, MySQL, CTE, 窗口函数]
description: 用 WITH 拆解复杂查询，用 ROW_NUMBER、RANK、SUM OVER 和 LAG 保留明细并进行分析。
cover: /img/sql.svg
---

## 学习目标

写出可阅读的分步查询，为订单生成排名和客户累计消费，理解窗口与分组的区别。基于 MySQL 8.4；MySQL 5.7 不支持这里的 CTE 与窗口函数。先导入 [统一样例库](/posts/sql-schema/)。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 聚合像把账单装成一袋，窗口像在每张账单旁写小计

GROUP BY后，一个客户可能只剩一行总额；窗口函数还能保留他每张订单，同时显示累计。小林先买120、再买80，两张原订单仍在，旁边累计分别写120、200。

CTE像给中间草稿起名字。WITH customer_total先整理每人的消费，外层再做排名，让你不用把所有逻辑挤进一层。它只是当前语句的名字，不是永远存好的新表。

ROW_NUMBER给每行不同序号；RANK像比赛并列名次，两个第一之后会跳过第二；DENSE_RANK不留空号。选择前要先问业务需不需要并列。

## 基础知识

CTE 用 WITH 给当前语句中的查询结果命名，让复杂逻辑有层次；它不是跨语句长期存在的表，也不保证一定比子查询快。GROUP BY 通常把多行缩成一行，窗口函数则为每条明细附上分析值。

`PARTITION BY` 定义分区，窗口内部 ORDER BY 定义计算顺序，最外层 ORDER BY 定义最终显示顺序。二者不能混为一谈。对相同时间的记录，加主键作为稳定排序条件；若业务要让并列同名次，不要在 RANK 的排序里加会打破并列的主键。

## 操作步骤：先聚合，再排名

```sql
USE tech_advanced;
WITH customer_total AS (
  SELECT customer_id,SUM(amount) AS total
  FROM kb_order WHERE status='paid'
  GROUP BY customer_id
)
SELECT customer_id,total,
       RANK() OVER(ORDER BY total DESC) AS spending_rank
FROM customer_total
ORDER BY spending_rank,customer_id;
```

初始样例客户 1 与 2 都是 200，并列第一。ROW_NUMBER 会给每行不同序号，RANK 对并列跳号，DENSE_RANK 对并列不跳号；只有两行并列时看不出跳号差异，可增加第三位有金额的客户在独立副本中比较。

### 分步拆解：为什么这样操作

**先跑CTE内部查询。** 只看客户总额，确认200与200，再包进WITH并做排名。这是把难题拆成已验证的小步骤。

**看累计的三个条件。** PARTITION BY customer_id表示每个客户重新开始；ORDER BY ordered_at,id定义先后；ROWS从开头到当前行表示逐条累加。少了分区就可能把不同客户混在一起。

**看LAG第一行。** 第一张订单没有上一张，previous_amount为NULL是合理结果，不是丢数据。要显示0须先确认业务允许这种替代。

**筛最新订单放外层。** 内层先给每人倒序编号，外层WHERE rn=1再取第一行。若只要已付，应在编号前就限定已付候选，避免先选中待付再删除而漏掉更早的已付单。

## 实际应用：每位客户的订单累计

```sql
SELECT id,customer_id,amount,ordered_at,
       SUM(amount) OVER (
         PARTITION BY customer_id ORDER BY ordered_at,id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total,
       LAG(amount) OVER (
         PARTITION BY customer_id ORDER BY ordered_at,id
       ) AS previous_amount
FROM kb_order
WHERE status='paid'
ORDER BY customer_id,ordered_at,id;
```

客户 1 的累计应为 120、200；客户 2 只有一笔 paid 订单，累计 200。LAG 在每个客户的第一条记录上没有前一条，返回 NULL，不能一概认为是 0。显式使用 ROWS 边界，可以表达“逐条累计”；默认窗口边界可能把排序相同值的同伴记录一起考虑，初学时应写明需求。

想每位客户只保留最新一张订单，先生成序号，再外层筛选：

```sql
WITH ranked AS (
  SELECT id,customer_id,amount,
         ROW_NUMBER() OVER(
           PARTITION BY customer_id ORDER BY ordered_at DESC,id DESC
         ) AS rn
  FROM kb_order
)
SELECT id,customer_id,amount FROM ranked WHERE rn=1 ORDER BY customer_id;
```

这个版本包含所有状态；如果只要已付订单，应在 CTE 内加 paid 条件。筛选位置决定“最新”的候选集合。

## 常见问题与解决方法

- **WHERE 不能直接用窗口别名**：窗口计算发生在相关筛选之后，使用外层查询或 CTE。
- **排名每次顺序不同**：ROW_NUMBER 排序字段不唯一，增加有业务意义的平局规则。
- **累计忽然跳大**：检查窗口边界、排序同值和是否重复连接。
- **写 WITH 后下一句找不到名字**：CTE 只属于当前 SQL 语句，需要重复定义或使用视图。

## 练习与参考答案

**练习：** 小林第二张订单的running_total是80还是200？

**答案：** 200。80是本张金额，累计还包括前一张120。

**练习：** 两人消费同为200，要并列第一，能在RANK排序中额外加唯一客户id吗？不应随意加，它可能打破并列。可以在最外层排序用id稳定显示顺序。

## 知识总结

CTE 改善表达，窗口函数保留明细。练习分别解释“客户总消费”“客户每笔订单累计”“最新订单”三个问题为什么需要不同查询结构。

## 下一篇教程

[视图与触发器：封装查询和记录变更](/posts/sql-views-triggers/)

## 官方参考

[CTE](https://dev.mysql.com/doc/refman/8.4/en/with.html)、[窗口函数](https://dev.mysql.com/doc/refman/8.4/en/window-functions.html)
