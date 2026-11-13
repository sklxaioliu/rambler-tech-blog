---
title: "MySQL 知识图解 09：条件筛选、逻辑组合与排序"
date: 2026-11-13 08:00:11
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "掌握范围、集合、模式与空值条件，理解括号和稳定排序。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 9
source_pages: "90-104"
---

本篇是 **MySQL 知识图解第 09 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

使用比较、BETWEEN、IN、LIKE 和 NULL 条件筛选记录；理解 AND、OR、NOT 的组合；用 ORDER BY 得到可预测的排序。

## 先用一个例子理解

“找出技术部或运营部、并且工资至少 8000 的员工”，包含两个层次：先判断部门是否属于一组，再判断工资是否达到门槛。括号写错，就可能把技术部所有人都选出来。

统一样例中，林经理、陈工程和周销售满足工资条件。把具体名字与条件对照，比只背运算符优先级更容易发现错误。

## 基础知识

| 条件 | 含义 | 需要注意 |
| --- | --- | --- |
| =、<>、!=、>、>=、<、<= | 比较值 | NULL 不按普通相等比较 |
| BETWEEN a AND b | 在包含两端的范围内 | 日期时间边界尤其要明确 |
| IN (...) | 属于给定集合 | 比很多 OR 更直观 |
| LIKE | 按模式匹配 | % 表示零到多个字符，_ 表示一个字符 |
| IS NULL、IS NOT NULL | 检查空值 | 不写成 = NULL |
| AND、OR、NOT | 组合或反转条件 | 不清楚时显式加括号 |

逻辑表达式要考虑真、假和未知。`commission_pct <> 0` 不会把 NULL 当作“肯定不是零”选出来。需要保留空值时，应单独写 `OR commission_pct IS NULL`。

## 图示详解

![筛选条件的组合与输出排序](/img/mysql-guide/09.svg)

图中先判断“部门属于 10 或 20”，再与“工资至少 8000”取交集，最后排序。两个条件框之间的 AND 表示同时满足；部门框内部的 OR 表示满足其中一个即可。

这是一种帮助理解查询的逻辑流程，不承诺数据库内部逐行按照图中的物理顺序执行。优化器可能选择不同执行计划，但应保持语义。

## 操作步骤

```sql
USE kb_mysql_lab;
SELECT employee_id, employee_name, salary
FROM employees
WHERE department_id IN (10,20) AND salary >= 8000
ORDER BY salary DESC, employee_id ASC;
```

预期先显示林经理，再显示工资同为 8000 的陈工程和周销售。第二个排序键 employee_id 负责打破并列，避免同薪资员工每次顺序不稳定。

范围和模式示例：

```sql
SELECT employee_name, salary
FROM employees
WHERE salary BETWEEN 6000 AND 8000;

SELECT employee_name FROM employees
WHERE employee_name LIKE '%销售';

SELECT employee_name FROM employees
WHERE department_id IS NULL;
```

第一条包含 6000 和 8000；第二条查名称以“销售”结尾的人；第三条查部门暂未填写的赵助理。需要匹配字面上的 `%` 或 `_` 时，要使用明确的转义规则，不能把它们当成普通字符。

比较括号带来的区别：

```sql
SELECT employee_name FROM employees
WHERE (department_id = 10 OR department_id = 20)
  AND salary >= 8000;
```

去掉括号后，AND 的优先级高于 OR，条件会变成“部门 10，或者部门 20 且工资达标”。当前样例技术部恰好都达标，也不能因此认定两种语句永远等价。

## 实际应用

按整月筛选 DATETIME 时，常使用左闭右开的边界：`created_at >= '2026-11-01' AND created_at < '2026-12-01'`。这样不会把 11 月最后一天的下午或带小数秒的时间漏掉。用 `BETWEEN '2026-11-01' AND '2026-11-30'` 可能只包含到 30 日零点。

ORDER BY 可以有多个方向：先按部门升序，再按工资降序。需要把空部门放到最后时，可以先按 `department_id IS NULL` 排序，再排部门编号，明确表达展示意图。

## 易错点

没有 ORDER BY 就没有保证顺序；ORDER BY 不是始终位于整条语句最后，它后面还可以有 LIMIT 等子句；字符串比较受排序规则影响；LIKE '%关键字%' 通常不适合期待普通索引直接完成高效前缀定位。

## 知识总结

先把自然语言拆成条件，再用括号表达分组。处理 NULL 要明确，处理日期要明确边界，处理并列排序要增加稳定的第二排序键。


## 下一篇教程

继续阅读：[MySQL 知识图解 10：字符与数字函数的加工过程](/posts/mysql-knowledge-10-string-number-functions/)。

上一篇：[MySQL 知识图解 08：选列、表达式、空值与去重](/posts/mysql-knowledge-08-select/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
