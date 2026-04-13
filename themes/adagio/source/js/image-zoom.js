;(function () {
  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initImageZoom,
    )
  } else {
    initImageZoom()
  }

  function initImageZoom() {
    const overlay = document.getElementById(
      'imageZoomOverlay',
    )
    const zoomedImg = document.getElementById('zoomedImage')
    const closeBtn = document.getElementById(
      'imageZoomClose',
    )
    const loading = document.getElementById(
      'imageZoomLoading',
    )
    const prevBtn = document.getElementById('prevImage')
    const nextBtn = document.getElementById('nextImage')
    const counter = document.getElementById('imageCounter')
    const caption = document.getElementById('imageCaption')
    const thumbnailContainer = document.getElementById(
      'thumbnailContainer',
    )

    // 如果元素不存在，动态创建
    if (!overlay) {
      document.body.insertAdjacentHTML(
        'beforeend',
        `${html.replace(/`/g, '\\\\`')}`,
      )
      return initImageZoom() // 重新初始化
    }

    // 获取所有文章图片
    const images = Array.from(
      document.querySelectorAll('.article-text img'),
    )

    // 存储图片信息
    const imageList = images.map((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '图片',
      element: img,
    }))

    let currentIndex = 0
    let preloadedImages = new Map()

    // 生成缩略图
    function generateThumbnails() {
      thumbnailContainer.innerHTML = ''
      imageList.forEach((img, index) => {
        const thumb = document.createElement('img')
        thumb.src = img.src
        thumb.alt = img.alt
        thumb.className =
          'thumbnail' +
          (index === currentIndex ? ' active' : '')
        thumb.addEventListener('click', () =>
          showImage(index),
        )
        thumbnailContainer.appendChild(thumb)
      })
    }

    // 预加载图片
    function preloadImage(index) {
      if (index < 0 || index >= imageList.length) return
      if (preloadedImages.has(index)) return

      const img = new Image()
      img.src = imageList[index].src
      preloadedImages.set(index, img)
    }

    // 预加载相邻图片
    function preloadAdjacent(index) {
      preloadImage(index - 1)
      preloadImage(index)
      preloadImage(index + 1)
    }

    // 显示指定索引的图片
    function showImage(index) {
      if (index < 0 || index >= imageList.length) return

      currentIndex = index
      const imgData = imageList[currentIndex]

      // 显示加载动画
      loading.style.display = 'block'
      zoomedImg.style.opacity = '0.5'

      // 更新图片
      zoomedImg.src = imgData.src
      zoomedImg.alt = imgData.alt
      caption.textContent = imgData.alt

      // 图片加载完成
      const tempImg = new Image()
      tempImg.onload = function () {
        loading.style.display = 'none'
        zoomedImg.style.opacity = '1'
        preloadAdjacent(currentIndex)
      }
      tempImg.onerror = function () {
        loading.style.display = 'none'
        zoomedImg.style.opacity = '1'
        caption.textContent = imgData.alt + ' (加载失败)'
      }
      tempImg.src = imgData.src

      if (tempImg.complete) {
        tempImg.onload()
      }

      // 更新 UI
      updateUI()

      // 滚动缩略图到可视区域
      const activeThumb =
        thumbnailContainer.children[currentIndex]
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }

    // 更新 UI 状态
    function updateUI() {
      // 更新计数器
      counter.textContent =
        currentIndex + 1 + ' / ' + imageList.length

      // 更新导航按钮状态
      prevBtn.disabled = currentIndex === 0
      nextBtn.disabled =
        currentIndex === imageList.length - 1

      // 更新缩略图激活状态
      Array.from(thumbnailContainer.children).forEach(
        (thumb, idx) => {
          if (idx === currentIndex) {
            thumb.classList.add('active')
          } else {
            thumb.classList.remove('active')
          }
        },
      )
    }

    // 下一张
    function nextImage() {
      if (currentIndex < imageList.length - 1) {
        showImage(currentIndex + 1)
      }
    }

    // 上一张
    function prevImage() {
      if (currentIndex > 0) {
        showImage(currentIndex - 1)
      }
    }

    // 为每个图片添加点击事件
    images.forEach((img, index) => {
      img.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()

        currentIndex = index

        // 生成缩略图（如果还没有）
        if (thumbnailContainer.children.length === 0) {
          generateThumbnails()
        }

        // 显示遮罩层
        overlay.classList.add('active')
        document.body.style.overflow = 'hidden'

        // 显示图片
        showImage(currentIndex)
      })
    })

    // 关闭功能
    function closeZoom() {
      overlay.classList.remove('active')
      document.body.style.overflow = ''

      // 延迟清空图片，避免关闭动画看到图片变化
      setTimeout(() => {
        if (!overlay.classList.contains('active')) {
          zoomedImg.src = ''
          zoomedImg.alt = ''
        }
      }, 300)
    }

    // 事件监听
    if (closeBtn) {
      closeBtn.addEventListener('click', closeZoom)
    }

    // 点击遮罩层关闭（但不包括导航按钮和缩略图）
    overlay.addEventListener('click', function (e) {
      if (
        e.target === overlay ||
        e.target.classList.contains('zoom-main-container')
      ) {
        closeZoom()
      }
    })

    // 点击主图片也可以关闭
    zoomedImg.addEventListener('click', () => {
      // 滚动页面到对应的原图位置
      const targetImage = imageList[currentIndex].element
      if (targetImage) {
        // 使用平滑滚动将原图滚动到视口中央
        targetImage.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        })
      }
      closeZoom()
    })

    // 导航按钮
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      prevImage()
    })

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      nextImage()
    })

    // 键盘操作
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('active')) return

      switch (e.key) {
        case 'Escape':
          closeZoom()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevImage()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextImage()
          break
        case 'Enter':
          e.preventDefault()
          const targetImage =
            imageList[currentIndex].element
          if (targetImage) {
            // 使用平滑滚动将原图滚动到视口中央
            targetImage.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center',
            })
          }
          closeZoom()
          break
        case 'Home':
          e.preventDefault()
          if (imageList.length > 0) showImage(0)
          break
        case 'End':
          e.preventDefault()
          if (imageList.length > 0)
            showImage(imageList.length - 1)
          break
      }
    })

    // 触摸滑动支持
    let touchStartX = 0
    let touchEndX = 0

    overlay.addEventListener(
      'touchstart',
      (e) => {
        if (
          e.target.classList.contains('thumbnail-nav') ||
          e.target.classList.contains('thumbnail-nav')
        ) {
          return
        }
        touchStartX = e.changedTouches[0].screenX
      },
      { passive: true },
    )

    overlay.addEventListener(
      'touchend',
      (e) => {
        if (
          e.target.classList.contains('thumbnail-nav') ||
          e.target.classList.contains('thumbnail-nav')
        ) {
          return
        }
        touchEndX = e.changedTouches[0].screenX
        handleSwipe()
      },
      { passive: true },
    )

    function handleSwipe() {
      const swipeThreshold = 50
      const diff = touchStartX - touchEndX

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          nextImage() // 向左滑动，下一张
        } else {
          prevImage() // 向右滑动，上一张
        }
      }
    }
  }
})()
