---
title: "MySQL 知识图解 13：聚合、分组与 HAVING 的先后关系"
date: 2026-11-13 08:00:07
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "看懂明细如何变成分组汇总，辨别 COUNT 和 NULL 的报表口径。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 13
source_pages: "155-169"
---

本篇是 **MySQL 知识图解第 13 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

使用 SUM、AVG、MIN、MAX、COUNT 汇总数据；分清 WHERE 与 HAVING；理解多列分组和 NULL，避免把“某组的一条明细”误当成整组结果。

## 先用一个例子理解

五个人每人一条工资记录，现在要统计每个部门的总工资。先按部门把记录装进不同篮子，再对每个篮子求和，最后每个篮子输出一行。这就是 GROUP BY 与聚合函数配合的基本思路。

技术部篮子里是林经理 12000 和陈工程 8000，合计 20000；运营部是王销售 6000 和周销售 8000，合计 14000；部门未填写的赵助理会形成 NULL 分组，合计 5000。

## 基础知识

| 函数 | 作用 | 对 NULL 的处理 |
| --- | --- | --- |
| SUM | 对数值求和 | 忽略参数中的 NULL |
| AVG | 对非空数值求平均 | 分母不是包括空值的总行数 |
| MIN、MAX | 找最小、最大值 | 忽略 NULL，也能比较日期等类型 |
| COUNT(*) | 统计行数 | 包含存在空列的行 |
| COUNT(列) | 统计该列非 NULL 的数量 | 不统计 NULL，0 会统计 |
| COUNT(DISTINCT 列) | 统计非空唯一值数 | 排除 NULL，按值去重 |

不能把“所有聚合函数忽略空值”当作不带例外的结论：COUNT(*) 统计的是行。空结果集上 COUNT 返回 0，SUM 和 AVG 等一般返回 NULL，需要根据报表口径决定是否用 COALESCE。

MySQL 默认的 ONLY_FULL_GROUP_BY 规则会拒绝一些含糊的分组查询。初学者可以先遵守：非聚合输出列明确写在 GROUP BY 中。不要通过关闭 SQL 模式，让数据库随意挑一条姓名来代表整个部门。

## 图示详解

![明细行如何变成分组汇总](/img/mysql-guide/13.svg)

左框是逐人的明细，中框按部门编号分篮子，右框显示技术部 20000、运营部 14000 和未分部门 5000。输出行数由分组决定，不等于原表员工数。

如果再按岗位分组，篮子的标签会变成“部门编号 + 岗位”的组合。多列 GROUP BY 对组合分组，不是先生成一张部门统计表，再额外把结果按岗位排个序。

## 操作步骤

```sql
USE kb_mysql_lab;
SELECT COUNT(*) AS people,
       SUM(salary) AS total_salary,
       AVG(salary) AS average_salary,
       MIN(salary) AS minimum_salary,
       MAX(salary) AS maximum_salary
FROM employees;
```

未修改样例时，预期为 5 人，总工资 39000，平均工资 7800，最低 5000，最高 12000。AVG 的小数显示位数可能随类型与客户端展示而不同，数值含义相同。

```sql
SELECT COUNT(commission_pct) AS recorded_commissions,
       COUNT(DISTINCT department_id) AS known_departments
FROM employees;
```

第一列为 2，因为 0.10 和 0.00 都是已经填写的值；第二列为 2，因为只统计非空部门 10 和 20。

```sql
SELECT department_id, job_id, COUNT(*) AS people, SUM(salary) AS total
FROM employees
GROUP BY department_id, job_id
ORDER BY department_id, job_id;
```

分组列决定分组粒度，ORDER BY 单独决定展示顺序。GROUP BY 不保证结果已经按分组键排好序。

## 实际应用

先排除没有部门的明细，再统计总工资达到 15000 的部门：

```sql
SELECT department_id, SUM(salary) AS total_salary
FROM employees
WHERE department_id IS NOT NULL
GROUP BY department_id
HAVING SUM(salary) >= 15000
ORDER BY total_salary DESC;
```

WHERE 在分组前筛选员工，HAVING 在分组后筛选部门。预期只保留技术部。把 `SUM(salary) >= 15000` 放进 WHERE，不符合这层查询的聚合语义。

要把没有员工的设计部也显示出来，从部门表出发做 LEFT JOIN，并使用 `COUNT(e.employee_id)`。若使用 COUNT(*)，设计部的那条未匹配占位行也会被统计为 1，容易造成“空部门有一人”的错误。

## 易错点

`AVG(COALESCE(commission_pct,0))` 与 `AVG(commission_pct)` 口径不同：前者把缺失率按零计入分母，后者只平均已填写的值。MIN(hire_date) 表示较早日期，MAX 表示较晚日期，不能把最大日期误读成工龄最长。

如果想显示最高工资员工的姓名，不能只写姓名与 MAX(salary) 然后期待它自动匹配；需要子查询或其他明确的方法。

## 知识总结

明细先筛选，按明确粒度分组，再聚合和过滤组，最后排序。COUNT 的不同写法与 NULL 的处理，决定报表数字是否真正表达你的业务口径。


## 下一篇教程

继续阅读：[MySQL 知识图解 14：单行、多行与相关子查询](/posts/mysql-knowledge-14-subqueries/)。

上一篇：[MySQL 知识图解 12：图解内外连接、自连接与多表查询](/posts/mysql-knowledge-12-joins/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
