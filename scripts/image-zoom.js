// scripts/image-zoom.js

hexo.extend.filter.register(
  'after_render:html',
  function (str) {
    // 只在文章中添加功能
    if (!str.includes('article-text')) return str

    // 添加 HTML 结构
    // scripts/image-zoom.js 中的 html 常量修改为：

    const html = `
    <div class="image-zoom-overlay" id="imageZoomOverlay">
        <div class="image-zoom-close" id="imageZoomClose">&times;</div>
        
        <!-- 新增：旋转按钮组 -->
        <div class="zoom-rotate-buttons">
            <button class="zoom-rotate-btn" id="rotateLeftBtn" title="逆时针旋转 ( [ )">↺</button>
            <button class="zoom-rotate-btn" id="rotateRightBtn" title="顺时针旋转 ( ] )">↻</button>
        </div>

        <div class="zoom-scale-buttons">
            <button class="zoom-scale-btn" id="zoomOutBtn" title="缩小 (滚轮向下)">−</button>
            <button class="zoom-scale-btn" id="zoomInBtn" title="放大 (滚轮向上)">+</button>
        </div>
        
        <div class="image-counter" id="imageCounter">1 / 1</div>
        <div class="image-caption" id="imageCaption"></div>
        <div class="image-zoom-loading" id="imageZoomLoading" style="display: none;"></div>
        
        <div class="zoom-main-container">
            <img id="zoomedImage" class="zoomed-image" alt="zoomed image">
        </div>
        
        <button class="zoom-nav-btn prev" id="prevImage" disabled>&#10094;</button>
        <button class="zoom-nav-btn next" id="nextImage" disabled>&#10095;</button>
        
        <div class="thumbnail-nav">
            <div class="thumbnail-container" id="thumbnailContainer"></div>
        </div>
    </div>
    `

    const css = `
        <link rel="stylesheet" href="/css/image-zoom.css">
    `
    // 添加 JavaScript
    const js = `<script src='/js/image-zoom.js'></script>`

    // 将 CSS 和 JS 插入到页面中
    if (str.includes('</head>')) {
      str = str.replace('</head>', css + '</head>')
    } else {
      str = css + str
    }

    if (str.includes('</body>')) {
      str = str.replace('</body>', html + js + '</body>')
    } else {
      str = str + html + js
    }

    return str
  },
)
