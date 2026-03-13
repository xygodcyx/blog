---
title: Git多人合作笔记
date: 2025-09-19
tags: ['技术笔记']
categories: ['技术']
author: QuHou
excerpt: 多人合作流程
---

## 初始配置

设置用户名：

``` bash
git config --global  user.name "you name"
```

设置邮箱：

``` bash
git config --global user.email "you email"
```

生成密钥：

``` bash
ssh-keygen -t rsa -C "you email"
```

``` bash
cat ~/.ssh/id_ed25519.pub
```

在密钥默认保存路径`C:\Users\Administrator\.ssh`中找到`id_rsa.pub`文件，复制其内容粘贴到 [SSH and GPG keys](https://github.com/settings/keys) 的SSH keys中，记得New SSH key

把复制的公钥复制到到 [github key](https://github.com/settings/keys)

``` bash
ssh -T git@github.com
```

注意：如果你之前不知道为了什么把ssh连接强制替换成https了，那么很遗憾，你就无法通过ssh连接github了，解决办法是：

``` bash
git config --global --unset url.https://.insteadof
```

## 常用命令

``` bash
 暂存：git add . #注：git add filename可以指定要暂存的文件
 提交：git commit -am"本次开发的总结" #注：一定要写清楚，方便版本回退时查找
 推送：git push #注：第一次提交要写git push origin 分支名称
 拉取：git pull
 创建分支：git checkout -b 分支名称
 切换分支：git checkout 分支名称
 合并分支：git merge 要分支名称的分支名称 #注：在合并前呀切换到主分支或想要被合并的分支
 查看提交日志：git log
 版本回退：git reset 提交的hash代码 #注：提交id可以从git log命令输出的日志中查看（前四位即可）
 设置远程库：git remote add origin 仓库的的ssh地址 (.git结尾)
 克隆：git clone 仓库地址
 设置代理（http）:  git config --global http.proxy http://127.0.0.1:7890
 设置代理（https）: git config --global https.proxy https://127.0.0.1:7890
 
```

## 多人共用博客流程

1. 邀请协作者加入博客仓库的合作者

2. 协作者和创建者写笔记之前都pull一下，发现有冲突再一起究竟商量保留谁的内容

3. 写完笔记后一方push，另一方pull，回到步骤2

4. 循环2-3步骤持续推进笔记写作

## 多人开发项目流程

1. 队长创建仓库，邀请队员加入

2. 队长初始化仓库，然后 push 进 main 分支，队员再 pull 下来

3. 队长给队员布置任务，每个队员新建自己的分支（不要直接修改 main 分支，包括队长自己）

4. 每个队员再自己的分支上开发功能，开完完毕后 push 自己的分支，然后队长可以 pull 分支，并检查是否用问题，没问题的话就可以合并进 main 分支

5. 在切换分支前，先 pull 一下，保证分支是最新的，切换后也应该 pull 一下，保证是最新的再进行开发/合并操作
