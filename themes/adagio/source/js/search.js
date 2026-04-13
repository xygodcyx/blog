import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.3.0/dist/fuse.mjs'

async function initSearch() {
  const res = await fetch('/search.json')
  const data = await res.json()

  const openBtns = document.querySelectorAll('.open-search')
  const closeBtn = document.getElementById('close-search')
  const modal = document.getElementById('search-modal')
  const input = document.getElementById('search-input')
  const resultsBox = document.getElementById(
    'search-results',
  )

  let lastFocusedElement = null
  let selectedIndex = -1 // 当前选中的搜索结果索引
  let currentResults = [] // 当前显示的结果数据

  // 初始化 Fuse.js
  const fuse = new Fuse(data, {
    keys: ['title', 'content'],
    includeScore: true,
    threshold: 0.4, // 调整模糊程度
    useExtendedSearch: true,
    minMatchCharLength: 1,
  })

  readerResult(data)
  openBtns.forEach((openBtn) => {
    openBtn.addEventListener('click', () => {
      lastFocusedElement = document.activeElement
      openModal()
    })
  })

  closeBtn.addEventListener('click', closeModal)

  function openModal() {
    modal.classList.add('active')
    document.body.classList.add('modal-open')
    input.focus()
    selectedIndex = -1 // 重置选中索引
  }

  function closeModal() {
    modal.classList.remove('active')
    document.body.classList.remove('modal-open')
    lastFocusedElement?.focus()
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // 全局快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+K 打开搜索
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault()
      if (!modal.classList.contains('active')) {
        openModal()
      } else {
        input.focus()
      }
    }

    // Cmd+K (Mac) 打开搜索
    if (e.metaKey && e.key === 'k') {
      e.preventDefault()
      if (!modal.classList.contains('active')) {
        openModal()
      } else {
        input.focus()
      }
    }

    if (!modal.classList.contains('active')) return

    // ESC 关闭
    if (e.key === 'Escape') {
      closeModal()
      return
    }

    // ===== 新增：键盘导航 =====
    const items = resultsBox.querySelectorAll(
      '.search-result-item',
    )

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (items.length > 0) {
        selectedIndex = Math.min(
          selectedIndex + 1,
          items.length - 1,
        )
        updateSelectedItem(items)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (items.length > 0) {
        selectedIndex = Math.max(selectedIndex - 1, 0)
        updateSelectedItem(items)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // 如果有选中的项，跳转
      if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].click()
      } else if (items.length > 0) {
        // 没有选中项时，默认跳转第一个
        items[0].click()
      }
    }
    // ===== 键盘导航结束 =====

    // Tab 键陷阱
    const focusable = modal.querySelectorAll(
      'input, button, a:not(.search-result-item)',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (
        !e.shiftKey &&
        document.activeElement === last
      ) {
        e.preventDefault()
        first.focus()
      }
    }
  })

  // ===== 新增：更新选中项样式 =====
  function updateSelectedItem(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected')
        // 滚动到可视区域
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      } else {
        item.classList.remove('selected')
      }
    })
  }
  // ===== 新增结束 =====

  function readerResult(results) {
    currentResults = results // 保存当前结果
    resultsBox.innerHTML = results
      .map((post, index) => {
        const content = (post.content || '').slice(0, 150)
        return `
          <a class="search-result-item" 
             href="${post.url[1] === '/' ? post.url.slice(1) : post.url}"
             data-index="${index}">
            <div class="search-result-header">
              <span class="search-result-icon">📄</span>
              <span class="search-title">${post.title}</span>
            </div>
            <p class="search-content">${content}${post.content.length > 150 ? '...' : ''}</p>
          </a>
        `
      })
      .join('')

    selectedIndex = -1 // 重置选中索引
  }

  // 高亮函数（支持多个关键词）
  function highlightKeyword(keywords) {
    if (!('CSS' in window) || !CSS.highlights) return
    CSS.highlights.clear()
    if (!keywords.length) return

    const ranges = []
    resultsBox
      .querySelectorAll('.search-result-item')
      .forEach((item) => {
        const walker = document.createTreeWalker(
          item,
          NodeFilter.SHOW_TEXT,
        )
        let node
        while ((node = walker.nextNode())) {
          const text = node.textContent
          for (const word of keywords) {
            if (!word) continue
            const regex = new RegExp(
              word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi',
            )
            let match
            while ((match = regex.exec(text))) {
              const range = new Range()
              range.setStart(node, match.index)
              range.setEnd(
                node,
                match.index + match[0].length,
              )
              ranges.push(range)
            }
          }
        }
      })

    if (ranges.length) {
      const highlight = new Highlight(...ranges)
      CSS.highlights.set('search-highlight', highlight)
    }
  }

  // 搜索逻辑
  input.addEventListener('input', (e) => {
    const keyword = e.target.value.trim().toLowerCase()
    resultsBox.innerHTML = ''

    if (!keyword) {
      readerResult(data)
      highlightKeyword([])
      return
    }

    const keywords = keyword.split(/\s+/).filter(Boolean)
    const results = fuse.search(keyword)
    const final = results.map((r) => r.item)

    if (final.length === 0) {
      resultsBox.innerHTML = `
        <div class="search-empty">
          <span class="search-empty-icon">🔍</span>
          <p>未找到相关文章</p>
          <p class="search-empty-tip">试试其他关键词吧</p>
        </div>
      `
      highlightKeyword([])
      currentResults = []
      return
    }

    readerResult(final)
    highlightKeyword(keywords)
  })
}

initSearch()
