/**
 * 防抖函数：在最后一次调用后延迟执行
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 带防抖效果的新函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

function customCursor() {
  // 移动端直接退出
  if (window['ontouchstart'] !== undefined) {
    return;
  }

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  const trails = [];
  const TRAIL_COUNT = 6;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  for (let i = 0; i < TRAIL_COUNT; i++) {
    const t = document.createElement('div');
    t.className = 'trail';
    document.body.appendChild(t);
    trails.push({
      el: t,
      x: mouseX,
      y: mouseY,
      rot: Math.random() * 30 - 15,
    });
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    // 主光标
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';

    // 拖尾缓动
    let prevX = mouseX,
      prevY = mouseY;
    trails.forEach((t, i) => {
      t.x += (prevX - t.x) * 0.25;
      t.y += (prevY - t.y) * 0.25;

      t.el.style.left = t.x + 'px';
      t.el.style.top = t.y + 'px';
      t.el.style.transform = `translate(-50%, -50%) rotate(${
        t.rot
      }deg) scale(${1 - i * 0.001})`;

      prevX = t.x;
      prevY = t.y;
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// customCursor()

function startPixelIdleAnimation(
  options = {
    imageSrc: '/img/face.jpg', // 本地图片路径
    density: 13, // 点密度（分辨率）
    scale: 2.2, // 点大小倍数
    amplitude: 4, // 摆动幅度（像素）
    speed: 1.0, // 摆动速度
  },
) {
  const {
    imageSrc = '/img/face.jpg', // 本地图片路径
    density = 13, // 点密度（分辨率）
    scale = 2.2, // 点大小倍数
    amplitude = 4, // 摆动幅度（像素）
    speed = 1.0, // 摆动速度
  } = options;

  const canvas = document.getElementById('pixelCanvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
    // 计算居中位置
    const imgX = (canvas.width - img.width) / 2;
    const imgY = (canvas.height - img.height) / 2;

    // 绘制到隐藏canvas获取像素数据
    const hiddenCanvas = document.createElement('canvas');
    const hctx = hiddenCanvas.getContext('2d');
    hiddenCanvas.width = img.width;
    hiddenCanvas.height = img.height;
    hctx.drawImage(img, 0, 0);
    const imgData = hctx.getImageData(
      0,
      0,
      img.width,
      img.height,
    );

    const particles = [];
    for (let y = 0; y < img.height; y += density) {
      for (let x = 0; x < img.width; x += density) {
        const i = (y * img.width + x) * 4;
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];
        const a = imgData.data[i + 3];
        if (a > 128) {
          // 只取透明度较高的像素
          particles.push({
            x: imgX + x,
            y: imgY + y,
            color: `rgba(${r},${g},${b},${a / 255})`,
            offset: Math.random() * 1000,
          });
        }
      }
    }

    function animate(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        const dx =
          Math.sin((t / 300 + p.offset) * speed) *
          amplitude;
        const dy =
          Math.cos((t / 300 + p.offset) * speed) *
          amplitude;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y + dy, scale, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  };
}

// 调用方式
// startPixelIdleAnimation();

// 添加代码复制按钮

function addCopyButton() {
  const figures = document.querySelectorAll('figure');
  figures.forEach(figure => {
    const pre = figure.querySelector('.code pre');
    const button = createCopyButton(pre);
    figure.appendChild(button);
  });
}

function createCopyButton(pre) {
  const button = document.createElement('div');
  button.classList = 'code-copy';
  button.textContent = 'Copy';
  const changeButtonText = debounce(function () {
    button.textContent = 'Copy';
  }, 1000);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(
        pre.innerText.trim(),
      );
      button.textContent = 'Copied!';
      changeButtonText();
    } catch (error) {
      console.error(error.message);
    }
  });
  return button;
}

document.addEventListener('DOMContentLoaded', () => {
  addCopyButton();
});
