---
title: playwright含竞态条件的二元问题处理
tags:
  - 'playwright'
categories:
  - ''
date: 2026-03-27 14:10:24
---

问题描述：

当使用playwright遇到某个任务的结果是互斥时（结果为A时无法知道B的状态，结果为B时无法知道A的状态），就可以使用以下方法解决

``` js
try {
      // 2. 使用 Promise.race 监听两种可能的结果
      await Promise.race([
        // 情况 A：发现错误提示元素（设置一个较短的超时，比如 3 秒）
        page
          .waitForSelector('.err-tip', {
            state: 'visible',
            timeout: 3000,
          })
          .then(() => 'error'),

        // 情况 B：监听到跳转成功
        page
          .waitForURL(
            /^https:\/\/i\.mooc\.chaoxing\.com\/space\/index\?.*$/,
            { timeout: 15000 },
          )
          .then(() => 'success'),
      ]).then(async result => {
        if (result === 'error') {
          const errTip = await page
            .locator('.err-tip')
            .textContent();
          LoggerManager.Instance.error(
            `登录失败，请检查原因: ${errTip?.trim()}`,
          );
          process.exit(0);
        }

        // End of authentication steps.
        LoggerManager.Instance.start(
          '登录成功，正在保存会话状态...',
        );
      });
    } catch (e) {
      // 处理超时或其他意外情况
      LoggerManager.Instance.error(
        '登录响应超时，请检查网络或验证码状态',
      );
      process.exit(1);
    }

```

使用Promise的race函数进行多选一操作
