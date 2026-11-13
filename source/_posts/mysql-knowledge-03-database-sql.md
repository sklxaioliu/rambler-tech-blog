---
title: "MySQL 知识图解 03：SQL 分类、语法与数据库管理"
date: 2026-11-13 08:00:17
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "认识 SQL 操作层级，创建、选择和检查独立学习库。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 3
source_pages: "21-28"
---

本篇是 **MySQL 知识图解第 03 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

认识 SQL 的几类操作；理解分号、字符串、注释与大小写；创建并选择学习数据库；能够区分删除数据库、删除表和删除行。

## 先用一个例子理解

把数据库想成文件柜，表想成柜子里的分类登记册。创建数据库相当于准备一个柜子；创建表相当于设计登记册；插入行才是往册子里登记具体信息。不能把“删除一行登记”与“搬走整个柜子”混为一谈。

例如 `USE kb_mysql_lab` 只是在当前连接中选定默认数据库，并不创建它，也不会让其他人的连接自动改用同一个库。

## 基础知识

| 分类 | 常见语句 | 主要对象 |
| --- | --- | --- |
| DDL 数据定义 | CREATE、ALTER、DROP | 库、表等结构 |
| DML 数据操作 | INSERT、UPDATE、DELETE | 表中的记录 |
| 查询 | SELECT | 从数据得到结果集 |
| 权限管理 | CREATE USER、GRANT、REVOKE | 用户与访问权限 |
| 事务控制 | START TRANSACTION、COMMIT、ROLLBACK | 一组操作的边界 |

教材对 SELECT 的分类可能使用 DQL，也可能把查询放进广义 DML。分类帮助记忆，不能取代对语句行为的理解，尤其是 DDL 的隐式提交行为。

一条 SQL 可以写成多行，通常用英文分号结束。字符串使用单引号，例如 `'技术部'`；反引号用于标识符，例如列名需要转义时写成反引号包围的名称。不要混入中文逗号、中文分号或聊天里的弯引号。

关键字可以统一大写，便于阅读；表名在不同操作系统与配置下的大小写行为不同，项目中统一使用小写英文名称。MySQL 的 `--` 注释标记后应留空白，也可以使用 `/* ... */` 注释。

## 图示详解

![库、表、行三个层级](/img/mysql-guide/03.svg)

三个框从外到内表示数据库、表和记录。`DROP DATABASE` 作用于最外层，`DROP TABLE` 作用于中间层，`DELETE FROM ... WHERE ...` 选择的是最内层的某些行。箭头表示包含关系，不是让你依次执行删除命令。

看到管理工具中的树形列表时，可以按同样层级理解：连接节点下面的数据库、数据库里的表、表里的数据行。

## 操作步骤

在自己的实验服务器中，创建一个独立数据库。已有同名库时先确认用途，避免把别人的数据当作练习材料。

```sql
CREATE DATABASE kb_mysql_intro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
SHOW DATABASES;
USE kb_mysql_intro;
SELECT DATABASE();
SHOW CREATE DATABASE kb_mysql_intro;
```

逐句理解：第一条创建库并指定字符集与排序规则；第二条查看可见库；第三条选择当前库；第四条核对选择结果；第五条查看建库定义。`utf8mb4` 支持完整的 UTF-8 字符范围，不继续使用旧教材中的 `utf8` 别名作为新项目默认选择。

也可以查询数据库的字符集：

```sql
SELECT schema_name, default_character_set_name,
       default_collation_name
FROM information_schema.schemata
WHERE schema_name = 'kb_mysql_intro';
```

确认这个库确实只是刚才的空实验库以后，才可以清理：

```sql
-- 只清理本篇创建的空实验库，不要替换成业务库名。
DROP DATABASE kb_mysql_intro;
```

## 实际应用

公司系统通常不会把所有业务都混在一个练习库里。创建独立学习库的好处，是让练习对象清晰，也让备份和清理有明确边界。第 8 篇以后统一使用另外准备的 `kb_mysql_lab` 样例库；本篇的 `kb_mysql_intro` 与它分开。

图形工具里创建数据库时，名称、字符集和排序规则与这些 SQL 参数是同类概念。完成对话框后，用 `SHOW CREATE DATABASE` 核对实际结果，比只记按钮位置更可靠。

## 易错点

SQL 提示符里的 `->` 常表示语句尚未结束，检查引号、括号和分号；误以为 `SELECT` 必须带 `FROM` 也不正确，`SELECT 1 + 1;` 可以直接计算表达式。

`CREATE DATABASE IF NOT EXISTS` 可以避免同名错误，但不会把已有库自动改造成你写的字符集配置。看见“执行成功”还需要检查实际定义。

## 知识总结

先确认操作对象，再判断语句影响范围。创建、选择和查看数据库是不同操作；英文标点、统一命名与显式字符集能减少很多入门错误。


## 下一篇教程

继续阅读：[MySQL 知识图解 04：字段类型、字符集与精度选择](/posts/mysql-knowledge-04-data-types/)。

上一篇：[MySQL 知识图解 02：Windows 安装、连接与工具使用](/posts/mysql-knowledge-02-installation/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/creating-database.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
