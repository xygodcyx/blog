---
title: STM32搞机笔记
tags:
  - 'STM32'
  - '硬件'
categories:
  - ''
date: 2026-04-07 15:36:09
---

## 光敏传感器

光敏传感器需要设置为上拉输入 (`GPIO_Mode_IPU`)

```c
  GPIO_InitTypeDef GPIO_InitStructure;
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_11;
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
  GPIO_Init(GPIOX, &GPIO_InitStructure);
```

一般0(`Bit_RESET`)为暗、1(`Bit_SET`)为亮
