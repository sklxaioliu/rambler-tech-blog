---
title: "MySQL 知识图解 08：选列、表达式、空值与去重"
date: 2026-11-13 08:00:12
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "逐行理解 SELECT 的输出、计算、别名、NULL 和 DISTINCT。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 8
source_pages: "75-89"
---

本篇是 **MySQL 知识图解第 08 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

理解 SELECT 的列选择、表达式、NULL、别名和 DISTINCT；看懂“选列”与“选行”的图；用统一样例解释每个结果如何产生。

## 先用一个例子理解

人事表有编号、姓名、工资、部门等字段，你只想看姓名和工资，这就是选列；只看技术部，是选行；把部门编号换成部门名称，需要连接另一张表。三件事可以组合，但作用不同。

本篇起使用系列首页提供的 `kb_mysql_lab` 样例。员工共有 5 人：林经理 12000、陈工程 8000、王销售 6000、赵助理 5000、周销售 8000。技术部为 10，运营部为 20；赵助理的部门暂未填写。

## 基础知识

```sql
USE kb_mysql_lab;
SELECT employee_name, salary FROM employees;
SELECT employee_name, salary * 12 AS annual_salary
FROM employees;
```

第一条选出两列，不改变表；第二条在查询结果中计算年薪，也不把新值写回 salary。林经理月薪 12000，对应计算结果 144000。

算术运算里乘除先于加减。`salary * 12 + 100` 表示全年额外加 100，`(salary + 100) * 12` 表示每月先加 100，再算全年。括号表达的是业务含义，不只是为了让代码好看。

NULL 表示缺失、未知或不适用，不等于 0，也不等于空字符串。王销售佣金率是 0.10，周销售是 0.00，另外三人的佣金率为 NULL。这三种情况不能随意混为一谈。

## 图示详解

![选列、筛选行与连接的区别](/img/mysql-guide/08.svg)

表格中的紫色列表示 SELECT 要显示的字段；绿色行表示 WHERE 要保留的记录。两种颜色可以相交，得到“某些人的某几个字段”。图下方的连接箭头则表示按部门编号补充部门名称，不是简单把两张表上下拼起来。

如果只选择姓名和工资，员工编号虽然没有显示，底层记录仍然存在。查询结果的展示范围不等于真实表结构发生了变化。

## 操作步骤

先给列和表起清楚的别名：

```sql
SELECT e.employee_name AS name,
       e.salary * 12 AS annual_salary
FROM employees AS e
ORDER BY e.employee_id;
```

`e` 是表的临时别名，`name` 和 `annual_salary` 是输出列标题。它们没有执行 ALTER TABLE，不会把真正字段改名。ORDER BY 可以使用合适的输出别名，WHERE 一般不能直接引用同层 SELECT 才产生的列别名。

再观察 NULL 的传播：

```sql
SELECT employee_name, commission_pct,
       salary * 12 * commission_pct AS commission_amount,
       salary * 12 * COALESCE(commission_pct,0) AS amount_for_report
FROM employees
ORDER BY employee_id;
```

王销售的计算值为 7200，周销售为 0；佣金率为 NULL 的直接乘法结果仍然是 NULL。最后一列人为把缺失率按 0 计算，这是报表口径，不能据此宣称未知佣金率已经变成确定的零。

最后去重：

```sql
SELECT DISTINCT department_id FROM employees;
SELECT DISTINCT department_id, job_id FROM employees;
```

第一条只对部门编号去重，能看到 10、20 和 NULL 三种值，未指定 ORDER BY 时不保证显示顺序。第二条对两列的组合去重，不是分别独立去重。把 employee_id 加进输出后，原本相同的部门行也可能不再相同。

## 实际应用

导出人事报表时，显式列清字段，让阅读者知道金额口径。需要年薪加佣金时，可以写 `salary * 12 * (1 + COALESCE(commission_pct,0))`，并标明缺失佣金率如何处理。

应用程序不应长期依赖 `SELECT *` 的列顺序；表结构调整以后，输出内容可能变化。临时查看可以使用星号，接口和固定报表优先写清列名。

## 易错点

DISTINCT 不是“按第一列挑一行”；别名不是修改字段；NULL 参与普通算术通常得到 NULL；给金额显示一个标题，也没有改变它的数据单位。写报告时把“月薪”“年薪”“佣金率”区分清楚。

## 知识总结

SELECT 决定显示什么，表达式决定怎样计算，别名决定怎样命名，DISTINCT 决定怎样判断输出行重复。它们都不自动修改原始数据。


## 下一篇教程

继续阅读：[MySQL 知识图解 09：条件筛选、逻辑组合与排序](/posts/mysql-knowledge-09-conditions/)。

上一篇：[MySQL 知识图解 07：插入、默认值、更新与删除](/posts/mysql-knowledge-07-dml/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/select.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
