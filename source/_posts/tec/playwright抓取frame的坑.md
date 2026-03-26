---
title: playwright抓取frame的坑
tags:
  - '坑'
  - 'playwright'
categories:
  - ''
date: 2026-03-26 22:49:33
---

今天使用playwright抓取某星网站的时候遇到了多层iframe嵌套时无法抓取的情况：

``` html
<iframe id="iframe" src="/iframe1/index.html">
  <iframe src="/iframe2/index.html">
    <iframe id="frame_content">
      content
    <iframe>
  <iframe>
</iframe>
```

解决办法如下：

``` js
const wrapFrame = page.frameLocator(
  'iframe#iframe',
);

const taskFrame = wrapFrame.frameLocator(
  'iframe[src*="iframe2/index.html"]',
);

const finalQuizFrame = taskFrame.frameLocator(
  'iframe#frame_content',
);
```

当遇到多个iframe时，每个locator的selector一定要明确指向唯一的iframe，否则会抓取失败
