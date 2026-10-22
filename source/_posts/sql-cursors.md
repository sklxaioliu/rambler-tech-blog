---
title: MySQL 游标与循环：逐行读取及 NOT FOUND 处理
date: 2026-10-22 08:36:00
updated: 2026-10-22 11:00:00
categories: [SQL 数据库]
tags: [MySQL, 游标, 存储过程, 循环]
description: 完整演示 DECLARE CURSOR、OPEN、FETCH、CLOSE 和退出处理，比较游标与集合 SQL 的适用场景。
cover: /img/sql.svg
---

## 学习目标

能解释游标生命周期，写出不会在取完数据后继续处理旧值的循环，并知道何时不应使用游标。基于 MySQL 8.4，先完成 [存储过程教程](/posts/sql-procedures/) 并准备统一样例库。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### 游标像把一叠订单拿在手上，一张张翻

OPEN把这次要读取的结果准备好；FETCH拿下一张并把金额放进变量；处理完再FETCH；没有下一张时设置结束标志，退出循环；CLOSE收起这次读取过程。

关键是“拿到新的一张了吗”。没拿到却继续用手里旧金额，就会把最后一张重复加一次。因此FETCH后先检查v_done，再累加，不能反过来。

只求总和时，SUM像直接把整叠交给计算器，比逐张翻更简洁。游标用于确实需要逐条流程控制的情况，不是看到复杂SQL就必须用。

## 基础知识

游标允许在存储程序中逐行读取查询结果。MySQL 存储程序游标是只读、不可滚动、asensitive：不能借游标直接更新当前行，不能随意回到上一行，服务端可能复制也可能不复制结果。不要把它当作独立于事务的固定历史快照。

多数汇总、更新、插入应优先考虑集合 SQL，如 SUM、UPDATE…JOIN、INSERT…SELECT。游标适合确实需要逐条控制流程的场景；逐行处理开销和锁/事务管理成本可能更高。本文用汇总演示语法，不建议实际为求和改用游标。

## 操作步骤：创建完整过程

DECLARE 的顺序有要求：变量和条件在前，游标在后，处理器最后，再写执行语句。以下在 mysql 客户端完整运行：

```sql
USE tech_advanced;
DELIMITER $$
CREATE PROCEDURE p_kb_cursor_total(
  OUT p_total DECIMAL(12,2),
  OUT p_count INT
)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_amount DECIMAL(10,2);
  DECLARE cur_orders CURSOR FOR
    SELECT amount FROM kb_order WHERE status='paid' ORDER BY id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  SET p_total = 0;
  SET p_count = 0;
  OPEN cur_orders;
  read_loop: LOOP
    FETCH cur_orders INTO v_amount;
    IF v_done THEN
      LEAVE read_loop;
    END IF;
    SET p_total = p_total + v_amount;
    SET p_count = p_count + 1;
  END LOOP;
  CLOSE cur_orders;
END$$
DELIMITER ;

CALL p_kb_cursor_total(@total,@count);
SELECT @total AS total,@count AS order_count;
```

初始样例 paid 金额 120、80、200，共 400，条数为 3。流程是声明→打开→取一行→检查结束→处理→再次取行→关闭。没有结果也会在第一次 FETCH 后触发 NOT FOUND，返回总额 0 与条数 0。

关键细节是 **先检查 v_done，再处理 v_amount**。FETCH 取不到新行时，不应继续把变量中的旧金额再次累加；把检查写在累加之后，是常见的“最后一行重复计算”错误。

### 分步拆解：为什么这样操作

**按声明顺序读代码。** v_done是停止旗子，v_amount暂存当前金额；cur_orders说明读哪些记录；NOT FOUND处理器说明“取不到下一行时怎么办”。这些定义要放在可执行语句之前。

**手工模拟前三次。** 初始v_done为FALSE，总额0。第一次FETCH取120，加后120；第二次80，加后200；第三次200，加后400。

**第四次最重要。** 已没有新行，NOT FOUND把v_done设TRUE。IF看到结束，LEAVE离开循环，不再使用旧的v_amount。结果保持400和3条，而不是600和4条。

**空集也要模拟。** 第一次FETCH就取不到，直接退出，总额与条数都仍0。无需删除原表数据，只在另一个练习过程里换一个不存在状态测试。

## 实际应用：与集合查询对照

```sql
SELECT COALESCE(SUM(amount),0) AS total,COUNT(*) AS order_count
FROM kb_order WHERE status='paid';
```

两种写法应得到相同结果，集合查询更简洁。本例不修改数据，也不主动控制事务；如果调用者要求与其他查询处于一致视图中，应明确隔离级别和事务边界，而不是认为游标天然解决一致性。

需要测试空结果，可在**新的练习过程副本**中将筛选改为不存在的状态，如 `status='never_used'`，用不同过程名创建，再调用检查 0 和 0。不必为了测试而删除所有订单。

若循环里再加 SELECT…INTO，它取不到行也可能触发同一个 NOT FOUND 处理器，从而把“查不到附加信息”误当成“游标读完”。应在嵌套 BEGIN…END 块内给附加查询设置局部处理器，让不同的结束信号作用域分开。

## 常见问题与解决方法

- **死循环**：没有 FETCH、没有检查结束标志或 LEAVE 的标签错误。先用小数据验证。
- **最后一行重复**：将结束判断移到 FETCH 后、业务处理前。
- **FETCH 列数不匹配**：SELECT 几列就准备几个类型合适的目标变量，顺序必须对应。
- **OPEN 报错**：游标不能无条件重复打开；核对打开/关闭流程与异常退出。
- **运行很慢**：先尝试集合 SQL；确需批量逐行处理时，设计批次、检查点与错误策略，避免超长事务。

## 练习与参考答案

**练习：** 如果把SET p_total放在IF v_done判断之前，可能出现什么？

**答案：** 取完数据后继续把旧金额计入，最后一行可能重复计算。先判断“有没有新值”，再处理值。

**练习：** 循环里额外SELECT INTO查不到数据，为什么也可能提前退出？它可能触发同一NOT FOUND处理器。应划分嵌套块与局部处理器，不把不同的“没找到”混成一个停止信号。

## 知识总结

游标是控制流程的工具，不是复杂查询的默认答案。练习画出空集、一行、三行三种循环路径，说明每次 FETCH 和退出检查发生在哪里。

## 下一篇教程

[MySQL 账号权限、备份与恢复演练](/posts/sql-backup-security/)

## 官方参考

[MySQL 游标与声明顺序](https://dev.mysql.com/doc/refman/8.4/en/cursors.html)、[处理器](https://dev.mysql.com/doc/refman/8.4/en/declare-handler.html)
