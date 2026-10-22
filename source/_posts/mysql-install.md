---
title: MySQL 安装与环境配置
date: 2026-10-02 09:00:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [MySQL, Windows, 环境配置]
description: 在 Windows 上安装 MySQL 8.4 LTS，理解服务与客户端，完成本地连接并处理常见故障。
cover: /img/sql.svg
---

## 学习目标

能够从官方来源安装 MySQL Server，检查服务状态，通过命令行登录并验证版本。这里选择 8.4 LTS 作为稳定学习基线，不要求追逐最新 Innovation 版本。界面会随维护版本变化，请以实际安装器和官方说明为准。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 服务端像餐厅后厨，客户端像点餐窗口

mysql.exe负责发送命令，MySQL Server负责实际存数据、执行查询。只有客户端，没有运行服务端，就像点餐窗口开着但后厨没开工，因此命令存在不等于数据库可连接。

3306通常是这项服务的端口，像窗口编号。安装路径是程序放在哪里，数据目录是你的表和数据库文件在哪里，两者不是同一个概念。

- mysql --version：问手里的客户端是什么版本。
- SELECT VERSION()：连接成功后问服务端是什么版本。
- SELECT DATABASE()：问当前连接正在使用哪个库。

## 基础知识：服务端不等于客户端

MySQL Server 是持续运行、负责保存数据的进程；`mysql.exe` 是连接它的命令行客户端。安装 Workbench 不代表已经安装 Server。默认 TCP 端口通常为 3306，本机练习不需要给公网开放该端口。

Windows 服务让 Server 在后台运行。配置工具、数据目录和程序目录也不是同一个东西：升级程序前尤其要知道数据放在哪里。本文不要求修改系统级 PATH，直接使用完整路径即可验证安装。

## 操作步骤

1. 前往 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)，在版本选择中找到 8.4 LTS，选择匹配 Windows x86-64 的 MSI。不要把旧版 MySQL Installer 8.0 的界面当成所有版本的安装流程。
2. 根据官方提示安装所需 Microsoft Visual C++ 运行库。下载后查看文件属性中的数字签名，执行安装。
3. 完成 Server 安装并运行配套配置工具。选开发用途，记录端口、数据目录和实际服务名。只做本地练习时不需要新增公网防火墙规则。
4. 自己设置并妥善保存管理员密码；本教程不提供共享密码，也不要把真实密码写进笔记仓库。
5. 用 PowerShell 检查服务。下列命令按实际名称替换，不假定一定叫 MySQL84。

```powershell
Get-Service *mysql*
& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe' --version
& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe' -h 127.0.0.1 -P 3306 -u root -p
```

`-p` 后不跟密码，客户端会交互询问。PowerShell 的 `&` 用于执行带空格路径中的程序。若安装位置不同，必须更换路径。

### 分步拆解：为什么这样操作

**下载先分清产品。** 选择MySQL Server，不把Workbench图形工具当成服务端。版本以本文8.4为学习基线，不盲点页面里任何写着Download的广告。

**配置时记录，不公开密码。** 写下服务名、端口、数据路径。密码自己输入保管，后续-p使用交互提示，不把密码直接贴进命令。

**路径带空格时保留引号。** PowerShell里的&表示执行后面那条路径，单引号把完整程序路径包起来。安装在其他盘时替换路径，不把示例中的Program Files当作必然存在。

**连接失败按层看。** 找不到mysql先查程序路径；10061类连接错误先查服务和端口；Access denied则重点查账号认证。三种故障不能都靠重装解决。

## 实际应用：确认连接的是哪台服务器

登录后执行：

```sql
SELECT VERSION(), CURRENT_USER(), @@port;
SHOW VARIABLES LIKE 'character_set_server';
CREATE DATABASE IF NOT EXISTS tech_lab CHARACTER SET utf8mb4;
USE tech_lab;
SELECT DATABASE();
```

客户端 `--version` 显示客户端版本，`SELECT VERSION()` 显示服务端版本，两者可能不同。最后一条应返回 `tech_lab`。把版本和服务名记到自己的环境记录中，排错时比只说“装了 MySQL”更有帮助。

## 常见问题与解决方法

- **找不到 mysql 命令**：优先用完整路径确认存在，不要反复重装。需要简写时再把实际 `bin` 目录加入自己的用户 PATH，并重新打开终端。
- **Can't connect / 10061**：检查服务是否运行、端口是否一致；用 `Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue` 查看监听。
- **Access denied**：核对用户名、密码和连接主机；密码输入不显示字符是正常现象。不要通过关闭认证解决。
- **端口占用**：先查占用程序，确认是否已有 Server；必要时在配置工具选择其他端口，并同步修改客户端 `-P` 参数。

## 练习与参考答案

**练习：** mysql --version成功，但连接被拒绝，安装是否肯定完整成功？不能。它只证明客户端程序能运行，还要查服务端是否启动和端口是否正确。

**练习：** -p后输入密码时看不到字符，是否应重复粘贴很多次？不应。通常只是隐藏输入，输入一次后按Enter；重复粘贴可能让密码变成多份拼接。

## 知识总结

### 安装后的配置记录与日常检查

建议保存一份不含密码的环境清单：服务端版本、客户端版本、安装目录、数据目录、实际服务名、端口、字符集及配置文件位置。不要直接复制其他机器的 my.ini 覆盖自己的配置，目录、内存和服务名可能不同。

```sql
SELECT @@version,@@port,@@datadir;
SHOW VARIABLES LIKE 'sql_mode';
SHOW VARIABLES LIKE 'time_zone';
SHOW GRANTS;
```

数据目录不是可随意复制或删除的普通缓存。运行中的数据文件不能靠简单拖拽就保证一致备份；后续先学逻辑备份，再规划更复杂恢复。修改监听地址、防火墙和远程账号会扩大访问范围，本机学习并不需要这些步骤。

以后程序连接数据库时，不把管理员账号作为默认长期业务账号，不把密码拼进命令行或公开配置。客户端程序与服务端也要分别更新和验证。进阶阅读 [账号权限与备份](/posts/sql-backup-security/)。

安装成功需要同时满足程序存在、服务运行、账号可认证、SQL 查询可执行。本文只提供操作教程，博客项目本身不依赖或安装 MySQL。

练习：退出客户端，重新连接并查询当前库；体会 `USE` 只对当前会话生效。

## 下一篇教程

[SQL 增删改查详解](/posts/sql-crud/)

## 官方参考

[MySQL 8.4 Windows 安装说明](https://dev.mysql.com/doc/refman/8.4/en/windows-installation.html)
