---
title: Ubuntu Linux 虚拟机安装
date: 2026-10-09 09:00:00
updated: 2026-10-22 11:00:00
categories: [虚拟机技术]
tags: [Ubuntu, Linux, VMware]
description: 安装 Ubuntu 24.04 LTS 桌面实验机，完成更新、open-vm-tools 集成与第一组终端练习。
cover: /img/vm.svg
---

## 学习目标

能在独立虚拟磁盘安装 Ubuntu，识别安装目标，运行基础 Linux 命令，并知道怎样排查 Tools 和网络。本文选择 Ubuntu 24.04 LTS，点版本会更新，界面细节以实际 ISO 为准。

<!-- beginner-revision-2026-10-22 -->

## 先用一个例子理解

### sudo像临时借用管理员钥匙

平时用自己的普通账号工作，安装软件等管理操作才通过sudo执行。它要求输入当前用户的密码；终端不显示星号不代表键盘坏了，输入后按Enter即可。

apt update像更新商店商品目录，apt upgrade才是根据目录升级已安装软件。看到“目录更新完成”不能说所有软件都已升级。

家目录符号~像“我的文件夹”快捷地址。~/tech-lab表示当前用户家目录下的tech-lab，不是Windows上的D盘路径。

## 基础知识

LTS 是长期支持版本，适合作为持续学习基线。ISO 只提供安装介质；安装完成后的系统保存在虚拟磁盘中。Linux 的管理员操作常用 `sudo` 临时提权，输入账户密码时终端不显示字符属于正常行为。

在 VMware 的 Linux 客户机中，通常优先使用发行版提供的 `open-vm-tools`，桌面环境配合 `open-vm-tools-desktop`。不要同时安装多个来源的 Tools 包造成冲突。

## 操作步骤

1. 从 Ubuntu 官方下载适合宿主架构的 24.04 LTS Desktop ISO。对照官方校验说明检查 SHA256，不能只算一个值却不与可信发布值比较。
2. 在 Workstation 新建 Linux / Ubuntu 虚拟机，分配 2 个 vCPU、4 GB 内存、40 GB 磁盘作为实验起点，宿主需要有余量。
3. 网络选 NAT，挂载 ISO，启动进入安装器。可以先试用确认界面与输入正常，再选择安装。
4. 设置语言、键盘、时区与用户。安装目标必须是本实验机新建的虚拟磁盘。安装器的“擦除磁盘”会清空选中的目标；有疑问时停下来核对磁盘大小与配置。
5. 完成安装后重启，按提示移除安装介质，防止再次启动安装器。
6. 登录桌面，打开终端，更新软件索引和现有软件，再安装集成组件。

```bash
sudo apt update
sudo apt upgrade
sudo apt install open-vm-tools open-vm-tools-desktop
sudo reboot
```

逐条执行并阅读提示。`apt update` 更新包索引，不是直接升级所有软件；`apt upgrade` 才升级现有包。新安装的软件必须来自你信任的软件仓库。

### 分步拆解：为什么这样操作

**新建时先用NAT。** 这样多数入门环境更容易共享宿主外网，但仍需检查实际网络，不把模式选择当作联网成功的证据。

**选安装目标前停一下。** 确认新建虚拟盘容量与设置一致，再操作安装器。这里不需要制作实体U盘，因为ISO直接作为虚拟光驱使用。

**登录后逐条运行命令。** 先apt update，读完是否有错误，再upgrade，再安装集成组件。把所有命令一次粘贴进去，可能错过第一步失败的原因。

**创建笔记验证写入。** mkdir建立目录，printf把一行文字写进hello.txt，cat读回来。>会覆盖同名文件，所以先在专用练习目录操作。

## 实际应用：建立 Linux 学习目录

```bash
cat /etc/os-release
uname -r
mkdir -p ~/tech-lab
printf '我的第一台 Linux 实验机\n' > ~/tech-lab/hello.txt
cat ~/tech-lab/hello.txt
ip addr
ip route
```

`~` 代表当前用户家目录。`>` 会覆盖目标文件，因此不要随意换成重要文件路径。`cat` 输出文件内容；`ip addr` 和 `ip route` 分别查看接口地址与路由。记录系统版本、内核版本与网络模式，方便重现实验。

![原创虚拟机结构示意图：宿主与独立实验环境](/img/vm.svg)

点击上图可以测试博客的图片放大功能。图是本项目原创示意，不是安装器截图。

## 常见问题与解决方法

- **apt 无法获取软件**：先检查 IP、默认路由、DNS 与日期，不要先禁用证书验证。
- **分辨率不能自适应**：确认 desktop 组件安装成功，重启或重新登录，检查虚拟机显示设置。
- **忘记 sudo 密码**：它通常是你安装时创建用户的密码，不是宿主 Windows 密码。
- **安装器看不到盘**：关闭虚拟机后检查虚拟硬盘是否存在和连接，确认客户机类型及控制器兼容性。

## 练习与参考答案

**练习：** apt update成功但upgrade失败，能写“系统已更新完毕”吗？不能，应记录实际失败点和错误信息。

**练习：** cat提示文件不存在，先查哪里？检查路径拼写、当前用户和文件是否真的创建；可先运行ls ~/tech-lab查看，不必重新安装系统。

## 知识总结

安装只是起点，系统更新、Tools 集成、网络检查与文件练习共同构成可用环境。保持实验数据与系统恢复点分开管理。

练习：创建第二个文本文件，再用 `ls -l ~/tech-lab` 检查目录内容；不要对不熟悉的路径使用递归删除命令。

## 下一篇教程

[虚拟机网络配置与快照管理](/posts/vm-network-snapshots/)

## 官方参考

[Ubuntu 安装教程](https://ubuntu.com/tutorials/install-ubuntu-desktop)、[Ubuntu VMware Tools 说明](https://help.ubuntu.com/community/VMware/Tools)
