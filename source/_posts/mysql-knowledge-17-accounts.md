---
title: "MySQL 知识图解 17：用户、授权与最小权限"
date: 2026-11-13 08:00:03
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "建立独立账号，核对允许主机和权限范围，使用现代授权语法。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 17
source_pages: "205-214"
---

本篇是 **MySQL 知识图解第 17 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

理解账号中的用户名与主机部分；创建最小权限的学习账号；授予、查看和撤销权限；纠正把 GRANT 当作创建用户、把 FLUSH PRIVILEGES 当作每次必需步骤的旧习惯。

## 先用一个例子理解

报表同事只需要看数据，不需要删表。给他管理员账号，就像因为要借一本书而把整栋资料室的总钥匙交出去。合适的做法是创建独立账号，只授予需要的范围。

同样叫 `kb_report` 的用户名，如果主机部分不同，也可能是不同账号。`'kb_report'@'localhost'` 中的 localhost 是账号匹配范围，不是可以随便省略的装饰。

## 基础知识

账号管理控制“谁可以登录”，权限管理控制“登录后能做什么”。现代 MySQL 先 CREATE USER，再 GRANT；不继续使用带 `IDENTIFIED BY` 的旧 GRANT 创建账号写法。

| 权限方向 | 常见权限 | 说明 |
| --- | --- | --- |
| 读取与写入 | SELECT、INSERT、UPDATE、DELETE | 可以按库、表或适用列范围授予 |
| 结构操作 | CREATE、ALTER、DROP、INDEX | 会影响对象定义，不能随意给报表账号 |
| 视图与程序 | CREATE VIEW、SHOW VIEW、EXECUTE、CREATE ROUTINE | 对应不同对象和动作 |
| 管理任务 | CREATE USER、适用的动态管理权限 | 不应默认授予应用账号 |
| 再授权 | GRANT OPTION | 允许继续向其他账号授权，需明确需要 |

`ALL PRIVILEGES` 受授权范围影响，也不等同于把一切管理能力和再授权能力都赋予用户。旧教材中的 SUPER 等笼统权限，在现代 MySQL 的许多任务中已经有更细分的权限选择。

## 图示详解

![账号、授权范围与具体操作](/img/mysql-guide/17.svg)

左框是账号，中间框是 `kb_mysql_lab.employees` 这个对象范围，右框只允许 SELECT。箭头表示授权关系，不是把整张表复制一份给这个用户。

同一账号可以有多条不同范围的授权。遇到权限错误时，要核对当前匹配的是哪个账号，以及操作针对的是哪个库和表。

## 操作步骤

由具备管理权限的账号在自己的学习环境执行：

```sql
CREATE USER 'kb_report'@'localhost'
  IDENTIFIED BY RANDOM PASSWORD;
GRANT SELECT ON kb_mysql_lab.employees
  TO 'kb_report'@'localhost';
SHOW GRANTS FOR 'kb_report'@'localhost';
```

第一条让服务器生成随机密码，返回结果需要自己妥善保存，不贴到博客或截图。文章没有给所有人共用的固定密码。若所用图形工具让你自行输入密码，应使用自己的强密码，并理解它最终创建的账号范围。

再用这个账号新建本地连接，执行：

```sql
SELECT USER() AS login_identity,
       CURRENT_USER() AS matched_account;
SELECT employee_id, employee_name
FROM kb_mysql_lab.employees;
```

USER() 与 CURRENT_USER() 用来理解连接身份和实际匹配账号。查询员工应在授权范围内；不要通过给应用账号更多权限，来跳过应该由管理员完成的建表工作。

## 实际应用

报表任务结束后，由管理员撤销相应权限；不再需要该学习账号时，再删除账号：

```sql
REVOKE SELECT ON kb_mysql_lab.employees
  FROM 'kb_report'@'localhost';
SHOW GRANTS FOR 'kb_report'@'localhost';
DROP USER 'kb_report'@'localhost';
```

CREATE USER、GRANT、REVOKE 等正式账号管理语句会让服务器处理权限更新，通常不需要额外执行 FLUSH PRIVILEGES。不同权限对已有连接的生效时点有细节，验证时可新建连接，不直接编辑 mysql 系统权限表。

图形工具的用户管理页面通常对应用户名、允许主机和权限勾选。勾选前明确业务需求，保存后再用 SHOW GRANTS 核对，而不是只看界面的绿色提示。

## 易错点

不要使用 `'用户'@'%'` 作为所有学习任务的默认答案。账号主机匹配、服务器监听范围、网络防火墙与 TLS 是不同层次；开放其中一个，并不自动使其他条件成立。

账号可以连接但看不到某张表时，先查对象名称和授权；不要直接把 root 凭据写进程序配置。正常授权也不需要通过重启服务器来“试试看”。

## 知识总结

按具体任务创建独立身份，按最小范围授权，再用新连接验证。把账号、主机范围、权限对象和操作能力分别看清楚。


## 下一篇教程

继续阅读：[MySQL 知识图解 18：SQL 导出、导入与恢复核对](/posts/mysql-knowledge-18-backup/)。

上一篇：[MySQL 知识图解 16：事务、并发与隔离级别](/posts/mysql-knowledge-16-transactions/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/account-management-statements.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
