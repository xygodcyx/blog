---
title: secondline
tags:
  - 'code reading'
categories:
  - ''
date: 2026-01-27 10:58:17
---

# 免费用户发短信的流程

## 发送请求text_send

![text_send.png](/assets/senondline/20260127110212.png)

进入send_text_views方法（text_views.py:108）

用户账号不能包含：'nubix.store' in user.username or 'comfythings.com' in user.username

判断消息类型：图片 or 文字

执行实际发送短信函数：free_text.send_free_text(args), 拿到响应

进入到send_free_text后

判断是否有激活的订阅（plan）

没有的话看用户的积分是否足够发一次短信

免费用户只能在US里发

积分不够时看广告得积分：
call_app_referrer_utils.get_blog_url(account, from_channel=settings.SECONDLINE_BEFORE_TEXT_FROM_CHANNEL)