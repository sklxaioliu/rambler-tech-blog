---
title: "MySQL 知识图解 18：SQL 导出、导入与恢复核对"
date: 2026-11-13 08:00:02
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "检查 SQL 文件范围，在独立库恢复并核对备份是否可用。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 18
source_pages: "215-216"
---

本篇是 **MySQL 知识图解第 18 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

理解 SQL 导出文件里可能包含什么；使用命令行或图形工具导出与恢复；在独立目标库验证备份，不把“文件生成了”当作“恢复成功了”。

## 先用一个例子理解

把数据库搬到另一台学习电脑，可以先导出“怎样建表、怎样插入数据”的 SQL 文件，再在目标服务器执行。这个文件像一份可重建资料柜的说明与登记记录，不是网页截图，也不一定包含账号和服务器的所有配置。

备份文件存在，只能证明有一个文件。还需要确认内容完整、能执行、恢复后有预期数据，才知道它能在需要时派上用场。

## 基础知识

| 导出范围 | 文件可能包含 | 恢复前要检查 |
| --- | --- | --- |
| 结构 | CREATE TABLE 等 | 字符集、约束与版本兼容性 |
| 数据 | INSERT 等记录 | 目标表是否已经存在、是否重复 |
| 结构与数据 | 建表与写入语句 | 是否包含 DROP、USE、库名等操作 |
| 其他对象 | 视图、触发器、存储程序、事件 | 是否显式包含、权限是否满足 |

SQL 文件也是可执行输入。导入别人提供的文件之前，先查看来源和内容，尤其是 DROP、用户管理、DEFINER 和硬编码库名。不能因为扩展名是 `.sql` 就认为只有安全的查询语句。

## 图示详解

![导出、独立恢复和核对](/img/mysql-guide/18.svg)

左框是来源库，中间框是 SQL 文件，右框是新建的恢复验证库。箭头表示导出与导入两个不同方向；最后的核对框强调，验证库应与来源库分开，避免把试验恢复覆盖到原数据。

图没有把账号和整台服务器配置画进 SQL 文件，因为普通数据库导出并不自动等于完整服务器备份。

## 操作步骤

下面假定你已安装相应 MySQL 客户端工具，且 `D:/mysql-backup` 是自己准备的备份目录。命令在 PowerShell 中运行，不是在 `mysql>` 提示符后运行：

```powershell
New-Item -ItemType Directory -Path 'D:/mysql-backup' -Force
mysqldump --host=127.0.0.1 --user=root --password --single-transaction --no-tablespaces --set-gtid-purged=OFF --result-file=D:/mysql-backup/kb_mysql_lab.sql kb_mysql_lab
Get-Item 'D:/mysql-backup/kb_mysql_lab.sql'
Get-Content 'D:/mysql-backup/kb_mysql_lab.sql' -TotalCount 35
```

`--single-transaction` 用于支持相应一致性机制的事务表场景，不能保证所有引擎和并发 DDL 都被同样处理；`--result-file` 避免依赖不同 PowerShell 版本的输出重定向编码行为。备份命令还需要满足当前服务器与所导出对象要求的权限。

先检查文件内容，再在 MySQL 客户端创建独立验证库并导入：

```sql
CREATE DATABASE kb_mysql_restore CHARACTER SET utf8mb4;
USE kb_mysql_restore;
SOURCE D:/mysql-backup/kb_mysql_lab.sql;
SHOW TABLES;
SELECT COUNT(*) AS people, SUM(salary) AS total_salary FROM employees;
SHOW CREATE TABLE employees;
```

上面的导出没有使用 `--databases`，方便在这个独立库中恢复表。仍需检查导出文件是否含有其他固定库名或特殊对象定义。未改动的统一样例预期恢复出 5 名员工，总工资 39000。

## 实际应用

图形工具里的“转储 SQL 文件”“运行 SQL 文件”是同类任务，但要检查所选的是结构、数据还是两者。导出后记录来源版本、导出时间、对象范围和文件摘要；恢复时检查执行日志，不只看导入进度条走完。

正式备份还可能需要存储程序、事件、触发器或其他对象，按任务显式选择并核对。CSV 只是一种数据交换格式，不会自动带上所有类型、约束和索引；把 CSV 导入成功，也不等于已经复原了整个数据库。

## 易错点

终端找不到 mysqldump 时先检查安装与路径；恢复乱码先核对文件编码、连接字符集和表字符集；重复键错误先确认是否导入到了已有数据的库。不要为了让导入通过，就无条件忽略错误或关闭约束。

这里只展示命令和预期核对方法，没有在你的电脑上执行数据库备份或恢复。备份文件中可能包含业务数据，应放在合适的访问范围内。

## 知识总结

明确导出范围，检查 SQL 内容，恢复到独立库，再核对结构、行数和关键业务数据。真正可靠的备份需要经过恢复验证。


## 下一篇教程

继续阅读：[MySQL 知识图解 19：LIMIT、OFFSET 与稳定分页](/posts/mysql-knowledge-19-pagination/)。

上一篇：[MySQL 知识图解 17：用户、授权与最小权限](/posts/mysql-knowledge-17-accounts/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
