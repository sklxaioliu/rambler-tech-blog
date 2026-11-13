---
title: "MySQL 知识图解 04：字段类型、字符集与精度选择"
date: 2026-11-13 08:00:16
updated: 2026-11-13 08:00:00
categories: [SQL 数据库]
tags: [MySQL, SQL, 知识图解, 数据库入门]
description: "为整数、金额、文字、日期与二进制内容选择合适类型。"
cover: /img/sql.svg
series: mysql-knowledge
series_order: 4
source_pages: "29-31"
---

本篇是 **MySQL 知识图解第 04 篇，共 19 篇**。[按顺序阅读整个系列](/mysql-learning/)。示例以 MySQL 8.4 为基线；查询篇使用[统一样例 SQL](/downloads/mysql-knowledge-lab.sql)，导入说明见系列首页。

## 学习目标

为编号、金额、姓名、日期和二进制内容选择合适的数据类型；理解长度、精度、字节和字符的区别；避免沿用旧教材中已经不适合新版本的类型写法。

## 先用一个例子理解

把字段类型想成收纳盒的规格。编号适合放进整数盒，工资适合放进精确小数盒，手机号虽然由数字组成，却通常应放进字符串盒，因为它不参与加减，而且可能包含前导零或国际区号。

例如金额 19.90，既关心数值，也关心小数精度；员工姓名“王小明”，关心的是字符是否完整保存，而不是能否作为数字计算。

## 基础知识

| 类型 | 适合的内容 | 关键点 |
| --- | --- | --- |
| TINYINT、SMALLINT、MEDIUMINT、INT、BIGINT | 整数 | 分别通常占 1、2、3、4、8 字节，范围不同 |
| DECIMAL(p,s) | 金额等精确十进制数 | p 是总位数，s 是小数位数 |
| FLOAT、DOUBLE | 允许近似的测量结果 | 不用来要求精确相等的金额计算 |
| CHAR(n)、VARCHAR(n) | 固定或可变长度字符串 | n 按字符计，实际空间与字符集有关 |
| TINYTEXT、TEXT、MEDIUMTEXT、LONGTEXT | 较长文本 | 容量上限按字节考虑，还受其他限制 |
| DATE、TIME、DATETIME、TIMESTAMP | 日期、时间、日期时间 | 含义、范围和时区处理不同 |
| BINARY、VARBINARY、BLOB | 二进制内容 | 处理字节，不应用文本排序规则 |

有符号 TINYINT 的常见范围是 -128 到 127；INT 的常见范围是 -2147483648 到 2147483647。整数显示宽度不是容量，例如旧写法 `INT(3)` 不代表只能保存三位数。新示例直接写 `INT`，不依赖已弃用的显示宽度和 ZEROFILL。

`DECIMAL(10,2)` 表示总共 10 位，其中 2 位在小数点后，并不是“10 位整数加 2 位小数”。是否允许负数、是否允许空值，仍要用列属性与约束表达。

`VARCHAR(100)` 表示最多 100 个字符，不承诺只占 100 字节。`utf8mb4` 中一个字符可能占多个字节，行大小、索引长度等也会限制设计。不能把 VARCHAR 的最大长度简单说成“65535 个汉字”。

## 图示详解

![字段值与类型选择](/img/mysql-guide/04.svg)

左框中的 19.90 对应精确金额，中框中的姓名对应文本，右框中的入职日期对应时间信息。箭头表示“根据业务含义选择类型”，不是看屏幕显示起来像什么就选择什么。

手机号和订单编码即使全部由数字组成，也常常属于文本标识。把它们转换成整数，可能丢失开头的零。

## 操作步骤

在自己的实验库中创建一个独立示例表：

```sql
CREATE TABLE type_demo (
  id BIGINT PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  published_on DATE,
  created_at DATETIME,
  image_bytes BLOB
);
INSERT INTO type_demo
  (id, product_name, price, published_on, created_at)
VALUES
  (1, '学习笔记本', 19.90, '2026-11-01', '2026-11-01 09:30:00');
SELECT product_name, price, published_on FROM type_demo;
DESCRIBE type_demo;
```

显式列名可以避免把日期写到金额位置。日期使用标准格式，别依赖含糊的字符串自动转换。`DATETIME` 适合保存明确的日期时间；`TIMESTAMP` 会涉及会话时区转换，选型时要先确定业务要记录的是当地时间还是一个跨时区的时间点。

比较字符串长度时，再运行：

```sql
SELECT CHAR_LENGTH('长沙') AS character_count,
       LENGTH(CONVERT('长沙' USING utf8mb4)) AS byte_count;
```

前者按字符统计；后者在此编码下按字节统计，这两个数的含义不同。

## 实际应用

商品价格使用 DECIMAL；商品名称使用 VARCHAR；商品介绍可以使用合适大小的 TEXT。图片可以由数据库保存字节，也可以放在受管理的文件存储中、由表保存路径或标识，选择取决于业务和维护方式。

CHAR、VARCHAR、TEXT 没有适用于所有场景的固定“速度排名”。查询方式、数据长度、索引和字符集都会影响结果。比较文本是否区分大小写，主要看排序规则；BLOB 的比较按字节进行，不能说它天然“不区分大小写”。

## 易错点

不要用 `FLOAT(m,d)` 的旧式展示方式代替金额精度设计；不要把 NULL 当成空字符串；也不要因为字段能保存很长的文本，就把每列都设成最大类型。合理上限能表达业务约束，减少异常输入。

## 知识总结

先确定字段代表什么，再选择类型、精度与约束。字符数和字节数分开理解，金额与近似测量值分开设计，日期时间则要考虑格式与时区语义。


## 下一篇教程

继续阅读：[MySQL 知识图解 05：建表、改表与结构检查](/posts/mysql-knowledge-05-table-ddl/)。

上一篇：[MySQL 知识图解 03：SQL 分类、语法与数据库管理](/posts/mysql-knowledge-03-database-sql/)。

## 参考资料

[MySQL 8.4 官方说明](https://dev.mysql.com/doc/refman/8.4/en/data-types.html)。本系列参考《MySQL》课程讲义的知识顺序，使用统一样例和重新绘制的图示说明。示例输出为给定数据的预期结果。
