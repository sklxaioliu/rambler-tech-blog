---
title: "MySQL 知识图解 07：插入、默认值、更新与删除"
date: 2026-11-13 08:00:13
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "用专用实验表理解数据写入，并区分删除行、清空表与删表。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 7
source_pages: "68-74"
---

本篇是 **MySQL 知识图解第 07 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

掌握 INSERT、DEFAULT、UPDATE 和 DELETE 的基本写法；理解省略列与显式 NULL 的区别；比较 DELETE、TRUNCATE 和 DROP 的影响，形成先查后改的习惯。

## 先用一个例子理解

员工登记册增加一个人，对应 INSERT；给已经登记的人修改地址，对应 UPDATE；离职后删除某条练习记录，对应 DELETE。这些操作都要先明确是哪张表、哪一条记录。

例如“把小陈的地址改成长沙”，如果只写“地址改成长沙”而不限制对象，就会影响所有员工。SQL 里的 WHERE，就是明确对象的关键部分。

## 基础知识

插入时建议显式列出列名，让数据位置与含义一一对应。默认值用于列被省略或显式使用 DEFAULT 的情况；写 NULL 是另一种意图，还要看列是否允许空值。

自增主键通常直接省略。旧教材里用 0 占位的行为受 SQL 模式影响，不作为新代码的通用写法。完整列插入也更容易在表结构调整后出现位置错误。

| 操作 | 范围 | 结构与事务要点 |
| --- | --- | --- |
| DELETE ... WHERE | 满足条件的行 | InnoDB 中可以放进显式事务 |
| DELETE 不带 WHERE | 全部行 | 保留表结构，不等于自动重置自增值 |
| TRUNCATE TABLE | 清空整张表 | DDL，会隐式提交，不能当作可回滚删除 |
| DROP TABLE | 整张表 | 连同结构一起移除 |

不能把 TRUNCATE 简化成“不记录日志”。它的实现和 DELETE 不同，但这不等于没有任何日志或恢复相关行为。

## 图示详解

![数据写入、修改与删除](/img/mysql-guide/07.svg)

左框是增加记录，中框是先定位再修改，右框是确认条件后删除。三个框代表不同任务，不要求连续执行。中间“先查条件”这一步，用来避免把全表更新误当成单行更新。

在图形工具中直接编辑网格也会生成写入操作，要确认保存范围和实际提交状态，不要以为界面里改过文字就一定已经写入服务器。

## 操作步骤

先在实验库新建专用表：

```sql
CREATE TABLE write_demo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  address VARCHAR(80) NOT NULL DEFAULT '待补充',
  job_id VARCHAR(20) NOT NULL DEFAULT 'CLERK'
) ENGINE=InnoDB;
INSERT INTO write_demo(name) VALUES ('小陈');
INSERT INTO write_demo(name,address,job_id)
VALUES ('小王','长沙',DEFAULT), ('小周','北京','SALES');
SELECT * FROM write_demo ORDER BY id;
```

小陈的地址和岗位来自默认值；小王显式填写地址，岗位使用 DEFAULT。这里没有显式写 NULL，因此不会把“未知”与默认值混在一起。

修改与删除使用事务来检查结果：

```sql
SELECT * FROM write_demo WHERE id = 1;
START TRANSACTION;
UPDATE write_demo SET address = '长沙' WHERE id = 1;
SELECT * FROM write_demo WHERE id = 1;
COMMIT;

SELECT * FROM write_demo WHERE id = 3;
START TRANSACTION;
DELETE FROM write_demo WHERE id = 3;
SELECT * FROM write_demo ORDER BY id;
ROLLBACK;
```

最后的 ROLLBACK 撤销这次删除，所以小周的记录应仍然存在。这里只演示 InnoDB 里的数据操作，不把建表等 DDL 混进事务。

## 实际应用

一次批量改价，先用完全相同的 WHERE 查询待修改记录，确认行数和样本，再执行更新。比如原本要修改某个部门，却发现 SELECT 返回了全公司，就应先修正条件。

操作结果中的“匹配行数”和“实际改变行数”也可能不同：把地址本来就是长沙的人再更新为长沙，匹配到了记录，但值没有变化。确认业务结果时，不能只看一个数字。

对于真正业务里的误删，恢复方法还依赖备份、日志和操作时机。本文的事务演示不能代替备份，也不能保证已提交的操作可以用普通 ROLLBACK 撤回。

## 易错点

UPDATE 需要 SET，多个赋值用英文逗号；DELETE 的语法是 `DELETE FROM 表名`，不写 `DELETE *`；DEFAULT 与 NULL 不互换；没有 WHERE 的更新和删除会扩大范围。

多条插入中有一条违反约束，实际执行结果要结合语句类型、事务与错误处理检查，不要凭界面只显示了部分内容就判断全部成功。

## 知识总结

写入前明确列名，修改前查询条件，删除前核对范围。把事务用于合适的数据操作，把清空结构和删除对象视作更大的变更。


## 下一篇教程

继续阅读：[MySQL 知识图解 08：选列、表达式、空值与去重](/posts/mysql-knowledge-08-select/)。

上一篇：[MySQL 知识图解 06：主键、外键与数据约束](/posts/mysql-knowledge-06-constraints/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/insert.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
