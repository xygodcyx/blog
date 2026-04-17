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
  let selectedIndex = 0
  let currentResults = []
  let debounceTimer = null

  // ===== 优化 Fuse 配置（多词搜索最佳实践） =====
  const fuse = new Fuse(data, {
    keys: [
      { name: 'title', weight: 0.6 }, // 标题权重更高
      { name: 'content', weight: 0.4 }, // 内容次之
    ],
    includeScore: true,
    includeMatches: true, // 获取匹配位置用于自定义高亮
    threshold: 0.3, // 适中阈值，平衡准确与模糊
    distance: 100,
    useExtendedSearch: true, // 支持 'word1 word2' 自动 AND
    minMatchCharLength: 1,
    shouldSort: true,
    findAllMatches: true,
    ignoreLocation: true,
    ignoreFieldNorm: true,
  })

  // 显示所有结果
  function showAllResults() {
    readerResult(data)
    highlightKeyword([])
  }

  showAllResults()

  // ===== 事件绑定 =====
  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      lastFocusedElement = document.activeElement
      openModal()
    })
  })

  closeBtn.addEventListener('click', closeModal)

  function openModal() {
    modal.classList.add('active')
    document.body.classList.add('modal-open')
    input.focus()
    selectedIndex = 0
  }

  function closeModal() {
    modal.classList.remove('active')
    document.body.classList.remove('modal-open')
    lastFocusedElement?.focus()
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // ===== 全局快捷键 =====
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+K 或 Cmd+K
    if (
      (e.ctrlKey && e.shiftKey && e.key === 'K') ||
      (e.metaKey && e.key === 'k')
    ) {
      e.preventDefault()
      if (!modal.classList.contains('active')) {
        openModal()
      } else {
        input.focus()
      }
    }

    if (!modal.classList.contains('active')) return

    if (e.key === 'Escape') {
      closeModal()
      return
    }

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
      if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].click()
      } else if (items.length > 0) {
        items[0].click()
      }
    }

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

  // ===== 更新选中样式 =====
  function updateSelectedItem(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected')
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      } else {
        item.classList.remove('selected')
      }
    })
  }

  // ===== 渲染结果（带匹配片段） =====
  function readerResult(results) {
    currentResults = results
    resultsBox.innerHTML = results
      .map((post, index) => {
        // 截取内容摘要，优先使用匹配上下文
        const snippet = generateSnippet(post, 120)
        return `
        <a class="search-result-item" 
           href="${(post.url[0] === '/' ? post.url : '/' + post.url).replace('//', '/')}"
           data-index="${index}">
          <div class="search-result-header">
            <span class="search-result-icon">📄</span>
            <span class="search-title">${escapeHtml(post.title)}</span>
          </div>
          <p class="search-content">${snippet}</p>
        </a>
      `
      })
      .join('')

    selectedIndex = 0
    const items = resultsBox.querySelectorAll(
      '.search-result-item',
    )
    updateSelectedItem(items)
  }

  // 转义 HTML 防止 XSS
  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 生成摘要，显示匹配的上下文
  function generateSnippet(post, maxLen) {
    const content = post.content || ''
    if (content.length <= maxLen) return escapeHtml(content)

    // 尝试在关键词附近截取（后续由高亮处理视觉）
    return escapeHtml(content.slice(0, maxLen)) + '...'
  }

  // ===== 自定义高亮（利用 Fuse matches） =====
  function highlightKeyword(keywords, matches) {
    if (!('CSS' in window) || !CSS.highlights) return
    CSS.highlights.clear()
    if (!keywords.length && !matches) return

    const ranges = []

    // 优先使用 Fuse 返回的精确匹配位置
    // if (matches) {
    //   matches.forEach((match) => {
    //     match.indices.forEach(([start, end]) => {
    //       // 需要定位到具体的文本节点，这里简化处理，高亮整个关键词区域
    //       // 实际项目可遍历 DOM 精确高亮
    //     })
    //   })
    // }

    // 备用：根据关键词正则高亮
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
            const escapedWord = word.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            )
            const regex = new RegExp(escapedWord, 'gi')
            let match
            while ((match = regex.exec(text)) !== null) {
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

  // ===== 搜索逻辑（带防抖） =====
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      performSearch(e.target.value.trim())
    }, 200) // 200ms 防抖
  })

  function performSearch(query) {
    if (!query) {
      readerResult(data)
      highlightKeyword([])
      return
    }

    // 多词处理：空格分隔，自动 AND
    const keywords = query.split(/\s+/).filter(Boolean)

    // 使用 Fuse 扩展搜索语法：每个词用 ' 包含进行精确匹配倾向
    const extendedQuery = keywords
      .map((k) => `'${k}`)
      .join(' ')

    const results = fuse.search(extendedQuery)
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
    // 高亮关键词（利用 fuse 返回的 matches 可更精确，这里用简化版）
    highlightKeyword(keywords)
  }

  // ===== 清理防抖 =====
  window.addEventListener('beforeunload', () => {
    clearTimeout(debounceTimer)
  })
}

// 简单的 toPinyin 移除，保持代码干净
initSearch()
