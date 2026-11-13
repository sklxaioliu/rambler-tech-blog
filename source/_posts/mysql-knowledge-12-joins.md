---
title: "MySQL 知识图解 12：图解内外连接、自连接与多表查询"
date: 2026-11-13 08:00:08
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "用匹配和未匹配记录解释连接类型，并正确合并全外连接结果。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 12
source_pages: "127-152"
---

本篇是 **MySQL 知识图解第 12 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

看懂笛卡尔积、等值连接、非等值连接、自连接、内外连接和自然连接；通过表里的具体记录理解“哪些行保留”；知道 MySQL 没有直接的 FULL OUTER JOIN 语法。

## 先用一个例子理解

员工表存部门编号，部门表存部门名称。要显示“陈工程，技术部”，需要按编号把两表关联起来。赵助理没有部门，而设计部暂时没有员工，这两种未匹配情况正好用来理解外连接。

统一样例有 5 名员工、3 个部门。直接让每个员工与每个部门配对，会产生 15 种组合；按部门编号匹配以后，才得到有业务意义的对应关系。

## 基础知识

| 写法 | 关系与保留范围 |
| --- | --- |
| CROSS JOIN | 所有组合，有意生成配对时使用 |
| INNER JOIN ... ON | 只保留满足连接条件的组合 |
| LEFT JOIN ... ON | 保留左表全部行，未匹配右表列填 NULL |
| RIGHT JOIN ... ON | 保留右表全部行，可通过交换表改写为 LEFT JOIN |
| 自连接 | 同一张表用不同别名扮演不同角色 |
| 非等值连接 | 使用区间等非等号条件匹配 |
| NATURAL JOIN | 自动利用两表同名列形成连接条件，维护时容易受结构变化影响 |

旧式逗号连接把条件写在 WHERE，显式 JOIN 把连接条件放在 ON，可读性更强。表别名主要帮助限定列和表达角色，不是给字段加前缀就必然提高性能。

## 图示详解

![员工、部门匹配与外连接保留范围](/img/mysql-guide/12.svg)

第一条箭头把陈工程的部门编号 10 指向技术部 10；第二条示意赵助理的 NULL 部门无法匹配；第三条表示设计部没有员工。INNER JOIN 不保留后两种未匹配情况；以员工为左表的 LEFT JOIN 保留赵助理；以部门为左表的 LEFT JOIN 保留设计部。

![同一张员工表如何扮演两种角色](/img/mysql-guide/12-self.svg)

左边别名 e 表示员工，右边别名 m 表示经理。用 e.manager_id 匹配 m.employee_id，例如陈工程的经理编号 1，找到林经理这一行。两边仍是同一张真实表，只是在查询里扮演两个角色。

## 操作步骤

```sql
USE kb_mysql_lab;
SELECT e.employee_name, d.department_name
FROM employees e
INNER JOIN departments d
  ON e.department_id = d.department_id;

SELECT e.employee_name, d.department_name
FROM employees e
LEFT JOIN departments d
  ON e.department_id = d.department_id;
```

第一条预期 4 行，没有部门的赵助理不在结果中。第二条预期 5 行，赵助理的部门名称为 NULL。外连接的 NULL 也可能来自右表本身可空列，判断是否匹配时应选择右表可靠的非空主键。

多表与非等值连接：

```sql
SELECT e.employee_name, d.department_name, l.city
FROM employees e
JOIN departments d ON e.department_id = d.department_id
JOIN locations l ON d.location_id = l.location_id;

SELECT e.employee_name, g.grade
FROM employees e JOIN salary_grades g
  ON e.salary BETWEEN g.lowest_salary AND g.highest_salary;

SELECT e.employee_name AS employee, m.employee_name AS manager
FROM employees e LEFT JOIN employees m
  ON e.manager_id = m.employee_id;
```

薪资区间不能重叠，否则一位员工可能匹配多个等级，出现多行不是数据库“重复读取”。样例把 A、B、C 的边界设为互不重叠的 DECIMAL 区间。

## 实际应用

模拟全外连接时，要合并左连接结果与“仅右边存在”的部分：

```sql
SELECT e.employee_name, d.department_name
FROM employees e LEFT JOIN departments d
  ON e.department_id = d.department_id
UNION ALL
SELECT e.employee_name, d.department_name
FROM departments d LEFT JOIN employees e
  ON e.department_id = d.department_id
WHERE e.employee_id IS NULL;
```

预期 6 行：4 条已匹配员工、赵助理、没有员工的设计部。第二段排除了已经匹配的记录，所以用 UNION ALL 不会把匹配行重复加一遍。UNION 会对整个输出行去重，可能合并本应保留的相同展示值，不能不加思考地替换。

NATURAL JOIN 可以用来认识教材中的自动匹配图，但正式代码优先显式写 ON 或 USING。新增一个同名列可能让自然连接多出条件，而代码表面上没有变化。

## 易错点

LEFT JOIN 之后在 WHERE 写 `d.department_name = '技术部'`，会过滤未匹配的 NULL 行；若目标是保留全部员工并只匹配特定右表行，应重新考虑条件是否属于 ON。连接不是简单拼行数，一对多关系本来就可能扩展结果行。

“n 张表必须恰好 n-1 个条件”不是通用规则。应根据真实关系写够正确条件，额外筛选、多列键和特殊连接都可能需要更多条件。

## 知识总结

连接先确定角色和关联键，再确定保留哪一侧。把未匹配行、重复组合和 NULL 的来源逐一讲清，比只看连接图的圆圈阴影更可靠。


## 下一篇教程

继续阅读：[MySQL 知识图解 13：聚合、分组与 HAVING 的先后关系](/posts/mysql-knowledge-13-aggregation/)。

上一篇：[MySQL 知识图解 11：日期、类型转换与条件表达式](/posts/mysql-knowledge-11-date-case-functions/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/join.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
