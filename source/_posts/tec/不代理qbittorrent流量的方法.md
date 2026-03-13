---
title: 不代理qbittorrent流量的方法
tags:
  - 'qbittorrent'
categories:
  - ''
date: 2026-03-13 10:08:10
---


最近在捣鼓pt站，需要用到qb等种子客户端进行进行下载/上传，流量流水非常恐怖，如果不进行干预的话会导致魔法迅速流失，笔者已经经过教训了...所以开始研究怎么让qb不走代理，但笔者对网络拓扑等知识一窍不通，所以采用最傻瓜式的办法

先说说笔者踩的坑吧，刚开始想用DST-PORT qb的连接端口，但这样不行，这样设置只是让别人连我们的时候走直连，而不是我们连别人的时候，很多时候的流量大头都是下载（一是国内网络大都不对等，而是下载的人没那么多），所以这样不行，那么匹配进程呢，不知道是笔者用的魔法客户端不支持还是怎么回事，所以还是不行，没办法了，只能用反向思维，既然主动匹配qb不行，那么我们只要设置只允许常用端口走连接就能解决了，因为qb的端口不可能是常用端口，只能是高位随机端口，所有的pt站都是如此，所以可以放心拦截，操作如下：

``` js
1.拦截所有请求，让全部的请求都走直连
rules:
  # 让常用服务端口走代理
  - DST-PORT,80,Proxy    # HTTP
  - DST-PORT,443,Proxy   # HTTPS
  - DST-PORT,22,Proxy    # SSH
  - DST-PORT,25,Proxy    # SMTP
  - DST-PORT,465,Proxy   # SMTPS
  - DST-PORT,587,Proxy   # SMTP
  - DST-PORT,993,Proxy   # IMAPS
  - DST-PORT,995,Proxy   # POP3S
  - DST-PORT,8080,Proxy  # HTTP代理
  - DST-PORT,8443,Proxy  # HTTPS备选
  - DST-PORT,3306,Proxy  # MySQL
  - DST-PORT,5432,Proxy  # PostgreSQL
  - DST-PORT,3389,Proxy  # RDP

  # 其余所有流量直连
  - MATCH,DIRECT
```

问题解决