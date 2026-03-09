---
title: nuxt开发的一些坑
tags:
  - '坑'
  - 'nuxt'
categories:
  - ''
date: 2026-03-09 22:18:40
---


## 成也缓存，败也缓存

在使用`useAsyncData/useLazyAsyncData`时，一定要使用唯一key，不然缓存会冲突导致数据混乱

``` js
const { data: video, error } = await useAsyncData(`video-${id}`, () =>
  $fetch(`/api/video/${id}`), {
  default: () => null,
})
```

## 不要直接在顶层作用域里使用异步数据

使用watchEffect、onMounted、computed等函数式的写法

``` js
watchEffect(() => {
  // video 是上一步从数据库中加载的异步数据
  if (video) {
    useHead({
      title: video.value?.vod_name,
      script: [{
        type: 'application/ld+json',
        textContent: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          'name': video?.value?.vod_name,
          'description': video?.value?.vod_content,
          'uploadDate': video?.value?.last_updated,
          'thumbnailUrl': video?.value?.sources,
        }),
      }],
      meta: [
        {
          name: 'description',
          content: video.value?.vod_content || `this is ${video.value?.vod_name}` || 'title',
        },
      ],
    })
  }
})
```
