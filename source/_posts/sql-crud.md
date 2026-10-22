---
title: SQL 增删改查详解
date: 2026-10-03 09:00:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [SQL, MySQL, CRUD]
description: 使用独立的任务表练习 INSERT、SELECT、UPDATE、DELETE，掌握条件筛选与安全修改。
cover: /img/sql.svg
---

## 学习目标

用四类语句管理学习任务，理解 WHERE、ORDER BY 与 LIMIT，并养成修改前预览范围的习惯。以下示例适用于 MySQL 8.4，假设已经能登录数据库。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### CRUD就是管理一张待办清单

INSERT像新增任务，SELECT像查看任务，UPDATE像把任务勾为完成，DELETE像移走一条记录。ALTER TABLE则像改变清单结构，例如加“截止日期”一列；它不是勾选某项任务。

WHERE像一个明确的指向动作。UPDATE后写WHERE id=1，表示只改编号1；不写WHERE，就像对整份名单说“全部改成完成”。所以修改前先用相同条件SELECT预览，确认到底指向谁。

事务像提交前的一组草稿操作：在支持该操作的事务范围内可以回滚，COMMIT后则不能靠普通ROLLBACK任意穿越回去。

## 基础知识

CRUD 分别是创建、读取、更新、删除。在 SQL 中对应 INSERT、SELECT、UPDATE、DELETE。`UPDATE` 改的是行内容，`ALTER TABLE` 改的是表结构；`DELETE` 删除行，`DROP TABLE` 删除整个表，初学时务必区分。

查询没有明确排序时，不应依赖它碰巧返回的顺序。文本、日期一般需要单引号；字段名不要用单引号。组合条件时，AND 比 OR 优先，用括号表达意图更清楚。

## 操作步骤：建立独立实验表

```sql
CREATE DATABASE IF NOT EXISTS tech_lab CHARACTER SET utf8mb4;
USE tech_lab;
CREATE TABLE IF NOT EXISTS study_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  minutes INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO study_tasks (title, minutes)
VALUES ('练习 SELECT', 30), ('阅读 JOIN', 45), ('整理笔记', 20);
SELECT id, title, done, minutes FROM study_tasks ORDER BY id;
```

1. 先运行建库、建表部分。
2. 插入一次样例数据，并记录查询得到的真实编号。
3. 下面用编号 1 演示；如果你的编号不同，请替换。
4. 对修改使用事务，确认结果后再提交。

```sql
SELECT * FROM study_tasks WHERE id = 1;
START TRANSACTION;
UPDATE study_tasks SET done = TRUE WHERE id = 1;
SELECT * FROM study_tasks WHERE id = 1;
COMMIT;
```

忘记 WHERE 会修改整张表。若发现范围不对，在 COMMIT 前执行 ROLLBACK；提交后不能靠 ROLLBACK 撤回。此处表使用 InnoDB；不要把事务撤回能力推广到所有引擎或 DDL 语句。

### 分步拆解：为什么这样操作

**先查询再修改。** SELECT所有任务，记录真实编号。样例中的1只是示范，如果自动编号不是1，必须替换，不凭显示第一行就假定它编号1。

**逐句读UPDATE。** UPDATE study_tasks说操作哪张表，SET done=TRUE说改什么，WHERE id=1说改哪一行。执行前把三部分用中文读一遍，能大幅减少误操作。

**事务里先看结果。** START TRANSACTION后做修改，再SELECT检查。符合目标才COMMIT；实验想保留原状就ROLLBACK。不要先提交再检查后悔。

**排序也要有规则。** ORDER BY minutes,id表示先比时长，同样时长再按编号。LIMIT 2只显示前两条，不代表只存在两条匹配记录。

## 实际应用：生成今日学习清单

```sql
SELECT title, minutes
FROM study_tasks
WHERE done = FALSE AND minutes <= 45
ORDER BY minutes ASC, id ASC
LIMIT 2;
```

这个查询只选未完成任务，按时长从短到长，最多返回两条。`LIMIT 2` 不保证总共只有两条符合条件，只限制显示数量。

删除也先预览。例如清理已完成的某条任务：

```sql
SELECT * FROM study_tasks WHERE id = 1 AND done = TRUE;
START TRANSACTION;
DELETE FROM study_tasks WHERE id = 1 AND done = TRUE;
SELECT ROW_COUNT();
ROLLBACK;
```

这里故意回滚以保留练习数据；`ROW_COUNT()` 紧接 DELETE 读取影响行数。真正删除时，确认范围后才能选择提交。

## 常见问题与解决方法

- **更新后看起来没变**：新值可能与旧值相同，或者 WHERE 没匹配。先运行同条件 SELECT。
- **安全更新模式报错**：用主键条件明确范围，不要首先关闭安全模式。
- **布尔字段显示 0/1**：MySQL 的 BOOLEAN 是 TINYINT(1) 的同义词，显示 0/1 正常。
- **重复插入任务**：每次 INSERT 都新增记录；用独立练习库避免混入实际业务。

## 练习与参考答案

**练习：** 想只完成编号2且尚未完成的任务，条件怎么写？

**答案：** WHERE id=2 AND done=FALSE。先用SELECT验证匹配，再运行相同条件的UPDATE。

**练习：** 删除已完成任务后执行ROLLBACK，它们一定回来吗？只有在正确的事务、支持事务的引擎及未提交等条件下才可以。本例用InnoDB练习，不能把结论套给任意DDL或任意存储引擎。

## 知识总结

### 继续练习：组合条件、汇总和参数化

```sql
SELECT id,title,minutes FROM study_tasks
WHERE done=FALSE AND (minutes<25 OR title LIKE '练习%')
ORDER BY minutes,id;
SELECT done,COUNT(*) AS tasks,SUM(minutes) AS total_minutes
FROM study_tasks GROUP BY done;
```

LIKE 中 `%` 代表任意长度字符，`_` 代表单个字符；它不是正则表达式语法。组合 AND/OR 时加括号表达真实业务逻辑。第二条把记录按完成状态汇总，不会修改原数据。

真实程序中，用户输入应通过数据库驱动的参数绑定传入，而不是拼成 SQL 字符串。占位符语法因驱动而异，不能把所有语言都套成 `?`。参数化主要用于值，不意味着可以把任意用户字符串安全当作表名或排序表达式，动态标识符还需白名单。

UPDATE 的“匹配行”和“实际改变行”也要区分，影响行数行为还与驱动选项有关。需要严格控制并发修改时，可加入版本号或原状态条件，检查结果后决定是否重试；重试也要考虑操作是否幂等。继续阅读 [聚合与子查询](/posts/sql-aggregation/)。

查询先确定列、范围、顺序，再控制数量。修改和删除先预览，使用主键限制目标，提交前核验结果。

练习：把一个未完成任务的时长改成 25，并查询剩余任务的总时长，提示：`SUM(minutes)`。

## 下一篇教程

[JOIN 多表连接查询](/posts/sql-joins/)

## 官方参考

[MySQL SELECT 语句](https://dev.mysql.com/doc/refman/8.4/en/select.html)
