---
title: MySQL 知识图解阅读路线
date: 2026-11-13 07:59:00
updated: 2026-11-13 08:00:00
description: 从数据库概念到分页的19篇MySQL知识图解，含统一样例、逐图说明与按顺序阅读导航。
---

## 从这里开始

这个系列按概念、操作、查询与管理的顺序，共 19 篇。知识范围依据提供的 219 页课程讲义重新组织，以 MySQL 8.4 为基线补充解释；图示为本站重绘，不保留原稿水印和广告。问答题、选项、答案与独立练习题均未搬入文章。

1. [MySQL 知识图解 01：数据库、表与 SQL 的关系](/posts/mysql-knowledge-01-concepts/)
2. [MySQL 知识图解 02：Windows 安装、连接与工具使用](/posts/mysql-knowledge-02-installation/)
3. [MySQL 知识图解 03：SQL 分类、语法与数据库管理](/posts/mysql-knowledge-03-database-sql/)
4. [MySQL 知识图解 04：字段类型、字符集与精度选择](/posts/mysql-knowledge-04-data-types/)
5. [MySQL 知识图解 05：建表、改表与结构检查](/posts/mysql-knowledge-05-table-ddl/)
6. [MySQL 知识图解 06：主键、外键与数据约束](/posts/mysql-knowledge-06-constraints/)
7. [MySQL 知识图解 07：插入、默认值、更新与删除](/posts/mysql-knowledge-07-dml/)
8. [MySQL 知识图解 08：选列、表达式、空值与去重](/posts/mysql-knowledge-08-select/)
9. [MySQL 知识图解 09：条件筛选、逻辑组合与排序](/posts/mysql-knowledge-09-conditions/)
10. [MySQL 知识图解 10：字符与数字函数的加工过程](/posts/mysql-knowledge-10-string-number-functions/)
11. [MySQL 知识图解 11：日期、类型转换与条件表达式](/posts/mysql-knowledge-11-date-case-functions/)
12. [MySQL 知识图解 12：图解内外连接、自连接与多表查询](/posts/mysql-knowledge-12-joins/)
13. [MySQL 知识图解 13：聚合、分组与 HAVING 的先后关系](/posts/mysql-knowledge-13-aggregation/)
14. [MySQL 知识图解 14：单行、多行与相关子查询](/posts/mysql-knowledge-14-subqueries/)
15. [MySQL 知识图解 15：普通、唯一与联合索引的使用](/posts/mysql-knowledge-15-indexes/)
16. [MySQL 知识图解 16：事务、并发与隔离级别](/posts/mysql-knowledge-16-transactions/)
17. [MySQL 知识图解 17：用户、授权与最小权限](/posts/mysql-knowledge-17-accounts/)
18. [MySQL 知识图解 18：SQL 导出、导入与恢复核对](/posts/mysql-knowledge-18-backup/)
19. [MySQL 知识图解 19：LIMIT、OFFSET 与稳定分页](/posts/mysql-knowledge-19-pagination/)

## 统一样例怎样使用

前七篇的结构与写入操作使用各自的实验对象。从第八篇查询开始，下载[统一样例脚本](/downloads/mysql-knowledge-lab.sql)，在自己的学习服务器中准备 kb_mysql_lab。脚本新建 5 张表，包含 5 名员工、3 个部门和 2 个虚构账户。若已有同名库，先核对用途，不要覆盖或在业务库中练习。

把文件存为 D:/mysql-learning/mysql-knowledge-lab.sql，使用 MySQL 客户端登录后执行：

```sql
SOURCE D:/mysql-learning/mysql-knowledge-lab.sql;
USE kb_mysql_lab;
SHOW TABLES;
SELECT COUNT(*), SUM(salary), AVG(salary) FROM employees;
```

初始预期为 5 人、工资合计 39000、平均 7800。不同篇章的写入可能改变实验数据，重复操作前先核对当前状态；不要重复导入到已经有数据的同名库中。正文结果为依据样例推导，本站本次没有安装或实际运行 MySQL 数据库。

## 图应该怎样看

每篇都解释图中对象、箭头、结果与业务含义。选列图关注字段，筛选图关注记录，连接图关注匹配与未匹配，分组图关注汇总粒度，事务图关注时间、提交状态与连接边界。图示用于解释机制，不代替真实执行计划或性能测量。

## 与原有教程怎样衔接

[SQL 数据库栏目](/categories/sql/)保留了原有教程。首次学习可按本系列 01—19 阅读，再补充[备份与安全](/posts/sql-backup-security/)、[窗口函数与 CTE](/posts/sql-window-cte/)、[存储过程](/posts/sql-procedures/)和[游标](/posts/sql-cursors/)。
