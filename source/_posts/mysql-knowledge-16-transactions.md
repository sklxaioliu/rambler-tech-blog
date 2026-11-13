---
title: "MySQL 知识图解 16：事务、并发与隔离级别"
date: 2026-11-13 08:00:04
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "沿时间线理解提交、回滚、保存点和不同会话的可见性。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 16
source_pages: "196-204"
---

本篇是 **MySQL 知识图解第 16 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

理解事务的 ACID 特征、提交、回滚与保存点；区分脏读、不可重复读和幻读；认识 InnoDB 的四个隔离级别以及快照读与锁定读的区别。

## 先用一个例子理解

学习库里有两个虚构账户，余额分别为 1000 和 500。模拟转移 100，应同时完成“第一个减 100”和“第二个加 100”。只完成一半，就会破坏两者合计 1500 的规则。

事务把相关操作放进同一个提交边界。全部检查通过后 COMMIT；需要放弃时 ROLLBACK。这个例子用于理解数据库机制，不涉及实际银行转账。

## 基础知识

| 特征 | 通俗解释 | 在示例里的含义 |
| --- | --- | --- |
| 原子性 Atomicity | 一组操作整体提交或撤销 | 不保留只扣未加的半套操作 |
| 一致性 Consistency | 在正确业务逻辑与约束下保持规则 | 两账户合计仍为 1500 |
| 隔离性 Isolation | 控制并发事务相互看见和影响的方式 | 其他会话怎样读取变化 |
| 持久性 Durability | 提交后的改变按数据库机制持久保存 | 提交不是只改了客户端页面 |

事务不是自动保证所有业务正确的魔法。如果代码扣了 100，却加了 200，然后一起提交，原子性仍可能成立，业务规则却已经写错。数据库约束、事务边界和应用逻辑要共同工作。

MySQL 常见默认是自动提交，每条独立数据操作形成自己的提交边界；这不等于“不存在事务”。显式 START TRANSACTION 则允许把多条合适的数据操作放在一起。

## 图示详解

![两个会话在时间线上读取和提交](/img/mysql-guide/16.svg)

两列分别代表连接 A 和连接 B，纵向从上往下表示时间。A 先读到 1000，B 修改为 900 后提交，A 再读。读到什么，要结合隔离级别和读的类型判断，不能只看最终数据库里有哪个值。

脏读关注“读到了别人尚未提交的值”；不可重复读关注“同一事务再次读同一行，值发生变化”；幻读关注满足范围条件的行集合发生变化。三者讨论的对象与时间点不同。

## 操作步骤

```sql
USE kb_mysql_lab;
SELECT * FROM accounts ORDER BY account_id;
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
SAVEPOINT after_debit;
UPDATE accounts SET balance = balance + 200 WHERE account_id = 2;
ROLLBACK TO SAVEPOINT after_debit;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
SELECT SUM(balance) AS total_balance FROM accounts;
COMMIT;
```

保存点后先演示了一次错误的加 200，再回滚到保存点，保留前面的扣 100，重新加 100，最后合计应仍为 1500。若不打算保存任何改变，使用完整 ROLLBACK，而不是 COMMIT。

实际并发业务还需要控制锁、检查更新影响行数与余额条件。不要把这段教学脚本直接当作完整的支付实现。

## 实际应用

在自己的实验库打开两个独立连接，观察 READ COMMITTED：

```sql
-- 连接 A：先执行这几条，再暂时停下。
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT balance FROM kb_mysql_lab.accounts WHERE account_id = 1;
```

然后在连接 B 开启事务、修改同一余额并提交，再回到 A 再执行一次相同 SELECT，最后 COMMIT。A 的两次普通查询可以看到不同的已提交值。不要同时在一个查询编辑器里换标签却仍共用同一连接。

四种级别可以这样理解：

| 级别 | 需要掌握的行为 |
| --- | --- |
| READ UNCOMMITTED | 可能读到未提交改变，不适合作为普遍默认选择 |
| READ COMMITTED | 一致性读通常每条语句取得新的已提交快照 |
| REPEATABLE READ | InnoDB 默认级别；普通一致性读使用事务内相应快照 |
| SERIALIZABLE | 更严格地约束并发，可能增加等待与冲突 |

```sql
SELECT @@session.transaction_isolation, @@session.autocommit;
```

REPEATABLE READ 中的普通快照读，不等于所有读都只看旧数据。`SELECT ... FOR UPDATE` 等锁定读及写操作有不同语义；范围锁与快照也会影响幻读表现，不能简单总结成“可重复读必然解决或必然出现所有幻读”。

## 易错点

DDL 和部分管理语句会隐式提交，不要在数据事务中插入建表、改表或 TRUNCATE，再期待统一回滚。事务也要控制长度；长时间不提交可能延长锁持有和其他资源占用。

出现死锁或超时后，应按应用的事务恢复策略处理，不把重复点击执行当成可靠重试。改变会话隔离级别前，先结束当前实验事务。

## 知识总结

事务管理一组操作的提交边界，隔离级别管理并发可见性。先说清时间顺序、提交状态和读的种类，再判断看到的结果。


## 下一篇教程

继续阅读：[MySQL 知识图解 17：用户、授权与最小权限](/posts/mysql-knowledge-17-accounts/)。

上一篇：[MySQL 知识图解 15：普通、唯一与联合索引的使用](/posts/mysql-knowledge-15-indexes/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
