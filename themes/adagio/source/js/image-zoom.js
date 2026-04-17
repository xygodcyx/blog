// source/js/image-zoom.js

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

    const rotateLeftBtn =
      document.getElementById('rotateLeftBtn')
    const rotateRightBtn = document.getElementById(
      'rotateRightBtn',
    )

    const zoomInBtn = document.getElementById('zoomInBtn')
    const zoomOutBtn = document.getElementById('zoomOutBtn')

    const zoomResetBtn =
      document.getElementById('zoomResetBtn')

    const locateBtn = document.getElementById(
      'locateImageBtn',
    )

    // 如果元素不存在，直接返回（由 Hexo 插件动态创建）
    if (!overlay) return

    // 获取所有文章图片
    const images = Array.from(
      document.querySelectorAll('.article-text img'),
    )

    // 如果没有图片，返回
    if (images.length === 0) return

    // 存储图片信息
    const imageList = images.map((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '图片',
      element: img,
    }))

    let currentIndex = 0
    const preloadedImages = new Map()
    let isUserScrollingThumbnails = false
    let scrollTimeout = null
    let autoScrollEnabled = true

    // ===== 缩放、拖拽、旋转相关变量 =====
    let scale = 1
    let translateX = 0
    let translateY = 0
    let rotation = 0 // 新增：旋转角度（度）
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let startTranslateX = 0
    let startTranslateY = 0

    // 移动端手势变量
    let initialDistance = 0
    let initialScale = 1

    // 创建缩放指示器
    const scaleIndicator = document.createElement('div')
    scaleIndicator.id = 'zoomScaleIndicator'
    scaleIndicator.className = 'zoom-scale-indicator'
    overlay.appendChild(scaleIndicator)

    function updateScaleIndicator() {
      const rotStr = rotation ? ` ${rotation}°` : ''
      scaleIndicator.textContent = `${scale.toFixed(1)}x${rotStr}`
      scaleIndicator.classList.add('show')
      clearTimeout(window.scaleIndicatorTimeout)
      window.scaleIndicatorTimeout = setTimeout(() => {
        scaleIndicator.classList.remove('show')
      }, 800)
    }

    // 禁止图片默认拖拽行为
    zoomedImg.setAttribute('draggable', 'false')

    // 应用变换到图片（缩放 + 平移 + 旋转）
    function applyTransform() {
      zoomedImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`
      zoomedImg.style.cursor = isDragging
        ? 'grabbing'
        : scale > 1
          ? 'grab'
          : 'default'
      updateScaleIndicator()
    }

    // 重置缩放、位置和旋转
    function resetTransform() {
      scale = 1
      translateX = 0
      translateY = 0
      rotation = 0
      applyTransform()
    }

    // 限制缩放范围（改为最大6）
    function clampScale(value) {
      return Math.min(6, Math.max(0.5, value))
    }

    // 旋转图片（每次90度）
    function rotateImage(delta) {
      rotation = (rotation + delta) % 360
      applyTransform()
    }

    // 步进缩放（每次0.1倍）
    function zoomStep(delta) {
      scale = clampScale(scale + delta)
      applyTransform()
    }

    // 定位并关闭
    function locateAndClose() {
      const targetImage = imageList[currentIndex].element
      if (targetImage) {
        targetImage.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        })
      }
      closeZoom()
    }

    // ===== 鼠标/触摸滚轮缩放 =====
    zoomedImg.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        scale = clampScale(scale + delta)
        applyTransform()
      },
      { passive: false },
    )

    // ===== 鼠标拖拽 =====
    zoomedImg.addEventListener('mousedown', (e) => {
      e.preventDefault()
      isDragging = true
      dragStartX = e.clientX
      dragStartY = e.clientY
      startTranslateX = translateX
      startTranslateY = translateY
      zoomedImg.style.cursor = 'grabbing'
    })

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      e.preventDefault()
      const dx = e.clientX - dragStartX
      const dy = e.clientY - dragStartY
      translateX = startTranslateX + dx
      translateY = startTranslateY + dy
      applyTransform()
    })

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false
        zoomedImg.style.cursor =
          scale > 1 ? 'grab' : 'default'
      }
    })

    // ===== 移动端触摸事件 =====
    function getDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    zoomedImg.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault()
        const touches = e.touches

        if (touches.length === 1) {
          // 单指：准备拖拽
          isDragging = true
          dragStartX = touches[0].clientX
          dragStartY = touches[0].clientY
          startTranslateX = translateX
          startTranslateY = translateY
          zoomedImg.style.cursor = 'grabbing'
        } else if (touches.length === 2) {
          // 双指：准备缩放
          isDragging = false
          initialDistance = getDistance(touches)
          initialScale = scale
        }
      },
      { passive: false },
    )

    zoomedImg.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault()
        const touches = e.touches

        if (touches.length === 1 && isDragging) {
          // 单指拖拽
          const dx = touches[0].clientX - dragStartX
          const dy = touches[0].clientY - dragStartY
          translateX = startTranslateX + dx
          translateY = startTranslateY + dy
          applyTransform()
        } else if (touches.length === 2) {
          // 双指缩放
          const currentDistance = getDistance(touches)
          if (initialDistance > 0) {
            const newScale = clampScale(
              initialScale *
                (currentDistance / initialDistance),
            )
            scale = newScale
            applyTransform()
          }
        }
      },
      { passive: false },
    )

    zoomedImg.addEventListener('touchend', (e) => {
      e.preventDefault()
      if (e.touches.length === 0) {
        isDragging = false
        initialDistance = 0
        zoomedImg.style.cursor =
          scale > 1 ? 'grab' : 'default'
      } else if (e.touches.length === 1) {
        // 从双指变成单指，切换为拖拽模式
        isDragging = true
        dragStartX = e.touches[0].clientX
        dragStartY = e.touches[0].clientY
        startTranslateX = translateX
        startTranslateY = translateY
        initialDistance = 0
      }
    })

    // ===== 原有功能继续 =====

    // 监听缩略图容器的滚动事件
    thumbnailContainer.addEventListener(
      'scroll',
      function () {
        isUserScrollingThumbnails = true
        autoScrollEnabled = false

        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }

        scrollTimeout = setTimeout(function () {
          isUserScrollingThumbnails = false
          autoScrollEnabled = true
        }, 2000)
      },
      { passive: true },
    )

    // 监听鼠标移入/移出
    thumbnailContainer.addEventListener(
      'mouseenter',
      function () {
        autoScrollEnabled = false
        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }
      },
    )

    thumbnailContainer.addEventListener(
      'mouseleave',
      function () {
        scrollTimeout = setTimeout(function () {
          autoScrollEnabled = true
          isUserScrollingThumbnails = false
        }, 1000)
      },
    )

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
        thumb.addEventListener('click', () => {
          autoScrollEnabled = false
          isUserScrollingThumbnails = true

          showImage(index)

          if (scrollTimeout) {
            clearTimeout(scrollTimeout)
          }
          scrollTimeout = setTimeout(function () {
            autoScrollEnabled = true
            isUserScrollingThumbnails = false
          }, 1500)
        })
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

    // 智能滚动缩略图
    function smartScrollToThumbnail(thumb) {
      thumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }

    // 显示指定索引的图片
    function showImage(index) {
      if (index < 0 || index >= imageList.length) return

      currentIndex = index
      const imgData = imageList[currentIndex]

      // 重置缩放、位置和旋转
      resetTransform()

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

      // 滚动缩略图
      const activeThumb =
        thumbnailContainer.children[currentIndex]
      if (activeThumb) {
        smartScrollToThumbnail(activeThumb)
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

      // 延迟清空图片
      setTimeout(() => {
        if (!overlay.classList.contains('active')) {
          zoomedImg.src = ''
          zoomedImg.alt = ''
          // 重置变换
          resetTransform()
        }
      }, 300)
    }

    // 事件监听
    if (closeBtn) {
      closeBtn.addEventListener('click', closeZoom)
    }

    // 旋转按钮事件
    if (rotateLeftBtn) {
      rotateLeftBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        rotateImage(-90)
      })
    }

    if (rotateRightBtn) {
      rotateRightBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        rotateImage(90)
      })
    }

    // 缩放按钮事件
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        zoomStep(0.5)
      })
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        zoomStep(-0.5)
      })
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        resetTransform()
      })
    }

    // 定位按钮事件
    if (locateBtn) {
      locateBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        locateAndClose()
      })
    }

    // 点击遮罩层关闭
    overlay.addEventListener('click', function (e) {
      return
      if (
        e.target === overlay ||
        e.target.classList.contains('zoom-main-container')
      ) {
        closeZoom()
      }
    })

    // 双击图片关闭并定位
    zoomedImg.addEventListener('dblclick', () => {
      locateAndClose()
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
          locateAndClose()
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
        case 'r':
        case 'R':
          resetTransform()
          break
        // 新增：旋转快捷键
        case '[':
        case '{':
          e.preventDefault()
          rotateImage(-90)
          break
        case ']':
        case '}':
          e.preventDefault()
          rotateImage(90)
          break
      }
    })

    // ===== 修改：只支持左右滑动切换图片，移除上下判断 =====
    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0

    overlay.addEventListener(
      'touchstart',
      (e) => {
        if (
          e.target.closest('.thumbnail-nav') ||
          e.target.closest('.zoom-nav-btn')
        ) {
          return
        }
        touchStartX = e.changedTouches[0].screenX
        touchStartY = e.changedTouches[0].screenY
      },
      { passive: true },
    )

    overlay.addEventListener(
      'touchend',
      (e) => {
        if (
          e.target.closest('.thumbnail-nav') ||
          e.target.closest('.zoom-nav-btn')
        ) {
          return
        }
        touchEndX = e.changedTouches[0].screenX
        touchEndY = e.changedTouches[0].screenY
        handleSwipe()
      },
      { passive: true },
    )

    function handleSwipe() {
      return
      const swipeThreshold = 50
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // 只处理水平滑动，且水平位移大于垂直位移（防止误触）
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > swipeThreshold
      ) {
        if (deltaX < 0) {
          nextImage() // 向左滑动，下一张
        } else {
          prevImage() // 向右滑动，上一张
        }
      }
    }
  }
})()
