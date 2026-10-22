---
title: MySQL 存储过程详解：参数、分支、事务与异常
date: 2026-10-22 08:35:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [MySQL, 存储过程, 事务, 异常处理]
description: 从 CALL 和 IN/OUT 参数入手，编写带输入校验、条件扣库存、事务回滚和异常传播的完整存储过程。
cover: /img/sql.svg
---

## 学习目标

理解存储过程的用途，能创建、调用、检查和维护过程，并区分业务校验、事务与权限。使用 MySQL 8.4，先导入 [进阶实验库](/posts/sql-schema/)。本文示例没有在用户本机数据库执行，应在自己的独立实验库验证。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 存储过程像给数据库一份可重复执行的办事流程

普通SQL像一句“查一下库存”；过程可以表达“核对参数→检查并扣库存→给出余额→成功提交，失败回滚”。CALL是叫这份流程开始办事。

IN像你交给窗口的申请材料，例如商品编号和购买数量；OUT像窗口返回的结果，例如剩余库存。p_和v_只是命名习惯，用来区分参数、局部变量与表字段，不是MySQL自动赋予特殊意义。

BEGIN…END像把同一个流程的句子放进括号，并不自动开启事务。事务提交权像一把钥匙：本例由过程掌握，因此不要把它塞进另一项尚未完成的大事务，误把调用者的工作也提前提交。

## 基础知识

存储过程是保存于数据库的命名程序，通过 CALL 调用。IN 是输入，OUT 是输出，INOUT 先接收再返回。DECLARE 定义局部变量，SET 赋值，IF/CASE 处理分支；过程也可以返回 SELECT 结果集。

存储过程不自动比应用代码快，也不自动保证事务正确。它适合把稳定、需要在数据库端执行的操作封装成接口，但会增加数据库部署和版本管理工作。函数通常用于返回可放入表达式的值，过程使用 CALL，二者限制不同。

BEGIN…END 是程序块，不等于开始事务。事务仍需 START TRANSACTION、COMMIT、ROLLBACK。MySQL 不支持通常意义的嵌套事务；下面过程拥有整个事务边界，**只能独立调用，不能放进调用者已经开启的业务事务**，否则可能破坏调用者的事务预期。

## 操作步骤：创建扣库存过程

在 mysql 命令行客户端逐块执行。DELIMITER 让客户端暂时不用块内的分号截断 CREATE。图形客户端可能要求选中整个定义运行。

```sql
USE tech_advanced;
DELIMITER $$
CREATE PROCEDURE p_kb_take_stock(
  IN p_id INT,
  IN p_qty INT,
  OUT p_remaining INT
)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_changed INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_remaining = NULL;
    RESIGNAL;
  END;

  SET p_remaining = NULL;
  IF p_id IS NULL OR p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'id and positive quantity are required';
  END IF;

  START TRANSACTION;
  UPDATE kb_stock
     SET quantity = quantity - p_qty
   WHERE id = p_id AND quantity >= p_qty;
  SET v_changed = ROW_COUNT();
  IF v_changed <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'stock missing or insufficient';
  END IF;
  SELECT quantity INTO p_remaining FROM kb_stock WHERE id = p_id;
  COMMIT;
END$$
DELIMITER ;
```

1. DECLARE 必须位于块内可执行语句之前，处理器也需要在这个区域声明。
2. 参数前缀 p_ 与变量 v_ 避免和列名混淆；不要写出 `WHERE id=id` 这样的全表条件。
3. 条件 UPDATE 同时检查库存并扣减，避免应用先读库存、之后无条件扣减的竞态。
4. ROW_COUNT 紧接 UPDATE 保存，其他语句可能改变其含义。
5. 捕获错误后回滚并 RESIGNAL，不能吞掉错误让调用方误认为成功。

### 分步拆解：为什么这样操作

**先看输入校验。** p_qty<=0会拒绝负数或零，否则“扣负数”反而增加库存；IS NULL专门处理未知值，不能只靠<=0判断所有输入。

**看条件UPDATE的含义。** 它在同条语句里要求编号存在且库存足够，然后减去p_qty。不能先查“够不够”再随意无条件扣，期间可能有其他连接操作。

**紧接着保存ROW_COUNT。** v_changed为1，说明完成目标行的扣减；为0，商品可能不存在或不足，不能继续当作成功。随后SIGNAL给调用者明确错误。

**理解异常处理器三句话。** ROLLBACK撤回事务修改；把输出设NULL避免用它冒充有效余额；RESIGNAL继续把错误向外报告。只回滚却不抛错，应用可能以为一切成功。

**最后再运行CALL。** 初始库存10，申请2，余额应8。先查询当前库存，因为重复运行成功调用会继续扣，不会自动识别“这是上次同一请求”。

## 实际应用：成功与失败都要验证

```sql
SELECT id,quantity FROM kb_stock WHERE id=1;
CALL p_kb_take_stock(1,2,@remaining);
SELECT @remaining AS remaining;
SELECT id,quantity FROM kb_stock WHERE id=1;
-- 下面是独立失败测试，执行后观察错误与库存，不与成功测试一起盲跑。
CALL p_kb_take_stock(1,999999,@remaining);
```

如果初始库存仍为 10，成功调用后应为 8；重复调用会继续减少，过程不是自动幂等接口。失败调用不应扣库存；调用失败后以错误与重新查询为准，不依赖可能残留的用户变量作为成功信号。实际订单系统还需要业务唯一请求号等机制防止网络重试重复扣减。

用 `SHOW CREATE PROCEDURE p_kb_take_stock;` 查看定义。调用者需要 EXECUTE 及 INVOKER 模式下所需表权限。生产迁移应保存完整版本脚本；MySQL 修改过程主体通常需要重建，不能假定 ALTER PROCEDURE 能替换全部代码。

## 常见问题与解决方法

- **1064 语法错误**：检查 DELIMITER、END 后分隔符、DECLARE 顺序和是否完整选中定义。
- **过程已存在**：先查看旧定义。在实验库确认可替换后才 DROP PROCEDURE，再运行新版本，不删除陌生业务过程。
- **调用显示成功但应用没数据**：过程可能只设置 OUT 参数，调用方要读取；有些过程返回多个结果集，驱动需按其接口消费。
- **想在外层一起提交**：重新设计为调用者拥有事务、过程不主动提交的版本，不把当前例子嵌入外部事务。
- **授权后仍被拒绝**：区分创建、执行和底层数据权限，避免直接授予 ALL PRIVILEGES。

## 练习与参考答案

**练习：** 商品库存10，调用数量0、2、999三次，哪些应该成功？

**答案：** 0被参数校验拒绝；2成功后库存8；999被不足条件拒绝，库存应仍8。失败后重新查询核对，不把上一次的用户变量当作这一次成功证据。

**练习：** 网络超时后可以无限重试扣库存吗？不能。上次可能已提交，需要业务唯一请求号等幂等机制，本例未实现订单级防重复。

## 知识总结

存储过程的重点是接口、错误与事务边界，不是把很多 SQL 塞在 BEGIN 中。练习分别测试参数为 0、NULL、不存在编号及库存不足，记录每次错误和库存变化。

## 下一篇教程

[MySQL 游标与循环：逐行读取及 NOT FOUND 处理](/posts/sql-cursors/)

## 官方参考

[CREATE PROCEDURE](https://dev.mysql.com/doc/refman/8.4/en/create-procedure.html)、[条件处理](https://dev.mysql.com/doc/refman/8.4/en/condition-handling.html)、[SIGNAL](https://dev.mysql.com/doc/refman/8.4/en/signal.html)
