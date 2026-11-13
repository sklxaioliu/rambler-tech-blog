---
title: "MySQL 知识图解 11：日期、类型转换与条件表达式"
date: 2026-11-13 08:00:09
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "理解日期存储、格式化、解析与 IF、CASE、空值处理。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 11
source_pages: "116-124"
---

本篇是 **MySQL 知识图解第 11 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

使用日期函数进行提取和计算；分清格式化与解析；用 IF、IFNULL、COALESCE、NULLIF 和 CASE 表达条件，避免依赖模糊的类型转换。

## 先用一个例子理解

同一条入职日期可以保存为 DATE，展示时显示“2024年03月01日”，计算时又要得到入职天数。保存、展示和计算是三个目标，不能为了显示好看就把所有日期都存成一段随意格式的文字。

佣金率没有填写时，报表可以显示“未登记”；计算时是否按零处理，则需要另外明确。显示一段文字，不等于原字段已经变成那个业务值。

## 基础知识

| 任务 | 常用函数 | 注意点 |
| --- | --- | --- |
| 当前日期时间 | CURDATE / CURRENT_DATE、CURTIME / CURRENT_TIME、NOW、SYSDATE | 结果依赖运行时间与会话环境 |
| 提取组成部分 | DATE、YEAR、MONTH、DAY / DAYOFMONTH、HOUR、MINUTE、SECOND | 提取后不再是完整日期时间 |
| 星期与月份 | DAYNAME、MONTHNAME、DAYOFWEEK、WEEKDAY | 名称与编号规则不同 |
| 年内位置 | DAYOFYEAR、WEEK、WEEKOFYEAR | 周编号与周模式有关 |
| 时间差与日期运算 | DATEDIFF、TIMEDIFF、TIMESTAMPDIFF、DATE_ADD、DATE_SUB | 单位与参数方向要明确 |
| 月末与日数 | LAST_DAY、TO_DAYS | TO_DAYS 不是 Unix 时间戳 |
| 展示与解析 | DATE_FORMAT、STR_TO_DATE | 一个把日期变成文字，一个按格式解析文字 |

NOW 在一条语句中表示一致的当前时间；SYSDATE 的取值语义与它不同，不应不加区分地替换。DAYOFWEEK 通常把周日记为 1，WEEKDAY 把周一记为 0。需要“第几周”时，应先确定周的计算规则。

## 图示详解

![日期存储、显示和计算](/img/mysql-guide/11.svg)

中间框是有明确类型的日期。向左可以按格式解析导入文字，向右可以输出中文日期或计算间隔。箭头上标出的函数代表转换方向，不能把 DATE_FORMAT 与 STR_TO_DATE 写反。

图里固定日期用来说明规则；NOW、CURDATE 等动态结果要以实际运行时为准，不把某一次截图的日期当作固定答案。

## 操作步骤

```sql
SELECT DATE_FORMAT('2024-03-01','%Y年%m月%d日') AS display_date;
SELECT STR_TO_DATE('2024年03月01日','%Y年%m月%d日') AS parsed_date;
SELECT DATEDIFF('2026-11-13','2026-11-01') AS days_between;
SELECT DATE_ADD('2026-11-01', INTERVAL 1 MONTH) AS next_month;
SELECT TIMEDIFF('13:10:11','13:10:10') AS time_gap;
```

前三条预期为中文日期、2024-03-01、12 天。格式中的 `%m` 是月份，`%i` 是分钟，`%M` 是月份名称，大小写并非可以随意互换。DATEDIFF 比较日期部分；需要小时差等明确单位时，可使用 TIMESTAMPDIFF。

对员工日期进行实际查询：

```sql
SELECT employee_name, hire_date,
       FLOOR(DATEDIFF('2026-11-13',hire_date)/7) AS whole_weeks
FROM kb_mysql_lab.employees
ORDER BY employee_id;
```

固定比较日期让例子可复查；真实报表需要“截至今天”时再换成 CURDATE。不要直接把两个日期文本做减法来求天数。

## 实际应用

根据岗位展示不同的预算工资，同时处理佣金字段：

```sql
SELECT employee_name,
       CASE job_id
         WHEN 'DEV' THEN salary * 1.10
         WHEN 'SALES' THEN salary * 1.20
         ELSE salary
       END AS proposed_salary,
       IF(commission_pct IS NULL,'未登记','已登记') AS commission_status,
       COALESCE(email,'未填写邮箱') AS contact
FROM kb_mysql_lab.employees;
```

CASE 根据岗位生成结果列，没有更新工资。也可以使用搜索式 `CASE WHEN salary >= 8000 THEN ...`，按条件依次匹配。ELSE 指定其他情况的结果，避免遗漏后出现意外 NULL。

IFNULL 接收两个表达式；COALESCE 从左到右取第一个非 NULL 的值；NULLIF 在两个值相等时返回 NULL；ISNULL 用来判断是否为空。比如 `total / NULLIF(quantity,0)` 可以避免把零当作分母，但结果为 NULL 后仍需确定报表怎样展示。

## 易错点

不要把字符串 `'2026-11-13'` 和数字直接比较；不要依赖 `01/02/2026` 这样的含糊格式；不要让 CASE 的不同分支随意混合数值与文字。如果结果需要继续计算，就保持明确的数值类型，展示文案另设一列。

## 知识总结

日期用相应类型保存，格式化用在展示层，解析用在输入处，间隔计算明确单位。条件表达式用于生成结果，不会自动修改原始记录。


## 下一篇教程

继续阅读：[MySQL 知识图解 12：图解内外连接、自连接与多表查询](/posts/mysql-knowledge-12-joins/)。

上一篇：[MySQL 知识图解 10：字符与数字函数的加工过程](/posts/mysql-knowledge-10-string-number-functions/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
