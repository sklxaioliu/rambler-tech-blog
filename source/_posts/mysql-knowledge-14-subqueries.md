---
title: "MySQL 知识图解 14：单行、多行与相关子查询"
date: 2026-11-13 08:00:06
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "根据返回形状选择比较方式，理解 ANY、ALL、EXISTS 与空值。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 14
source_pages: "172-179"
---

本篇是 **MySQL 知识图解第 14 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

理解单行、多行和相关子查询；使用 IN、ANY、ALL、EXISTS；看懂内外查询关系，并识别 NOT IN 遇到 NULL 的陷阱。

## 先用一个例子理解

“找出工资高于全公司平均工资的人”需要先知道平均数，再拿每个人的工资与它比较。子查询把这两步写进一条 SQL：里面求平均，外面找员工。

统一样例总工资 39000，五人平均为 7800。因此工资更高的应是林经理、陈工程和周销售。这个手算结果，可以帮助你核对比较符、样例数据和查询含义。

## 基础知识

| 类型 | 返回内容 | 适用方式 |
| --- | --- | --- |
| 标量子查询 | 至多一行一列 | 放在表达式中与一个值比较 |
| 多行子查询 | 多个候选值 | 使用 IN、ANY、ALL 等合适的运算符 |
| 相关子查询 | 引用外层查询的列 | 表达“对当前这一行”的条件 |
| EXISTS | 判断是否存在满足条件的行 | 不需要取得完整的明细列表 |

子查询一般放在括号中。内层查询的写法和返回形状必须与外层用法一致：把多个人的工资放到 `salary > (子查询)` 中，可能出现子查询返回多行的错误。

从理解上可以先算里面再看外面，但这不是数据库必须执行两遍、或必须逐行重复查询的物理承诺。优化器可能改写执行方式。

## 图示详解

![内查询求平均，外查询筛选员工](/img/mysql-guide/14.svg)

左框包含五人工资，中间框得到平均数 7800，右框用 `salary > 7800` 保留三人。箭头表示值的依赖关系：外层比较需要一个明确的基准。

相关子查询则多一层关系：基准可能随外层员工的部门变化。此时“全公司平均”变成“这个员工所在部门的平均”，两种需求不能用同一条 SQL 代替。

## 操作步骤

```sql
USE kb_mysql_lab;
SELECT employee_id, employee_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary, employee_id;
```

再查与陈工程同部门、但不包含他自己的员工：

```sql
SELECT employee_id, employee_name
FROM employees
WHERE department_id = (
  SELECT department_id FROM employees WHERE employee_id = 2
)
AND employee_id <> 2;
```

使用唯一编号确定内层记录，比假定姓名不会重复可靠。如果内层标量查询没有结果，外层比较通常面对 NULL，而不是自动变成“比较零”。

```sql
SELECT employee_name FROM employees
WHERE department_id IN (
  SELECT department_id FROM departments WHERE location_id = 1
);
```

内层可以返回多个部门编号，IN 表达“属于这一组”，不要求只返回一个部门。

## 实际应用

找到至少有一名员工的部门：

```sql
SELECT d.department_id, d.department_name
FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e
  WHERE e.department_id = d.department_id
);
```

把 EXISTS 换成 NOT EXISTS，可以找到没有员工的设计部。这里不用 NOT IN，是因为员工的 department_id 中包含 NULL；未匹配值与含 NULL 的集合做 NOT IN 比较可能得到未知，导致本应显示的记录被过滤。

对不含 NULL、非空的集合 `{6000,8000}`，`> ANY` 表示至少大于一个值，即大于 6000；`> ALL` 表示大于所有值，即大于 8000；`= ANY` 与 IN 语义对应。这种大小值速记有前提，不能忽略 NULL 与空集合。空集合上的 ANY 比较为假，ALL 比较为真，读代码时要想清楚是否符合需求。

相关平均值示例：

```sql
SELECT e.employee_name, e.salary
FROM employees e
WHERE e.salary > (
  SELECT AVG(x.salary) FROM employees x
  WHERE x.department_id = e.department_id
);
```

这次比较的是各自部门的平均。部门为 NULL 时，普通等号不会匹配 NULL 部门，需要另外定义是否把“未分部门”当作一个组处理。

## 易错点

不要用加 LIMIT 1 的方式掩盖本应返回多行的业务问题；不要认为子查询一定比 JOIN 慢或快；不要把 NOT IN 与 NOT EXISTS 当成无条件等价。先保证返回形状与空值语义正确，再比较执行计划。

## 知识总结

先判断内层返回一个值还是一组值，再选外层运算符。需要判断有没有匹配记录时，EXISTS 通常比拿一大串值再猜空值行为更容易讲清楚。


## 下一篇教程

继续阅读：[MySQL 知识图解 15：普通、唯一与联合索引的使用](/posts/mysql-knowledge-15-indexes/)。

上一篇：[MySQL 知识图解 13：聚合、分组与 HAVING 的先后关系](/posts/mysql-knowledge-13-aggregation/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/subqueries.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
