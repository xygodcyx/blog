---
title: screen常用命令
tags:
  - ''
categories:
  - ''
date: 2025-12-15 14:22:55
---

## 常用命令

::: tip 提示
screen的命令是区分大小写的
:::

### 查看所有已运行的screen后台服务

``` sh
screen -ls
```

### 进入screen控制台运行后台命令

``` sh
screen -S {name}
```

执行完毕后使用CTRL A + D退出后台终端

### 重新进入后台服务

```sh
screen -r {name}
```

### 快捷关闭后台服务

```sh
screen -S {name} -X quit
```
