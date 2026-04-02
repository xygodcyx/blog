---
title: 重学ts
tags:
  - '重学'
  - 'ts'
categories:
  - ''
date: 2026-04-02 13:26:31
---

[教程地址](https://www.bilibili.com/video/BV1L2rdB9ECo)

---

## 知识点

### 筛选器联合类型

``` ts

type Circle{
  kind: "circle";
  radius: number;
}

type Square{
  kind: "square";
  slideLength: number;
}

type Shape = Circle | Square

```

``` ts

// 使用分支语句收缩类型
if(s.kind === "circle"){
  s type is Circle 
}else if(s.kind === "square"){
  s type is Square
}

```

## 小技巧

### switch true

![20260402134826.png](../../assets/重学ts/20260402134826.png)

## 刷题

[type-challenges](https://github.com/type-challenges/type-challenges)

[视频教程](https://www.bilibili.com/video/BV1vY41187Tx)

学习方法：先用js函数写出来，再翻译成ts类型语法，遇到不会的就查，肯定可以写出来，因为ts的类型语法是图灵完备的，记得总结用到的知识点

### pick

题目描述：

![20260402154847.png](../../assets/重学ts/20260402154847.png)

答案

``` ts
type MyPick<T, K extends keyof T> = {
    [P in K]: T[P]
};


// 刷题思路，先写JS函数，再翻译成TS类型
// function myPick(todo, keys) {
//   const obj = {};
//   keys.forEach(key => {
//     if (key in todo) {
//       obj[key] = todo[key];
//     }
//   });
//   return obj;
// }

/**
 * 1. 返回对象
 * 2. 遍历 keys mapped
 * 4. 判断 key 是否存在与 todo.keys()
 * 3. 取值 todo[key] indexed
 */
```

#### pick知识点

- [mapped文档](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#handbook-content)

- [indexed文档](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html#handbook-content)
