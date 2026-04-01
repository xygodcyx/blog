---
title: 使用vitest测试竞态条件时的坑
tags:
  - '坑'
categories:
  - ''
date: 2026-04-01 11:58:52
---


## 问题描述

当测试用例包含异步逻辑时，直接在`异步逻辑`函数里使用`expect`会导致测试失败

## 解决方案

不能直接在`异步函数`里直接使用`expect`函数，因为`watch`函数是同步的，`it`不会等待`异步函数`中的异步逻辑，需要在`it`中等待`watch`的异步逻辑调用完成

``` ts
  it('watch invalidate callback should be work', async () => {
    const data = reactive({
      a: 1,
      b: 2,
    });
    let globalValue = 0;
    watch(
      () => data.a,
      async (_newValue, _, onInvalidate) => {
        let isInvalidate = false;
        let res: number;
        onInvalidate(() => {
          isInvalidate = true;
        });
        if (data.a === 2) {
          res = await new Promise(re => {
            setTimeout(() => {
              re(999);
            }, 50);
          });
        } else {
          res = await new Promise(re => {
            setTimeout(() => {
              re(3);
            }, 100);
          });
        }

        if (!isInvalidate) {
          globalValue = res;
        }
      },
    );
    data.a++;
    data.a++;
    await new Promise(resolve => setTimeout(resolve, 500)); // 应该在这里等待
    expect(globalValue).toBe(3);
  });
```
