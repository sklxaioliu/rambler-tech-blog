---
title: SQL 数据库基础入门
date: 2026-10-01 09:00:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [SQL, MySQL, 数据库入门]
description: 从表、行、列和主键开始，亲手建立一个课程学习数据库，理解 SQL 与 MySQL 的区别。
cover: /img/sql.svg
---

## 学习目标

读完后，你能解释数据库、数据库管理系统与 SQL 的关系，识别主键，并创建第一张表。本文使用 MySQL 8.4 LTS 语法；尚未安装的读者可先阅读下一篇安装教程，再返回实践。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 先把数据库想成一家图书馆

数据库像图书馆，表像不同的书目清单，一行是一本书，一列是书名、编号或价格。数据库管理系统像负责入库、查找和管理权限的工作人员；SQL是你向它提出要求的语言。

例如课程表的一行“1，SQL入门，3”，不是三个随意放在一起的值，而是“编号1、标题SQL入门、课时3”。知道每列含义，软件才能回答“哪些课程不超过2小时”。

主键像每本书的唯一条码。书名会重名，条码不能重；NULL像“暂时不知道页数”，0则明确表示零页，空字符串则是有一段长度为零的文字。三者不能随意互换。

## 基础知识：把数据放进有规则的表格

数据库是有组织的数据集合；MySQL 是负责保存、查询和控制数据访问的软件；SQL 则是与它交流的语言。SQL 并不等于 MySQL，PostgreSQL、SQLite 等系统也支持 SQL，但部分语法不同。

关系型数据库以表组织数据。一行代表一个对象，一列代表一个属性。例如课程表的一行可以是“SQL 入门”，列包括编号、标题和课时。表结构规定每列可接受的数据类型，避免把“很多”写进课时字段。

主键是每行的唯一标识，不能重复，也不能为 NULL。课程标题可能重名，因此用数字编号作为主键更稳妥。NULL 表示未知或缺失，与空字符串和数字 0 不同；判断它要用 `IS NULL`，不能用 `= NULL`。

## 操作步骤：建立学习库

1. 打开 MySQL 客户端，使用安装时创建的本地账号登录。
2. 创建独立的练习数据库，采用 `utf8mb4` 保存中文与完整 Unicode 字符。
3. 切换数据库，建立课程表并插入两条记录。

```sql
CREATE DATABASE IF NOT EXISTS tech_lab CHARACTER SET utf8mb4;
USE tech_lab;
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  hours INT NOT NULL DEFAULT 1
);
INSERT INTO courses (title, hours)
VALUES ('SQL 入门', 3), ('网络基础', 2);
SELECT id, title, hours FROM courses ORDER BY id;
```

首次执行后，应能看到两门课程。编号由数据库生成，不需要手工填写。`VARCHAR(100)` 限制文本长度，`NOT NULL` 要求提供值，`DEFAULT` 在省略字段时提供默认值。SQL 用分号结束语句，字符串用单引号包围。

### 分步拆解：为什么这样操作

**先确定在哪个库。** 登录客户端后执行CREATE DATABASE，再USE tech_lab。创建库像新建文件夹，USE像进入该文件夹；只建目录不进入，后面可能不知道表放哪里。

**把建表定义逐列读。** id是编号，INT为整数，PRIMARY KEY要求它识别每一行；AUTO_INCREMENT让系统分配编号。title为文字，NOT NULL要求必须有值；hours为课时，DEFAULT 1表示没有明确填写时用1。

**插入与查询分开执行。** INSERT添加两行，SELECT只读取。先确认两行存在，再尝试筛选hours<=2。不要因为屏幕没看到结果就反复INSERT，否则会新增重复学习记录。

**用结果验证理解。** 网络基础2小时应通过筛选，SQL入门3小时不通过。结果不同先查原始数据，再怀疑查询语法。

## 实际应用：课程清单

假设你每天只能学习两小时，可以筛出短课程：

```sql
SELECT title, hours FROM courses WHERE hours <= 2;
DESCRIBE courses;
SHOW TABLES;
```

第一条负责取数据，第二条查看结构，第三条列出当前库中的表。把结构与内容分开理解，后续修改字段时就不会误把“改表”当作“改一行记录”。试着再插入一门课，然后分别查询全部课程与短课程，比较结果。

## 常见问题与解决方法

- **No database selected**：先执行 `USE tech_lab;`，连接数据库后不会自动选中任意练习库。
- **Table already exists**：说明之前已建表。先 `DESCRIBE courses;` 检查，继续查询即可，不必删除重建。
- **中文显示异常**：检查客户端连接字符集，执行 `SHOW VARIABLES LIKE 'character_set%';`；建库字符集与终端显示编码都可能影响结果。
- **重复执行插入多了记录**：SQL 不会自动判断两次操作是否是同一学习动作，先查询再决定是否继续插入。

## 练习与参考答案

**练习：** 新增“Linux入门，4小时”，查询课时大于2的课程。哪个条件合适？

**答案：** WHERE hours > 2，应包含SQL入门和Linux入门，不包含2小时的网络基础。大于与大于等于差一个等号，边界值最能帮助你检查条件。

**练习：** 不知道课时应填0还是NULL？如果业务允许缺失，NULL更能表达未知；本例hours不允许NULL，需要先调整规则或明确值，不能随便用0冒充已知。

## 知识总结

### 再理解三个容易混淆的问题

数据库名、表名和列名是不同层级。`tech_lab.courses` 表示指定库中的表；只写 courses 时，使用当前 USE 选中的库。一个连接选择数据库，不会改变另一个连接的当前库。

SQL 通常可按用途分为结构定义（CREATE、ALTER）、数据查询与修改（SELECT、INSERT、UPDATE、DELETE）、事务控制（COMMIT、ROLLBACK）和权限管理（GRANT 等）。这只是学习分类，不能据此认定所有语句都有一样的回滚行为。

设计学习记录时，一门课程可能有多条学习日志，应分开建课程表和日志表，以课程编号关联。把“第1天、第2天、第3天”不断增加为新列，会让统计和扩展越来越困难。表结构应表达对象和关系，而非照搬一张视觉表格。

```sql
SELECT DATABASE() AS current_database;
SELECT COUNT(*) AS course_count FROM tech_lab.courses;
SELECT title FROM courses WHERE title IS NOT NULL ORDER BY title;
```

COUNT 统计记录数；最后的排序依赖字符集排序规则，不应假定中文总按拼音顺序。进阶可继续阅读 [数据类型与约束](/posts/sql-schema/)，系统认识金额、日期、主外键与 NULL。

表保存同类对象，列描述属性，行保存实例，主键标识实例。先设计结构，再写入和查询数据，是关系型数据库最基本的工作顺序。

练习：添加一门 5 小时的课程，并查询大于 2 小时的课程。应使用 `WHERE hours > 2`，而不是在界面里手工筛选。

## 下一篇教程

[MySQL 安装与环境配置](/posts/mysql-install/) 将解释服务、客户端和连接参数。

## 官方参考

[MySQL 8.4 入门教程](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
