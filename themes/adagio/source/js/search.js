import Fuse from './fuse.js';

async function initSearch() {
  const res = await fetch('/search.json');
  const data = await res.json();

  const openBtns =
    document.querySelectorAll('.open-search');
  const closeBtn = document.getElementById('close-search');
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('search-input');
  const resultsBox = document.getElementById(
    'search-results',
  );

  let lastFocusedElement = null;

  // 初始化 Fuse.js
  const fuse = new Fuse(data, {
    keys: ['title', 'content'],
    includeScore: true,
    threshold: 1, // 模糊程度（越低越严格）
    useExtendedSearch: true,
    minMatchCharLength: 0,
  });

  readerResult(data);
  openBtns.forEach(openBtn => {
    openBtn.addEventListener('click', () => {
      lastFocusedElement = document.activeElement;
      openModal();
    });
  });

  closeBtn.addEventListener('click', closeModal);

  function openModal() {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    input.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    lastFocusedElement?.focus();
  }

  modal.addEventListener('click', e => {
    // if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      if (!modal.classList.contains('active')) {
        openModal();
      } else {
        input.focus();
      }
    }
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();

    const focusable = modal.querySelectorAll(
      'input, button, a',
    );

    const first = focusable[0];

    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        document.activeElement === last
      ) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function readerResult(results) {
    resultsBox.innerHTML = results
      .map(post => {
        const content = (post.content || '').slice(
          0,
          Math.max(
            120,
            parseInt(
              post.content.length *
                (1 - (results.length - 1) / data.length),
            ),
          ),
        );
        return `
          <a class="search-result-item" href="${
            post.url[1] === '/' ?
              post.url.slice(1)
            : post.url
          }">
            <p class='search-title'>${post.title}</p>
            <p class='search-content'>${content}${
              post.content.length === content.length ?
                ''
              : '...'
            }
            </p>
          </a>
        `;
      })
      .join('');
  }

  // 高亮函数（支持多个关键词）
  function highlightKeyword(keywords) {
    if (!('CSS' in window) || !CSS.highlights) return;
    CSS.highlights.clear();
    if (!keywords.length) return;

    const ranges = [];
    resultsBox
      .querySelectorAll('.search-result-item')
      .forEach(item => {
        const walker = document.createTreeWalker(
          item,
          NodeFilter.SHOW_TEXT,
        );
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent;
          for (const word of keywords) {
            if (!word) continue;
            const regex = new RegExp(
              word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi',
            );
            let match;
            while ((match = regex.exec(text))) {
              const range = new Range();
              range.setStart(node, match.index);
              range.setEnd(
                node,
                match.index + match[0].length,
              );
              ranges.push(range);
            }
          }
        }
      });

    if (ranges.length) {
      const highlight = new Highlight(...ranges);
      CSS.highlights.set('search-highlight', highlight);
    }
  }

  // 搜索逻辑 + 模糊匹配 + 多关键词高亮
  input.addEventListener('input', e => {
    const keyword = e.target.value.trim().toLowerCase();
    resultsBox.innerHTML = '';

    if (!keyword) {
      readerResult(data);
      highlightKeyword([]);
      return;
    }

    const keywords = keyword.split(/\s+/).filter(Boolean);
    const results = fuse.search(keyword);
    const final = results.map(r => r.item);
    if (final.length === 0) {
      resultsBox.innerHTML = '<p>未找到相关文章</p>';
      highlightKeyword([]);
      return;
    }

    readerResult(final);
    highlightKeyword(keywords);
  });
}

initSearch();
