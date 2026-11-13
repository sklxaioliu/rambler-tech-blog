---
title: "MySQL 知识图解 19：LIMIT、OFFSET 与稳定分页"
date: 2026-11-13 08:00:01
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "理解页码和偏移量，并比较普通分页与继续查找的方式。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 19
source_pages: "216-219"
---

本篇是 **MySQL 知识图解第 19 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

使用 LIMIT 与 OFFSET 分页；计算页码和偏移量；处理并列排序、数据变化和深分页；理解分页图中“跳过多少行”与“取多少行”的区别。

## 先用一个例子理解

员工共有五人，每页显示两人。第一页显示编号 1、2，第二页显示 3、4，第三页显示 5。跳过的行数依次是 0、2、4，不是页码本身。

如果没有明确排序，所谓“第二页”就缺少稳定依据。即使数据没变，不同执行计划也不保证总以同样顺序返回。

## 基础知识

MySQL 有两种常见写法：`LIMIT offset, count`，或 `LIMIT count OFFSET offset`。参数位置不同，不能把第二种写法里的数量放到第一种的偏移位置。

当页码从 1 开始时：偏移量等于 `(页码 - 1) × 每页数量`。每页数量为 2，第三页就是跳过前 4 行，再取最多 2 行。

| 页码 | 偏移量 | 数量 | 按编号升序时的样例结果 |
| --- | --- | --- | --- |
| 1 | 0 | 2 | 1、2 |
| 2 | 2 | 2 | 3、4 |
| 3 | 4 | 2 | 5 |
| 4 | 6 | 2 | 空结果 |

空结果不一定是程序出错，也可能是请求页已经超过数据总量。页面需要结合总数或是否还有下一页，决定展示方式。

## 图示详解

![五条记录如何按两条一页切分](/img/mysql-guide/19.svg)

图中先把编号 1 到 5 排成稳定序列，再切成三页。第二页前面的两个灰色位置表示被 OFFSET 跳过，不是从表里删除；右边剩下的记录也没有消失，只是这次未返回。

分页改变的是输出窗口，不改变原表。LIMIT 2 表示“最多两行”，不保证所有页都一定有两行。

## 操作步骤

```sql
USE kb_mysql_lab;
SELECT employee_id, employee_name
FROM employees ORDER BY employee_id LIMIT 0,2;

SELECT employee_id, employee_name
FROM employees ORDER BY employee_id LIMIT 2 OFFSET 2;

SELECT employee_id, employee_name
FROM employees ORDER BY employee_id LIMIT 2 OFFSET 4;
```

第二条与 `LIMIT 2,2` 对应，第三条与 `LIMIT 4,2` 对应。LIMIT 一般写在 ORDER BY 后面，不把它插到 WHERE 条件中间。

按工资排行时，要为同工资员工提供稳定的顺序：

```sql
SELECT employee_id, employee_name, salary
FROM employees
ORDER BY salary DESC, employee_id ASC
LIMIT 2 OFFSET 0;
```

预期先显示林经理和陈工程；周销售与陈工程同为 8000，通过编号先后区分。只按 salary 排序，即使两人互换位置也不违反原来的单列排序要求。

## 实际应用

偏移量很大时，数据库可能仍需要处理大量前面的候选记录，再跳过它们。只返回 20 行，不代表只读取或处理了 20 行。索引与实际计划会影响代价。

翻页场景可以使用“上一页最后一个键”继续查找，例如按唯一编号升序：

```sql
SELECT employee_id, employee_name
FROM employees
WHERE employee_id > 2
ORDER BY employee_id
LIMIT 2;
```

这里的 2 是上一页最后一个 employee_id，不是页码或已读条数。结果为 3、4。它适合“继续向后看”，但不天然支持随意跳到第 100 页。

若按工资降序、编号升序，继续条件也必须同时考虑两个键。上一页最后记录为工资 8000、编号 2 时，可以筛选 `salary < 8000 OR (salary = 8000 AND employee_id > 2)`，再使用相同 ORDER BY 与 LIMIT。

## 易错点

页码不直接等于偏移量；没有稳定排序的分页不可靠；数据在两次请求之间新增或删除时，OFFSET 分页可能出现重复或漏读。稳定排序可以解决并列的不确定性，但不能独自解决所有并发变化问题，严格一致的导出还需要另外设计快照和任务机制。

应用中校验页码与每页数量的范围，使用驱动支持的参数化方式，不把未经验证的用户输入直接拼成 SQL。

## 知识总结

先定义稳定顺序，再定义窗口大小和起点。普通分页重在正确计算偏移，持续翻页可以考虑游标式查找，实际性能需要结合数据与计划验证。


## 下一篇教程

本系列已读到最后一篇。可以继续学习本站的[存储过程](/posts/sql-procedures/)和[游标](/posts/sql-cursors/)，或回到系列目录复习。

上一篇：[MySQL 知识图解 18：SQL 导出、导入与恢复核对](/posts/mysql-knowledge-18-backup/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
