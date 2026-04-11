---
title: fork cpu
tags:
  - '硬件'
  - 'cpu'
  - 'logicCircuit'
categories:
  - ''
date: 2025-09-28 10:11:35
---

本文是笔者使用logic circuit模拟出一个8bit计算机的思考过程，仅做记录

---

## 真值表与卡诺图

1. 真值表可以辅助我们**构建**逻辑电路

1. 卡诺图可以辅助我们**简化**真值表达式

例如任意一个真值表：

| A   | B   | S   |
| --- | --- | --- |
| 0   | 0   | 0   |
| 0   | 1   | 1   |
| 1   | 0   | 1   |
| 1   | 1   | 0   |

那么表达式为：

\begin{equation} S = \overline A + B \end{equation}
