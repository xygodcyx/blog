// scripts/image-zoom.js

hexo.extend.filter.register(
  'after_render:html',
  function (str) {
    // 只在文章中添加功能
    if (!str.includes('article-text')) return str

    // 添加 CSS
    const css = `
        <style>
            /* 图片放大遮罩层 */
            .image-zoom-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.95);
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .image-zoom-overlay.active {
                display: block;
                opacity: 1;
            }
            
            /* 主图片容器 */
            .zoom-main-container {
                position: relative;
                width: 100%;
                height: calc(100% - 120px);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            /* 放大的图片 */
            .image-zoom-overlay .zoomed-image {
                max-width: 85%;
                max-height: 85%;
                object-fit: contain;
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
                border-radius: 4px;
                transform: scale(0.9);
                transition: transform 0.3s ease;
                cursor: pointer;
            }
            
            .image-zoom-overlay.active .zoomed-image {
                transform: scale(1);
            }
            
            /* 关闭按钮 */
            .image-zoom-close {
                position: absolute;
                top: 20px;
                right: 30px;
                color: #fff;
                font-size: 40px;
                font-weight: bold;
                cursor: pointer;
                z-index: 10000;
                transition: all 0.2s;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .image-zoom-close:hover {
                color: #ddd;
                background-color: rgba(255, 255, 255, 0.2);
                transform: rotate(90deg);
            }
            
            /* 导航按钮 */
            .zoom-nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 60px;
                height: 60px;
                background-color: rgba(0, 0, 0, 0.5);
                color: #fff;
                border: none;
                border-radius: 50%;
                font-size: 30px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                z-index: 10001;
                backdrop-filter: blur(5px);
            }
            
            .zoom-nav-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-50%) scale(1.1);
            }
            
            .zoom-nav-btn.prev {
                left: 30px;
            }
            
            .zoom-nav-btn.next {
                right: 30px;
            }
            
            .zoom-nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .zoom-nav-btn:disabled:hover {
                transform: translateY(-50%);
                background-color: rgba(0, 0, 0, 0.5);
            }
            
            /* 图片计数 */
            .image-counter {
                position: absolute;
                top: 30px;
                left: 30px;
                color: #fff;
                font-size: 16px;
                padding: 8px 16px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 20px;
                backdrop-filter: blur(5px);
                z-index: 10001;
            }
            
            /* 标题栏 */
            .image-caption {
                position: absolute;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                color: #fff;
                font-size: 14px;
                padding: 8px 20px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 20px;
                max-width: 80%;
                text-align: center;
                backdrop-filter: blur(5px);
                z-index: 10001;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* 缩略图导航 */
            .thumbnail-nav {
                position: absolute;
                bottom: 20px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                padding: 15px;
                background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                z-index: 10001;
            }
            
            .thumbnail-container {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding: 5px 10px;
                max-width: 70%;
                scroll-behavior: smooth;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.3) transparent;
            }
            
            .thumbnail-container::-webkit-scrollbar {
                height: 4px;
            }
            
            .thumbnail-container::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .thumbnail-container::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 4px;
            }
            
            .thumbnail {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 4px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s;
                opacity: 0.6;
                flex-shrink: 0;
            }
            
            .thumbnail:hover {
                opacity: 0.9;
                transform: scale(1.05);
            }
            
            .thumbnail.active {
                border-color: #fff;
                opacity: 1;
            }
            
            /* 加载动画 */
            .image-zoom-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
                z-index: 10002;
            }
            
            @keyframes spin {
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            /* 点击提示 */
            .article-text img {
                cursor: zoom-in;
                transition: opacity 0.3s;
            }
            
            .article-text img:hover {
                opacity: 0.9;
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .zoom-nav-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
                
                .zoom-nav-btn.prev {
                    left: 10px;
                }
                
                .zoom-nav-btn.next {
                    right: 10px;
                }
                
                .thumbnail {
                    width: 45px;
                    height: 45px;
                }
                
                .image-counter {
                    top: 20px;
                    left: 20px;
                    font-size: 14px;
                }
                
                .image-zoom-close {
                    top: 15px;
                    right: 15px;
                    width: 40px;
                    height: 40px;
                    font-size: 30px;
                }
                
                .image-caption {
                    bottom: 90px;
                    font-size: 12px;
                    white-space: normal;
                    max-width: 90%;
                }
            }
        </style>
    `

    // 添加 HTML 结构
    const html = `
        <div class="image-zoom-overlay" id="imageZoomOverlay">
            <div class="image-zoom-close" id="imageZoomClose">&times;</div>
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

    // 添加 JavaScript
    const js = `
        <script>
            (function() {
                // 等待 DOM 加载完成
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initImageZoom);
                } else {
                    initImageZoom();
                }
                
                function initImageZoom() {
                    const overlay = document.getElementById('imageZoomOverlay');
                    const zoomedImg = document.getElementById('zoomedImage');
                    const closeBtn = document.getElementById('imageZoomClose');
                    const loading = document.getElementById('imageZoomLoading');
                    const prevBtn = document.getElementById('prevImage');
                    const nextBtn = document.getElementById('nextImage');
                    const counter = document.getElementById('imageCounter');
                    const caption = document.getElementById('imageCaption');
                    const thumbnailContainer = document.getElementById('thumbnailContainer');
                    
                    // 如果元素不存在，动态创建
                    if (!overlay) {
                        document.body.insertAdjacentHTML('beforeend', \`${html.replace(/`/g, '\\\\`')}\`);
                        return initImageZoom(); // 重新初始化
                    }
                    
                    // 获取所有文章图片
                    const images = Array.from(document.querySelectorAll('.article-text img'));
                    
                    // 存储图片信息
                    const imageList = images.map(img => ({
                        src: img.getAttribute('src'),
                        alt: img.getAttribute('alt') || '图片',
                        element: img
                    }));
                    
                    let currentIndex = 0;
                    let preloadedImages = new Map();
                    
                    // 生成缩略图
                    function generateThumbnails() {
                        thumbnailContainer.innerHTML = '';
                        imageList.forEach((img, index) => {
                            const thumb = document.createElement('img');
                            thumb.src = img.src;
                            thumb.alt = img.alt;
                            thumb.className = 'thumbnail' + (index === currentIndex ? ' active' : '');
                            thumb.addEventListener('click', () => showImage(index));
                            thumbnailContainer.appendChild(thumb);
                        });
                    }
                    
                    // 预加载图片
                    function preloadImage(index) {
                        if (index < 0 || index >= imageList.length) return;
                        if (preloadedImages.has(index)) return;
                        
                        const img = new Image();
                        img.src = imageList[index].src;
                        preloadedImages.set(index, img);
                    }
                    
                    // 预加载相邻图片
                    function preloadAdjacent(index) {
                        preloadImage(index - 1);
                        preloadImage(index);
                        preloadImage(index + 1);
                    }
                    
                    // 显示指定索引的图片
                    function showImage(index) {
                        if (index < 0 || index >= imageList.length) return;
                        
                        currentIndex = index;
                        const imgData = imageList[currentIndex];
                        
                        // 显示加载动画
                        loading.style.display = 'block';
                        zoomedImg.style.opacity = '0.5';
                        
                        // 更新图片
                        zoomedImg.src = imgData.src;
                        zoomedImg.alt = imgData.alt;
                        caption.textContent = imgData.alt;
                        
                        // 图片加载完成
                        const tempImg = new Image();
                        tempImg.onload = function() {
                            loading.style.display = 'none';
                            zoomedImg.style.opacity = '1';
                            preloadAdjacent(currentIndex);
                        };
                        tempImg.onerror = function() {
                            loading.style.display = 'none';
                            zoomedImg.style.opacity = '1';
                            caption.textContent = imgData.alt + ' (加载失败)';
                        };
                        tempImg.src = imgData.src;
                        
                        if (tempImg.complete) {
                            tempImg.onload();
                        }
                        
                        // 更新 UI
                        updateUI();
                        
                        // 滚动缩略图到可视区域
                        const activeThumb = thumbnailContainer.children[currentIndex];
                        if (activeThumb) {
                            activeThumb.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'nearest', 
                                inline: 'center' 
                            });
                        }
                    
                    }
                    
                    // 更新 UI 状态
                    function updateUI() {
                        // 更新计数器
                        counter.textContent = (currentIndex + 1) + ' / ' + imageList.length;
                        
                        // 更新导航按钮状态
                        prevBtn.disabled = currentIndex === 0;
                        nextBtn.disabled = currentIndex === imageList.length - 1;
                        
                        // 更新缩略图激活状态
                        Array.from(thumbnailContainer.children).forEach((thumb, idx) => {
                            if (idx === currentIndex) {
                                thumb.classList.add('active');
                            } else {
                                thumb.classList.remove('active');
                            }
                        });
                    }
                    
                    // 下一张
                    function nextImage() {
                        if (currentIndex < imageList.length - 1) {
                            showImage(currentIndex + 1);
                        }
                    }
                    
                    // 上一张
                    function prevImage() {
                        if (currentIndex > 0) {
                            showImage(currentIndex - 1);
                        }
                    }
                    
                    // 为每个图片添加点击事件
                    images.forEach((img, index) => {
                        img.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            currentIndex = index;
                            
                            // 生成缩略图（如果还没有）
                            if (thumbnailContainer.children.length === 0) {
                                generateThumbnails();
                            }
                            
                            // 显示遮罩层
                            overlay.classList.add('active');
                            document.body.style.overflow = 'hidden';
                            
                            // 显示图片
                            showImage(currentIndex);
                        });
                    });
                    
                    // 关闭功能
                    function closeZoom() {
                        overlay.classList.remove('active');
                        document.body.style.overflow = '';
                        
                        // 延迟清空图片，避免关闭动画看到图片变化
                        setTimeout(() => {
                            if (!overlay.classList.contains('active')) {
                                zoomedImg.src = '';
                                zoomedImg.alt = '';
                            }
                        }, 300);
                    }
                    
                    // 事件监听
                    if (closeBtn) {
                        closeBtn.addEventListener('click', closeZoom);
                    }
                    
                    // 点击遮罩层关闭（但不包括导航按钮和缩略图）
                    overlay.addEventListener('click', function(e) {
                        if (e.target === overlay || e.target.classList.contains('zoom-main-container')) {
                            closeZoom();
                        }
                    });
                   
                    // 点击主图片也可以关闭
                    zoomedImg.addEventListener('click', ()=>{
                         // 滚动页面到对应的原图位置
                        const targetImage = imageList[currentIndex].element;
                        if (targetImage) {
                            // 使用平滑滚动将原图滚动到视口中央
                            targetImage.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                                inline: 'center'
                            });
                        }
                        closeZoom()
                    });
                    
                    // 导航按钮
                    prevBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        prevImage();
                    });
                    
                    nextBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        nextImage();
                    });
                    
                    // 键盘操作
                    document.addEventListener('keydown', function(e) {
                        if (!overlay.classList.contains('active')) return;
                        
                        switch(e.key) {
                            case 'Escape':
                                closeZoom();
                                break;
                            case 'ArrowLeft':
                                e.preventDefault();
                                prevImage();
                                break;
                            case 'ArrowRight':
                                e.preventDefault();
                                nextImage();
                                break;
                            case 'Home':
                                e.preventDefault();
                                if (imageList.length > 0) showImage(0);
                                break;
                            case 'End':
                                e.preventDefault();
                                if (imageList.length > 0) showImage(imageList.length - 1);
                                break;
                        }
                    });
                    
                    // 触摸滑动支持
                    let touchStartX = 0;
                    let touchEndX = 0;
                    
                    overlay.addEventListener('touchstart', (e) => {
                        if(e.target.classList.contains("thumbnail-nav") || e.target.classList.contains("thumbnail")){
                            return;
                        }
                        touchStartX = e.changedTouches[0].screenX;
                    }, {passive: true});
                    
                    overlay.addEventListener('touchend', (e) => {
                        if(e.target.classList.contains("thumbnail-nav") || e.target.classList.contains("thumbnail")){
                            return;
                        }
                        touchEndX = e.changedTouches[0].screenX;
                        handleSwipe();
                    }, {passive: true});
                    
                    function handleSwipe() {
                        const swipeThreshold = 50;
                        const diff = touchStartX - touchEndX;
                        
                        if (Math.abs(diff) > swipeThreshold) {
                            if (diff > 0) {
                                nextImage(); // 向左滑动，下一张
                            } else {
                                prevImage(); // 向右滑动，上一张
                            }
                        }
                    }
                }
            })();
        </script>
    `

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
