---
title: JOIN 多表连接查询
date: 2026-10-04 09:00:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [SQL, MySQL, JOIN]
description: 从学习者与选课记录出发，理解 INNER JOIN、LEFT JOIN、连接条件以及常见重复行问题。
cover: /img/sql.svg
---

## 学习目标

理解一对多关系，会根据需求选择 INNER JOIN 或 LEFT JOIN，能解释为什么连接后行数变多。示例为独立表，不依赖前篇课程表。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 两张表就像花名册和选课记录

花名册写“1号小林、2号小周、3号小陈”，选课表写“1号选SQL、1号选网络、2号选SQL”。JOIN根据学习者编号，把名字和课程配在一起。

INNER JOIN像只找“确实有选课记录的人”；LEFT JOIN像“花名册每个人都要列出来，没选课也保留”。小林有两门课，所以连接后出现两行是正确的一对多结果，不是数据库重复出错。

ON回答“怎样配对”，WHERE回答“配好后留下谁”。把右表的SQL条件放ON与放WHERE，对未匹配的小陈会有不同影响。

## 基础知识：通过键把信息拼起来

学习者表只存姓名，选课表记录学习者编号与课程名。一个人可以有多条选课记录，这是“一对多”。连接不是把两个表随意横着拼接，而是根据 ON 条件为每行寻找匹配。

INNER JOIN 只保留匹配组合；LEFT JOIN 保留左表全部行，没找到右表记录时右侧各列为 NULL。外键约束可以阻止无效引用，但 JOIN 本身并不要求一定有外键。

## 操作步骤：准备数据

```sql
CREATE DATABASE IF NOT EXISTS tech_lab CHARACTER SET utf8mb4;
USE tech_lab;
CREATE TABLE learners (
  id INT PRIMARY KEY,
  name VARCHAR(30) NOT NULL
);
CREATE TABLE enrollments (
  id INT PRIMARY KEY,
  learner_id INT NOT NULL,
  course VARCHAR(50) NOT NULL,
  FOREIGN KEY (learner_id) REFERENCES learners(id)
);
INSERT INTO learners VALUES (1, '小林'), (2, '小周'), (3, '小陈');
INSERT INTO enrollments VALUES (101, 1, 'SQL'), (102, 1, '网络'), (103, 2, 'SQL');
```

只在新的练习表中执行一次。先插入被引用的学习者，再插入选课记录，否则外键会报错。

```sql
SELECT l.name, e.course
FROM learners AS l
INNER JOIN enrollments AS e ON e.learner_id = l.id
ORDER BY l.id, e.id;
```

根据样例，应得到小林的两门课与小周的一门课，共三行。小陈没有选课，不在结果中。`l` 和 `e` 是表别名，用来减少输入并消除同名列歧义。

### 分步拆解：为什么这样操作

**先把两张表分开看。** 执行SELECT *，人工用编号连线，应该能画出小林两条、小周一条、小陈零条。先能手工配，代码才不神秘。

**再读连接条件。** e.learner_id=l.id表示选课记录里的学习者编号必须等于花名册编号。l、e是表别名，像给长名字起简称，不改变原表名称。

**最后看未匹配行。** LEFT JOIN会给小陈补一行，右侧课程是NULL。统计选课数量要数e.id，NULL不会计入；COUNT(*)却会把补出来的那一行也算进去。

**不要用DISTINCT掩盖连接错误。** 如果所有人和所有课程都组合了一遍，先检查是否漏ON条件。

## 实际应用：包括未选课人员的统计

```sql
SELECT l.id, l.name, COUNT(e.id) AS course_count
FROM learners AS l
LEFT JOIN enrollments AS e ON e.learner_id = l.id
GROUP BY l.id, l.name
ORDER BY l.id;
```

这里应该得到 2、1、0 三个计数。用 `COUNT(e.id)`，因为它不计 NULL；`COUNT(*)` 会把 LEFT JOIN 补出的那一行也计入，导致未选课者显示 1。

如果只想匹配 SQL 课程、仍保留未选该课的人，应把右表筛选放在 ON 中：

```sql
SELECT l.name, e.course
FROM learners l
LEFT JOIN enrollments e
  ON e.learner_id = l.id AND e.course = 'SQL'
ORDER BY l.id;
```

如果把 `e.course = 'SQL'` 放到 WHERE，补出的 NULL 行会被过滤掉。ON 决定怎样匹配，WHERE 决定匹配后保留哪些行，顺序不同会改变结果。

## 常见问题与解决方法

- **结果成倍增加**：先检查是否漏写连接条件，再检查是否本来就是一对多或多对多。不要立即用 DISTINCT 掩盖错误。
- **Column is ambiguous**：写成 `l.id` 或 `e.id`，明确来源。
- **LEFT JOIN 丢了左侧行**：检查 WHERE 是否对右表字段施加了非 NULL 条件。
- **建表已存在**：复用数据检查结果，或改用新的实验表名；不要在真实库执行删除命令。

## 练习与参考答案

**练习：** 哪条思路能找“没有任何选课记录的人”？

**答案：** 以学习者为左表LEFT JOIN选课表，再WHERE e.id IS NULL；初始数据应是小陈。不是WHERE课程=''，因为未匹配是NULL而非空字符串。

**练习：** 小林为什么有两行？因为结果粒度是一条选课记录，不是一人一行。需要一人一行时应明确聚合规则。

## 知识总结

### 一对多之外：多对多与连接结果的粒度

真实选课系统通常拆成学习者、课程、选课关系三张表。一位学习者选多门课，一门课又有多位学习者，中间关系表记录二者编号，并可用联合唯一约束防止重复选同一门课。当前例子把课程名直接放入选课表，是为了聚焦 JOIN；后续应根据需求独立课程实体。

连接前先写出结果的粒度：“一行一个人”与“一行一条选课记录”不同。若一个人还连接三条学习日志，选课与日志同时连接可能出现相乘行数。应分别聚合后再连接，不能仅用 DISTINCT 试图修掉金额翻倍。

```sql
SELECT l.id,l.name
FROM learners l
WHERE NOT EXISTS (
  SELECT 1 FROM enrollments e WHERE e.learner_id=l.id
);
```

这是查未选课者的另一种表达。外键防止无效引用，连接条件决定如何配对，索引影响查找成本，三者解决的问题不同。继续用 [聚合与子查询](/posts/sql-aggregation/) 学习连接后的统计。

INNER JOIN 适合“只看有关联记录”，LEFT JOIN 适合“保留主体并补充信息”。行数取决于匹配数量，不等于左表行数。

练习：查询没有任何选课记录的人。提示：LEFT JOIN 后用 `WHERE e.id IS NULL`。

## 下一篇教程

[索引、事务与数据库优化](/posts/sql-performance/)

## 官方参考

[MySQL JOIN 语法](https://dev.mysql.com/doc/refman/8.4/en/join.html)
