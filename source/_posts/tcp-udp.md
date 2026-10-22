---
title: TCP 与 UDP 协议详解
date: 2026-10-14 09:00:00
updated: 2026-10-22 11:00:00
categories: [网络协议]
tags: [TCP, UDP, 传输层]
description: 比较 TCP 字节流与 UDP 数据报，通过本机 Python 回显实验理解可靠性、消息边界与超时。
cover: /img/network.svg
---

## 学习目标

解释 TCP 与 UDP 的主要区别，知道端口号的作用，完成一个只监听本机回环地址的 UDP 实验，并理解“发送成功”为什么不代表对方应用已经处理。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### TCP像有序连续的水流，UDP像一封封独立明信片

TCP给应用一个有序字节流，应用仍要规定消息从哪里结束；你分两次写“你好”和“世界”，对方不保证恰好分两次读到。就像水流不会替你标出“这一杯”和“下一杯”的边界。

UDP每次发送一个独立数据报，但它自身不保证对方一定收到、按顺序收到或自动补发。应用可以自行增加确认与恢复机制，因此不能简单说所有UDP应用都不可靠。

端口像楼里的服务窗口。IP找到楼，端口区分找谁；TCP9999与UDP9999不是同一种协议的同一个窗口。

## 基础知识

TCP 提供可靠、有序的字节流，通过序号、确认、重传、流量控制与拥塞控制组织传输。三次握手用于建立连接状态，但成功连接不意味着业务请求一定成功。TCP 没有应用消息边界：两次 send 可能被一次 recv 读到，一次 send 也可能分多次读到。

UDP 发送独立数据报，保留消息边界，但自身不提供到达保证、排序或重传。应用可以在其上实现这些能力，QUIC 就是重要例子。因此不能简单说“UDP 永远快、只能丢包”。协议选择取决于业务时延、可靠性和实现需求。

同一数字的 TCP 与 UDP 端口属于不同传输协议空间。常见 Web 服务会使用 TCP 443，HTTP/3 则使用 QUIC/UDP，防火墙允许 TCP 443 不自动等于允许 UDP 443。

## 操作步骤：本机 UDP 回显实验

需要 Python 3，博客本身不需要该依赖。先在终端 A 保存以下代码为 `udp_server.py`，用 `python udp_server.py` 运行。

```python
import socket

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.bind(('127.0.0.1', 9999))
    print('仅监听本机 127.0.0.1:9999，Ctrl+C 结束')
    while True:
        data, peer = sock.recvfrom(2048)
        sock.sendto(data, peer)
```

再在终端 B 保存为 `udp_client.py` 并运行：

```python
import socket

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.settimeout(2)
    sock.sendto('你好，UDP'.encode('utf-8'), ('127.0.0.1', 9999))
    try:
        data, peer = sock.recvfrom(2048)
        print(peer, data.decode('utf-8'))
    except socket.timeout:
        print('两秒内没有收到响应')
```

服务器运行且端口可用时，客户端应看到回显。关闭服务端再运行客户端，可能超时，也可能由系统报告连接相关错误。UDP 的 sendto 返回不表示远端已接收，因此应用需要明确的等待和失败处理。

### 分步拆解：为什么这样操作

**先启动服务端。** 保存服务器代码并在终端A运行，看到监听提示后保持窗口打开。127.0.0.1只面向本机，本例不需要给互联网开放端口。

**再开第二个终端运行客户端。** sendto发送UTF-8编码后的字节；recvfrom等待响应并返回数据及发送者地址。encode像把文字装成字节，decode像把字节还原文字，两边编码必须一致。

**理解超时。** settimeout(2)表示两秒内没响应就结束等待，不是“保证两秒送到”。关闭服务端再运行客户端，可能超时或得到系统错误，说明发送调用返回不等于对方处理成功。

**实验结束关自己的服务。** 用Ctrl+C停止终端A，不结束不认识的系统进程。

## 实际应用：选择传输方式

文件传输需要完整、有序内容，可使用 TCP，并在应用层增加校验与完成确认。实时语音可能允许丢弃过时数据，常使用 UDP 配合抖动缓冲、丢包恢复与拥塞控制。不要为“低延迟”无限制重发或淹没网络。

如果自己设计 TCP 文本协议，要使用换行、固定长度或长度前缀定义消息边界，并循环读取足够数据。不要假设 `recv(1024)` 必定拿到整条消息。

## 常见问题与解决方法

- **Address already in use**：已有进程占用 9999，结束你自己的旧实验服务，或同时更改两端端口。
- **客户端一直等待**：确认服务端运行和端口一致，保留超时，不要无限阻塞。
- **中文乱码**：两端统一 UTF-8 编码与解码。
- **TCP 就不会出错吗**：连接仍可能超时、断开；应用需处理异常，并确定业务是否可重试，避免重复下单等问题。

## 练习与参考答案

**练习：** TCP一次send发送100字节，对方一次recv(100)一定返回100字节吗？不一定，需要按协议循环读取。

**练习：** UDP客户端显示发送成功，是否能证明服务器保存了数据？不能，需要业务层响应与确认；超时重试也要考虑重复处理。

## 知识总结

TCP 提供可靠字节流，应用定义消息；UDP 提供数据报，应用承担所需的可靠性策略。无论用哪个，都需要超时和业务确认。

## 下一篇教程

[HTTP、HTTPS、DNS 工作原理](/posts/http-https-dns/)

## 官方参考

[RFC 9293 TCP](https://www.rfc-editor.org/rfc/rfc9293)、[RFC 768 UDP](https://www.rfc-editor.org/rfc/rfc768)、[Python socket](https://docs.python.org/3/library/socket.html)
