---
title: chaoxing自动刷课工具介绍
tags:
  - '工具'
categories:
  - ''
date: 2026-03-27 17:27:38
---


hello，大家好呀，今天分享一款我新开发的工具，这个工具可以静默地自动刷超星网课，跟浏览器里的插件有点不一样，你不需要打开浏览器，只需要在命令行里操作，不仅支持window、mac等图形化操作系统，还支持纯命令行的操作环境，比如服务器版本的linux或ssh环境，在服务器上用的时候可以不间断刷课，非常好用

## 安装依赖

``` bash
npm i chaoxing -g
```

``` bash
npx playwright install
```

先来演示一下功能吧

## 帮助

``` bash
chaoxing -h
```

``` bash
chaoxing login -h
```

``` bash
chaoxing run -h
```

...

## 登录

使用`chaoxing login`命令进行登录

也支持命令行参数-p -w -s

## 执行任务

使用`chaoxing run`开启任务

支持 -p -c -t -s -o

工具支持刷课和答题，其中刷课任务运行得很好，但是答题因为没有题库所以只能用ai来答题，又因为超星的答题页面做了混淆，本地字符库又不太全，所以正确率不高，但是如果你愿意折腾的话，可以下载源码在本地运行，本地运行时会实时解码混淆字符正确率在80左右

可以使用-o只执行刷课任务，不执行答题任务

## 清理缓存

使用chaoxing clear清理缓存
支持-p和-a

## 查看配置目录

使用`chaoxing where`查看配置目录，如果要使用答题功能的话，你需要在.env文件里配置`DEEPSEEK_API_KEY`字段，否则还是会只执行刷课任务

支持-p和-g

## 重选课程

使用`chaoxing reselect`重选课程，同样支持-p参数
