---
title: "MySQL 知识图解 10：字符与数字函数的加工过程"
date: 2026-11-13 08:00:10
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "以输入和输出解释文本处理、字节长度、取整和数学函数。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 10
source_pages: "107-115"
---

本篇是 **MySQL 知识图解第 10 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

认识函数的输入与输出；用字符函数整理文本，用数字函数计算和展示数值；分清单行函数、聚合函数、字符长度与字节长度。

## 先用一个例子理解

一个字符串函数像加工工位：输入 `'  mysql  '`，经过 TRIM 去掉两端空格，再经过 UPPER 转成大写，得到 `'MYSQL'`。每一行都可以单独经过这样的加工，不会因此把整张表压缩成一行。

把五个人的工资加起来得到一个总数，则是聚合。它与把每个人工资四舍五入的单行计算不同，后面的聚合篇会单独说明。

## 基础知识

| 字符函数 | 用途 | 示例含义 |
| --- | --- | --- |
| LOWER / LCASE、UPPER / UCASE | 改变大小写 | 显示统一大小写的英文代号 |
| CHAR_LENGTH、LENGTH | 字符数、字节数 | 中文场景不要混用 |
| CONCAT、CONCAT_WS | 拼接字符串 | 后者按分隔符拼接并跳过 NULL 参数 |
| LPAD、RPAD | 左填充、右填充 | 用于展示编号，不改变原值 |
| LTRIM、RTRIM、TRIM | 去除相应边缘空格 | 不自动删除中间空格 |
| REPLACE | 替换指定子串 | 与 UPDATE 替换原记录不同 |
| REVERSE | 反转字符顺序 | 文本加工 |
| SUBSTR / SUBSTRING | 截取部分字符串 | 正起点通常从 1 计数 |
| INSTR | 查找子串位置 | 找不到返回 0 |

`CONCAT` 遇到 NULL 参数可能返回 NULL。拼姓名与备注时，先明确空值处理，不要因为其中一段没填，就让整条展示文字消失。

## 图示详解

![函数输入、加工和输出](/img/mysql-guide/10.svg)

左框保留原字符串，中框列出 TRIM 与 UPPER 的处理次序，右框给出输出。函数嵌套从内层表达式开始理解：先得到 TRIM 的结果，再把它交给 UPPER。

右框不是修改后的数据库字段，只是本次 SELECT 的展示结果。只有显式执行相应写入语句，才会改变表中的原始内容。

## 操作步骤

```sql
SELECT UPPER(TRIM('  mysql  ')) AS clean_name;
SELECT CHAR_LENGTH('长沙') AS chars,
       LENGTH(CONVERT('长沙' USING utf8mb4)) AS bytes;
SELECT SUBSTRING('MYSQL',2,3) AS part,
       INSTR('MYSQL','SQL') AS position_in_text;
SELECT LPAD('12',5,'0') AS display_code;

SELECT employee_name,
       CONCAT(employee_name,' / ',COALESCE(email,'未登记')) AS contact
FROM kb_mysql_lab.employees
ORDER BY employee_id;
```

前四条的预期依次是 MYSQL、两个字符与对应字节数、子串 `YSQ` 与位置 3、展示编码 00012。SUBSTRING 的起点 2 表示第二个字符，不是第二个字节。

数字函数中，先掌握与日常报表关系最近的几种：

```sql
SELECT ROUND(45.923,2) AS rounded,
       TRUNCATE(45.923,2) AS cut_value,
       ROUND(45.923,-1) AS rounded_tens;
SELECT CEIL(1.2), FLOOR(1.8), ABS(-5), MOD(17,5), 17 DIV 5;
```

预期分别是 45.92、45.92、50，以及 2、1、5、2、3。换成 45.929，就能看到 ROUND 得到 45.93，TRUNCATE 仍为 45.92。数字函数 `TRUNCATE(x,n)` 需要两个参数，与清空表的 `TRUNCATE TABLE` 不是同一件事。

## 实际应用

整理业务数据时，先用 SELECT 观察加工结果，确认不会破坏合法内容，再考虑是否需要保存。订单编号需要显示成五位，可以用 LPAD；不能因此把原来的整数主键改成字符串，除非业务确有需要。

其余数字函数按用途理解，不必混成一个列表死记：

| 类别 | 函数与含义 |
| --- | --- |
| 绝对值与符号 | ABS 绝对值，SIGN 返回负、零、正对应的 -1、0、1 |
| 取整 | CEIL / CEILING 向上取整，FLOOR 向下取整 |
| 大小比较 | GREATEST、LEAST 比较同一行表达式列表，不是整列聚合 |
| 幂与根 | POW / POWER 求幂，SQRT 平方根，EXP 计算 e 的幂 |
| 对数 | LN、LOG、LOG10、LOG2，注意参数定义域 |
| 三角函数 | SIN、COS、TAN、COT；输入角度通常先转为弧度 |
| 反三角函数 | ASIN、ACOS、ATAN、ATAN2，结果按弧度理解 |
| 角度转换 | RADIANS 角度转弧度，DEGREES 弧度转角度，PI 圆周率 |
| 随机数 | RAND 返回 0 到 1 之间的近似随机值，不用于密码生成 |

例如 `SIN(RADIANS(30))` 把 30 度先转换为弧度，再求正弦，结果接近 0.5。AVG、COUNT、MAX、MIN、SUM 留到聚合篇处理，不能因为出现在数字函数表里就当作普通单行函数。

## 易错点

LPAD 的目标长度短于原串时可能截短内容；TRIM 默认去除两端空格，不是清理全部不可见字符；四舍五入还要考虑精确数与近似浮点数的区别。存储金额继续用 DECIMAL，别指望显示时 ROUND 能补救所有浮点精度问题。

## 知识总结

把函数理解为明确的输入、处理和输出。分清字符与字节、截断与四舍五入、单行计算与聚合，才知道得到的值真正代表什么。


## 下一篇教程

继续阅读：[MySQL 知识图解 11：日期、类型转换与条件表达式](/posts/mysql-knowledge-11-date-case-functions/)。

上一篇：[MySQL 知识图解 09：条件筛选、逻辑组合与排序](/posts/mysql-knowledge-09-conditions/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
