const diaryContent = document.getElementById('diary-content');
const charCount = document.getElementById('char-count');
const imageCount = document.getElementById('image-count');
const audioCount = document.getElementById('audio-count');
const autosaveStatus = document.getElementById('autosave-status');
const moodSelect = document.getElementById('mood');
const moodBadge = document.getElementById('mood-badge');
const emojiPanel = document.getElementById('emoji-panel');
const emojiTrigger = document.getElementById('emoji-trigger');
const emojiGrid = document.getElementById('emoji-grid');
const emojiSearch = document.getElementById('emoji-search');
const imageInput = document.getElementById('image-input');
const audioInput = document.getElementById('audio-input');
const imageDropzone = document.getElementById('image-dropzone');
const recordBtn = document.getElementById('record-btn');
const audioStatus = document.getElementById('audio-status');
const audioPreview = document.getElementById('audio-preview');
const clearAudioPreviewBtn = document.getElementById('clear-audio-preview-btn');
const removeAudioFromEditorBtn = document.getElementById('remove-audio-from-editor-btn');
const exportHtmlBtn = document.getElementById('export-html-btn');
const clearBtn = document.getElementById('clear-entry-btn');
const insertDividerBtn = document.getElementById('insert-divider-btn');
const geoBtn = document.getElementById('geo-btn');
const quickSaveBtn = document.getElementById('quick-save-btn');
const deleteDraftBtn = document.getElementById('delete-draft-btn');
const timeInput = document.getElementById('time');
const weatherSelect = document.getElementById('weather');
const tagsInput = document.getElementById('tags');

let currentSelection = null;
let mediaRecorder = null;
let audioChunks = [];
let autosaveTimer = null;
let autosavePausedUntil = 0; // 时间戳：暂停自动保存到何时

const EMOJI_LIST = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😍','😘','😗','🥰','😚','😙','😎','🤓','🧐','😒','😔','😞','😟','😢','😭','😤','😠','😡','🤬','🤯','😳','🥺','😱','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😴','🤤','🥱','😪','🤧','😷','🤒','🤕','🤑','🤠','😇','🥳','🤩','😈','👻','💀','🤖','🎉','❤️','🧡','💛','💚','💙','💜','🖤','🤍','✨','💫','🌈','☀️','⛅','🌧️','❄️','💧','🔥','🍀','🌸','🍂','🍁','⭐','⚡','🎵','🎶'
];

// 基础关键词映射（示例，覆盖常用检索；可按需扩充）
const EMOJI_KEYWORDS = {
  '😀': ['smile','笑','开心','高兴'],
  '😁': ['grin','笑','开心'],
  '😂': ['joy','笑哭','笑'],
  '🤣': ['rofl','笑翻','大笑'],
  '😉': ['wink','眨眼'],
  '😊': ['smile','微笑','满足'],
  '😍': ['love','爱','喜欢','心动'],
  '😘': ['kiss','亲吻','么么哒'],
  '😢': ['cry','哭','难过'],
  '😭': ['sob','大哭','伤心'],
  '😡': ['angry','生气','愤怒'],
  '😴': ['sleep','困','睡'],
  '🎉': ['party','庆祝','生日','彩带'],
  '❤️': ['heart','爱','红心'],
  '✨': ['sparkles','星光','亮','闪'],
  '☀️': ['sun','太阳','晴'],
  '🌧️': ['rain','雨','下雨'],
  '❄️': ['snow','雪','下雪'],
  '🔥': ['fire','火','热','燃'],
  '🌈': ['rainbow','彩虹'],
  '🍀': ['clover','幸运','运气'],
  '🌸': ['flower','花','樱花'],
  '⭐': ['star','星','收藏'],
  '⚡': ['bolt','电','闪电'],
  '🎵': ['music','音乐','音符'],
  '🎶': ['music','音乐','旋律']
};

function loadRecentEmojis() {
  try {
    const raw = localStorage.getItem('emoji-recents');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(e => typeof e === 'string') : [];
  } catch { return []; }
}
function saveRecentEmoji(emoji) {
  const max = 16;
  const list = loadRecentEmojis().filter(e => e !== emoji);
  list.unshift(emoji);
  localStorage.setItem('emoji-recents', JSON.stringify(list.slice(0, max)));
}

function matchEmojis(filter) {
  const q = (filter || '').trim().toLowerCase();
  if (!q) return EMOJI_LIST.slice();
  return EMOJI_LIST.filter(e => {
    if (e.includes(q)) return true;
    const kws = EMOJI_KEYWORDS[e];
    return kws ? kws.some(k => k.toLowerCase().includes(q)) : false;
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[s];
  });
}

function renderEmojiGrid(filter = '') {
  emojiGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const q = (filter || '').trim();
  // 最近使用
  if (!q) {
    const recents = loadRecentEmojis();
    if (recents.length) {
      const recentWrap = document.createElement('div');
      recentWrap.setAttribute('aria-label', '最近使用');
      recentWrap.style.display = 'grid';
      recentWrap.style.gridTemplateColumns = 'repeat(6, 1fr)';
      recentWrap.style.gap = '8px';
      recents.forEach(emoji => fragment.appendChild(createEmojiButton(emoji)));
      emojiGrid.appendChild(recentWrap);
      // 分隔
      const hr = document.createElement('div');
      hr.style.height = '8px';
      emojiGrid.appendChild(hr);
    }
  }

  const list = matchEmojis(q);
  if (!list.length) {
    const empty = document.createElement('div');
    empty.textContent = '没有匹配的表情';
    empty.style.color = 'var(--muted)';
    empty.style.fontSize = '0.9rem';
    emojiGrid.appendChild(empty);
    return;
  }
  list.forEach(emoji => fragment.appendChild(createEmojiButton(emoji)));
  emojiGrid.appendChild(fragment);
}

function createEmojiButton(emoji) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'emoji-btn';
  btn.textContent = emoji;
  btn.setAttribute('data-emoji', emoji);
  btn.setAttribute('aria-label', `插入表情 ${emoji}`);
  btn.addEventListener('click', () => {
    saveRecentEmoji(emoji);
    insertAtCursor(document.createTextNode(emoji));
    toggleEmojiPanel(false);
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
  return btn;
}

function toggleEmojiPanel(force) {
  const isOpen = force !== undefined ? force : !emojiPanel.classList.contains('open');
  emojiPanel.classList.toggle('open', isOpen);
  emojiTrigger.setAttribute('aria-expanded', isOpen);
  if (isOpen) {
    // 打开时复位搜索并聚焦
    emojiSearch.value = '';
    renderEmojiGrid('');
    emojiSearch.focus();
  }
}

function saveSelection() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    currentSelection = selection.getRangeAt(0);
  }
}

function restoreSelection() {
  if (currentSelection) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(currentSelection);
  }
}

function insertAtCursor(nodeOrHTML) {
  // 确保插入目标一定在编辑器内：如果当前选区不存在或不在 #diary-content 内，则将光标放到编辑器末尾
  const selection = window.getSelection();
  let baseRange = null;
  if (currentSelection && diaryContent.contains(currentSelection.commonAncestorContainer)) {
    baseRange = currentSelection.cloneRange();
  } else if (selection && selection.rangeCount > 0 && diaryContent.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    baseRange = selection.getRangeAt(0).cloneRange();
  } else {
    placeCaretAtEnd(diaryContent);
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0) {
      baseRange = sel2.getRangeAt(0).cloneRange();
    }
  }

  diaryContent.focus();

  let fragment;
  if (typeof nodeOrHTML === 'string') {
    fragment = document.createRange().createContextualFragment(nodeOrHTML);
  } else if (nodeOrHTML instanceof Node) {
    fragment = document.createDocumentFragment();
    fragment.appendChild(nodeOrHTML);
  } else {
    return;
  }

  if (!baseRange) {
    // 极端兜底：直接追加到末尾
    diaryContent.appendChild(fragment);
    placeCaretAtEnd(diaryContent);
    updateStats();
    return;
  }

  // 使用规范化后的 range 执行插入
  baseRange.deleteContents();
  const lastNode = fragment.lastChild;
  baseRange.insertNode(fragment);
  if (lastNode) {
    baseRange.setStartAfter(lastNode);
    baseRange.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(baseRange);
    currentSelection = baseRange.cloneRange();
  }
  updateStats();
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  saveSelection();
}

// 如果当前选区不在编辑器中，强制把光标放到编辑器末尾
function ensureCaretInEditor() {
  const sel = window.getSelection();
  const inEditor = sel && sel.rangeCount > 0 && diaryContent.contains(sel.getRangeAt(0).commonAncestorContainer);
  if (!inEditor) {
    if (diaryContent.classList.contains('is-placeholder')) {
      diaryContent.innerHTML = '';
      diaryContent.classList.remove('is-placeholder');
    }
    diaryContent.focus();
    placeCaretAtEnd(diaryContent);
  }
}

function handleImageFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) return;
  autosaveStatus.textContent = '正在读取图片…';
  autosaveStatus.style.color = 'var(--muted)';
  list.forEach(file => {
    const isLikelyImage = (file.type && file.type.startsWith('image/')) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || '');
    if (!isLikelyImage && file.type) return; // 如果明确不是图片则跳过；type 为空时尝试读取
    const reader = new FileReader();
    reader.onerror = () => {
      console.error('读取图片失败:', file && file.name);
      autosaveStatus.textContent = '读取图片失败';
      autosaveStatus.style.color = '#ef4444';
    };
    reader.onload = e => {
      try {
        const src = e.target.result;
        const name = file && file.name ? file.name : 'image';
        const html = `<span class="attachment" contenteditable="false" data-fn="${escapeHtml(name)}">` +
                      `<img src="${src}" alt="${escapeHtml(name)}" />` +
                      `<button type="button" class="remove-btn" title="删除" aria-label="删除" contenteditable="false">✕</button>` +
                     `</span>`;
        insertAtCursor(html);
        normalizeAttachments();
        updateStats();
        autosaveStatus.textContent = '图片已插入（未保存）';
        autosaveStatus.style.color = '#ef4444';
      } catch (err) {
        console.error('插入图片失败', err);
        autosaveStatus.textContent = '插入图片失败';
        autosaveStatus.style.color = '#ef4444';
      }
    };
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('读取文件异常', err);
      autosaveStatus.textContent = '读取图片失败';
      autosaveStatus.style.color = '#ef4444';
    }
  });
}

function handleAudioFile(file) {
  if (!file || !file.type || !file.type.startsWith('audio/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    const html = `<span class="attachment" contenteditable="false" data-fn="${escapeHtml(file.name)}">` +
                  `<audio controls preload="metadata"><source src="${src}" type="${file.type}" /></audio>` +
                  `<button type="button" class="remove-btn" title="删除" aria-label="删除" contenteditable="false">✕</button>` +
                 `</span>`;
    insertAtCursor(html);
    addAudioPreview(src, file.type);
    normalizeAttachments();
    updateStats();
  };
  reader.readAsDataURL(file);
}

function addAudioPreview(src, type) {
  const wrap = document.createElement('div');
  wrap.className = 'audio-item';
  const audio = document.createElement('audio');
  audio.controls = true;
  const source = document.createElement('source');
  source.src = src;
  if (type) source.type = type;
  audio.appendChild(source);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'secondary-btn remove-audio-preview';
  btn.textContent = '删除';
  btn.title = '从预览中删除该音频';
  wrap.appendChild(audio);
  wrap.appendChild(btn);
  audioPreview.appendChild(wrap);
}

function updateStats() {
  const text = diaryContent.innerText.trim();
  charCount.textContent = text.length;
  imageCount.textContent = diaryContent.querySelectorAll('img').length;
  audioCount.textContent = diaryContent.querySelectorAll('audio').length;
  autosaveStatus.textContent = '草稿有更新，尚未保存';
  autosaveStatus.style.color = '#ef4444';
}

function autoSaveDraft() {
  // 若已临时暂停自动保存，则直接返回
  if (autosavePausedUntil && Date.now() < autosavePausedUntil) {
    autosaveStatus.textContent = '自动保存已暂停…';
    autosaveStatus.style.color = 'var(--muted)';
    return;
  }
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const payload = collectDiaryData();
    localStorage.setItem('diary-draft', JSON.stringify(payload));
    autosaveStatus.textContent = '草稿已自动保存至浏览器';
    autosaveStatus.style.color = 'var(--muted)';
  }, 1200);
}

function collectDiaryData() {
  return {
    time: timeInput.value,
    weather: weatherSelect.value,
    mood: moodSelect.value,
    location: document.getElementById('location').value,
    tags: tagsInput.value,
    content: diaryContent.innerHTML
  };
}

function restoreDraft() {
  const raw = localStorage.getItem('diary-draft');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    timeInput.value = data.time || timeInput.value;
    weatherSelect.value = data.weather || weatherSelect.value;
    moodSelect.value = data.mood || moodSelect.value;
    document.getElementById('location').value = data.location || '';
    tagsInput.value = data.tags || '';
    if (data.content) {
      diaryContent.innerHTML = data.content;
    }
    // 兼容历史内容：规范化附件，防止按钮可编辑或文本污染
    normalizeAttachments();
    updateStats();
    autosaveStatus.textContent = '已载入上次草稿';
    autosaveStatus.style.color = 'var(--muted)';
  } catch (err) {
    console.error('恢复草稿失败', err);
  }
}

function downloadDiaryAsHTML() {
  const data = collectDiaryData();
  const htmlContent = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${data.time || '我的日记'}</title><style>body{font-family:Arial,sans-serif;padding:40px;background:#f7f9fc;color:#111;line-height:1.8;}h1{margin-bottom:16px;}section{margin-bottom:18px;}img,audio{max-width:100%;border-radius:12px;box-shadow:0 10px 20px rgba(0,0,0,0.12);}dl{display:grid;grid-template-columns:120px 1fr;gap:8px;}</style></head><body><h1>日记记录</h1><section><dl><dt>时间</dt><dd>${data.time || '未填写'}</dd><dt>天气</dt><dd>${weatherSelect.options[weatherSelect.selectedIndex].text}</dd><dt>心情</dt><dd>${moodSelect.options[moodSelect.selectedIndex].text}</dd><dt>地点</dt><dd>${data.location || '未填写'}</dd><dt>标签</dt><dd>${data.tags || '无'}</dd></dl></section><section>${data.content || ''}</section></body></html>`;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.time || 'diary'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function clearDiary() {
  if (!confirm('确认清空当前日记内容吗？此操作不可撤销。')) return;
  diaryContent.innerHTML = '';
  document.getElementById('location').value = '';
  tagsInput.value = '';
  updateStats();
  autosaveStatus.textContent = '已清空当前日记';
  autosaveStatus.style.color = '#10b981';
}

function insertDivider() {
  insertAtCursor('<hr style="border:none;border-top:2px dashed rgba(43,154,243,0.3);margin:24px 0;">');
}

async function locateMe() {
  if (!navigator.geolocation) {
    alert('当前浏览器不支持定位');
    return;
  }
  geoBtn.disabled = true;
  geoBtn.textContent = '定位中…';
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      document.getElementById('location').value = `纬度 ${latitude.toFixed(4)}, 经度 ${longitude.toFixed(4)}`;
      geoBtn.disabled = false;
      geoBtn.textContent = '定位';
      updateStats();
    },
    error => {
      alert('定位失败：' + error.message);
      geoBtn.disabled = false;
      geoBtn.textContent = '定位';
    }
  );
}

function updateMoodBadge() {
  const option = moodSelect.options[moodSelect.selectedIndex];
  moodBadge.innerHTML = `<span>${option.textContent.split(' ')[0]}</span> 今天的心情`;
  const colorMap = {
    happy: '#34d399',
    calm: '#60a5fa',
    tired: '#a78bfa',
    sad: '#f87171',
    angry: '#ef4444',
    excited: '#fbbf24'
  };
  moodBadge.style.background = colorMap[moodSelect.value] ? colorMap[moodSelect.value] + '20' : '#eff6ff';
  moodBadge.style.color = colorMap[moodSelect.value] || 'var(--primary)';
}

function restoreSelectionOnInput() {
  diaryContent.addEventListener('mouseup', saveSelection);
  diaryContent.addEventListener('keyup', saveSelection);
  diaryContent.addEventListener('mouseleave', saveSelection);
  diaryContent.addEventListener('input', () => {
    saveSelection();
    updateStats();
    autoSaveDraft();
  });
  diaryContent.addEventListener('focus', restoreSelection);
  diaryContent.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      insertAtCursor('&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  });
}

function initDragAndDrop() {
  ['dragenter', 'dragover'].forEach(eventName => {
    imageDropzone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      imageDropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    imageDropzone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      imageDropzone.classList.remove('dragover');
    });
  });

  imageDropzone.addEventListener('drop', e => {
    ensureCaretInEditor();
    const dt = e.dataTransfer;
    if (!dt) return;
    const files = [];
    if (dt.items && dt.items.length) {
      for (const item of dt.items) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
    } else if (dt.files && dt.files.length) {
      for (const f of dt.files) files.push(f);
    }
    if (files.length) handleImageFiles(files);
  });

  // 点击区域也打开文件选择器
  imageDropzone.addEventListener('click', () => {
    ensureCaretInEditor();
    imageInput.click();
  });
}

function initAudioRecorder() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    recordBtn.disabled = true;
    audioStatus.textContent = '浏览器不支持录音功能';
    return;
  }

  recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        recordBtn.textContent = '停止录音';
        audioStatus.textContent = '录音中…点击停止保存。';
        mediaRecorder.start();
        mediaRecorder.addEventListener('dataavailable', event => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        });
        mediaRecorder.addEventListener('stop', () => {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const html = `<span class="attachment" contenteditable="false" data-fn="recording.webm">` +
                       `<audio controls preload="metadata"><source src="${url}" type="audio/webm" /></audio>` +
                       `<button type="button" class="remove-btn" title="删除" aria-label="删除" contenteditable="false">✕</button>` +
                       `</span>`;
          insertAtCursor(html);
          addAudioPreview(url, 'audio/webm');
          normalizeAttachments();
          updateStats();
          recordBtn.textContent = '开始录音';
          audioStatus.textContent = '录音完成，已插入日记。';
        });
      } catch (error) {
        console.error(error);
        alert('无法访问麦克风：' + error.message);
        recordBtn.textContent = '开始录音';
        audioStatus.textContent = '录音失败，请检查权限。';
      }
    } else if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}
function initCanvas() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const brushColor = document.getElementById('brush-color');
  const brushSize = document.getElementById('brush-size');
  const canvasClearBtn = document.getElementById('canvas-clear-btn');
  const insertBtn = document.getElementById('insert-doodle-btn');
  const wrapper = canvas.parentElement;
  const overlay = document.getElementById('canvas-bounds-overlay');
  const sizeSelect = document.getElementById('canvas-size-select');
  const showBoundsCheckbox = document.getElementById('show-bounds');

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

let _savedCanvasData = null;
let drawBounds = { x: 0, y: 0, w: 0, h: 0 };
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    // 在调整大小前保存现有内容（如果有）
    try {
      _savedCanvasData = canvas.toDataURL();
    } catch (e) {
      _savedCanvasData = null;
    }
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    // 如果之前有图像，重绘回去以保留内容（用 CSS 尺寸绘制）
    updateBounds();
    if (_savedCanvasData) {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        } catch (err) {
          // ignore draw errors
        }
      };
      img.src = _savedCanvasData;
    }
  }

  function updateBounds() {
    const rect = canvas.getBoundingClientRect();
    let w, h;
    const val = sizeSelect ? sizeSelect.value : 'auto';
    if (val === 'auto') {
      w = rect.width;
      h = rect.height;
    } else {
      const parts = val.split('x');
      w = parseInt(parts[0], 10) || rect.width;
      h = parseInt(parts[1], 10) || rect.height;
      // 如果选择的尺寸大于容器宽度，则缩放到容器宽度
      if (w > rect.width) {
        const scale = rect.width / w;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
    }
    drawBounds.w = Math.max(1, Math.round(w));
    drawBounds.h = Math.max(1, Math.round(h));
    drawBounds.x = Math.round((rect.width - drawBounds.w) / 2);
    drawBounds.y = Math.round((rect.height - drawBounds.h) / 2);
    if (overlay) {
      // overlay 相对于 wrapper 定位，canvas 也在 wrapper 内部，从 (0,0) 开始
      overlay.style.display = showBoundsCheckbox && !showBoundsCheckbox.checked ? 'none' : 'block';
      overlay.style.left = drawBounds.x + 'px';
      overlay.style.top = drawBounds.y + 'px';
      overlay.style.width = drawBounds.w + 'px';
      overlay.style.height = drawBounds.h + 'px';
    }
  }

  function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function isInBounds(x, y) {
    if (!drawBounds || !drawBounds.w || !drawBounds.h) return true; // No bounds
    return x >= drawBounds.x && x <= drawBounds.x + drawBounds.w &&
           y >= drawBounds.y && y <= drawBounds.y + drawBounds.h;
  }

  function drawLine(fromX, fromY, toX, toY) {
    ctx.strokeStyle = brushColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }

  function pointerDown(e) {
    e.preventDefault();
    const { x, y } = getPoint(e);
    if (!isInBounds(x, y)) {
      drawing = false;
      return;
    }
    drawing = true;
    lastX = x;
    lastY = y;
  }

  function pointerMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    if (isInBounds(x, y)) {
      drawLine(lastX, lastY, x, y);
      lastX = x;
      lastY = y;
    } else {
      // If pointer moves out of bounds, stop drawing
      drawing = false;
    }
  }

  function pointerUp() {
    drawing = false;
  }

resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  let currentSizeValue = sizeSelect ? sizeSelect.value : 'auto';
  if (sizeSelect) {
    sizeSelect.addEventListener('change', (e) => {
      const prev = currentSizeValue;
      const next = e.target.value;
      if (confirm('更改画布范围会清空当前涂鸦，确定要继续吗？')) {
        currentSizeValue = next;
        // 如果选择了固定尺寸，更新 canvas 的内在宽高（影响显示比例）
        if (next !== 'auto') {
          const [nw, nh] = next.split('x').map(v => parseInt(v, 10));
          if (nw && nh) {
            canvas.setAttribute('width', String(nw));
            canvas.setAttribute('height', String(nh));
          }
        }
        // 若为 auto，则保留当前内在宽高不变，仅按容器自适应
        updateBounds();
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        // 重新计算绘制缓冲尺寸
        resizeCanvas();
      } else {
        // 恢复为更改前的选项
        e.target.value = prev;
        updateBounds();
      }
    });
  }
  if (showBoundsCheckbox) showBoundsCheckbox.addEventListener('change', () => { updateBounds(); });      // 鼠标事件
  canvas.addEventListener('mousedown', pointerDown);
  canvas.addEventListener('mousemove', pointerMove);
  canvas.addEventListener('mouseup', pointerUp);
  canvas.addEventListener('mouseleave', pointerUp);

  // 触摸事件
  canvas.addEventListener('touchstart', pointerDown, { passive: false });
  canvas.addEventListener('touchmove', pointerMove, { passive: false });
  canvas.addEventListener('touchend', pointerUp);
  canvas.addEventListener('touchcancel', pointerUp);

  canvasClearBtn.addEventListener('click', () => {
    if (drawBounds && drawBounds.w && drawBounds.h) {
      ctx.clearRect(drawBounds.x, drawBounds.y, drawBounds.w, drawBounds.h);
    } else {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  });

  insertBtn.addEventListener('click', () => {
    // 导出仅限绘制区域（drawBounds）
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let sx = 0, sy = 0, sw = canvas.width, sh = canvas.height;
    if (drawBounds && drawBounds.w && drawBounds.h) {
      sx = Math.round(drawBounds.x * dpr);
      sy = Math.round(drawBounds.y * dpr);
      sw = Math.round(drawBounds.w * dpr);
      sh = Math.round(drawBounds.h * dpr);
    } else {
      sx = 0; sy = 0; sw = canvas.width; sh = canvas.height;
    }
    const tmp = document.createElement('canvas');
    tmp.width = sw;
    tmp.height = sh;
    const tctx = tmp.getContext('2d');
    try {
      tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = tmp.toDataURL('image/png');
      insertAtCursor(`<img src="${dataUrl}" alt="手绘涂鸦" />`);
      // 清空绘制区域
      if (drawBounds && drawBounds.w && drawBounds.h) {
        ctx.clearRect(drawBounds.x, drawBounds.y, drawBounds.w, drawBounds.h);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
      updateStats();
    } catch (err) {
      console.error('导出涂鸦失败', err);
      alert('导出涂鸦失败：' + err.message);
    }
  });
}

function quickSave() {
  // 避免被未完成的自动保存回调覆盖状态
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  const payload = collectDiaryData();
  try {
    localStorage.setItem('diary-draft', JSON.stringify(payload));
    autosaveStatus.textContent = '草稿已保存';
    autosaveStatus.style.color = '#10b981';
  } catch (err) {
    console.error('保存失败', err);
    autosaveStatus.textContent = '保存失败：存储空间不足或被禁用';
    autosaveStatus.style.color = '#ef4444';
    alert('保存失败：可能是浏览器禁止了本地存储或空间不足。');
  }
}

function registerEvents() {
  // 打开面板前保存当前位置选区，防止插入点丢失
  emojiTrigger.addEventListener('mousedown', () => saveSelection());
  emojiTrigger.addEventListener('click', () => toggleEmojiPanel());
  const topbarToggle = document.getElementById('toggle-emoji-btn');
  if (topbarToggle) {
    topbarToggle.addEventListener('mousedown', () => saveSelection());
    topbarToggle.addEventListener('click', () => {
      document.getElementById('emoji-trigger')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toggleEmojiPanel(true);
    });
  }
  document.addEventListener('click', event => {
    if (!emojiPanel.contains(event.target) && !emojiTrigger.contains(event.target)) {
      toggleEmojiPanel(false);
    }
  });
  // 搜索框键盘导航：向下箭头直接跳到第一个表情按钮；Esc 关闭
  emojiSearch.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      const firstBtn = emojiGrid.querySelector('.emoji-btn');
      if (firstBtn) firstBtn.focus();
    } else if (e.key === 'Escape') {
      toggleEmojiPanel(false);
      diaryContent.focus();
    }
  });
  // Emoji 网格键盘导航：方向键在 6 列网格中移动，Esc 关闭
  emojiGrid.addEventListener('keydown', (e) => {
    const buttons = Array.from(emojiGrid.querySelectorAll('.emoji-btn'));
    if (!buttons.length) return;
    const cols = 6;
    const current = document.activeElement;
    const idx = buttons.indexOf(current);
    if (idx === -1) return;
    let next = idx;
    if (e.key === 'ArrowRight') next = Math.min(idx + 1, buttons.length - 1);
    else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
    else if (e.key === 'ArrowDown') next = Math.min(idx + cols, buttons.length - 1);
    else if (e.key === 'ArrowUp') next = Math.max(idx - cols, 0);
    else if (e.key === 'Escape') {
      toggleEmojiPanel(false);
      diaryContent.focus();
      return;
    } else {
      return;
    }
    if (next !== idx) {
      e.preventDefault();
      buttons[next].focus();
    }
  });
  // 防止点击删除按钮时在可编辑区域内产生光标或选区干扰
  diaryContent.addEventListener('mousedown', (e) => {
    if (e.target.closest('.remove-btn')) {
      e.preventDefault();
    }
  });
  emojiSearch.addEventListener('input', e => renderEmojiGrid(e.target.value.trim()));

  imageInput.addEventListener('change', e => {
    ensureCaretInEditor();
    handleImageFiles(e.target.files);
    // 允许选择同一文件时也能再次触发 change
    e.target.value = '';
  });
  audioInput.addEventListener('change', e => {
    ensureCaretInEditor();
    handleAudioFile(e.target.files[0]);
  });
  insertDividerBtn.addEventListener('click', insertDivider);
  clearBtn.addEventListener('click', clearDiary);
  exportHtmlBtn.addEventListener('click', downloadDiaryAsHTML);
  geoBtn.addEventListener('click', locateMe);
  quickSaveBtn.addEventListener('click', quickSave);
  // 预览区删除单个
  audioPreview.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-audio-preview');
    if (!btn) return;
    const item = btn.closest('.audio-item');
    const audio = item ? item.querySelector('audio, source') : null;
    if (audio) {
      const src = audio.getAttribute('src');
      if (src && src.startsWith('blob:')) {
        try { URL.revokeObjectURL(src); } catch (_) {}
      }
    }
    if (item) item.remove();
    autosaveStatus.textContent = '已从预览移除音频';
    autosaveStatus.style.color = '#10b981';
  });
  // 清空预览
  if (clearAudioPreviewBtn) {
    clearAudioPreviewBtn.addEventListener('click', () => {
      const sources = audioPreview.querySelectorAll('audio, source');
      sources.forEach(el => {
        const src = el.getAttribute('src');
        if (src && src.startsWith('blob:')) {
          try { URL.revokeObjectURL(src); } catch (_) {}
        }
      });
      audioPreview.innerHTML = '';
      autosaveStatus.textContent = '已清空预览音频';
      autosaveStatus.style.color = '#10b981';
    });
  }
  // 从正文移除所有音频
  if (removeAudioFromEditorBtn) {
    removeAudioFromEditorBtn.addEventListener('click', () => {
      const nodes = Array.from(diaryContent.querySelectorAll('audio'));
      let removed = 0;
      nodes.forEach(a => {
        let src = a.getAttribute('src');
        if (!src) {
          const s = a.querySelector('source');
          if (s) src = s.getAttribute('src');
        }
        if (src && src.startsWith('blob:')) {
          try { URL.revokeObjectURL(src); } catch (_) {}
        }
        const att = a.closest('.attachment');
        if (att) att.remove(); else a.remove();
        removed++;
      });
      updateStats();
      autosaveStatus.textContent = removed ? `已从正文移除 ${removed} 个音频` : '正文中没有音频';
      autosaveStatus.style.color = removed ? '#10b981' : 'var(--muted)';
      autoSaveDraft();
    });
  }
  if (deleteDraftBtn) {
    deleteDraftBtn.addEventListener('click', () => {
      if (!confirm('确认从浏览器中删除“本地草稿”？\n提示：这不会删除你电脑下载目录中的 HTML 文件。')) return;
      try {
        localStorage.removeItem('diary-draft');
        // 暂停自动保存 20 秒，避免马上又写回去
        autosavePausedUntil = Date.now() + 20000;
        autosaveStatus.textContent = '已删除本地草稿（20 秒内暂停自动保存）';
        autosaveStatus.style.color = '#10b981';
      } catch (err) {
        console.error('删除草稿失败', err);
        autosaveStatus.textContent = '删除草稿失败';
        autosaveStatus.style.color = '#ef4444';
      }
    });
  }

  // 事件委托：处理编辑器内附件的删除
  diaryContent.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-btn');
    if (btn) {
      const att = btn.closest('.attachment');
      if (att) {
        // 如果包含 blob URL，尝试 revoke
        const media = att.querySelector('audio, img');
        if (media) {
          const src = media.getAttribute('src') || (media.querySelector && media.querySelector('source') ? media.querySelector('source').getAttribute('src') : null);
          if (src && src.startsWith('blob:')) {
            try { URL.revokeObjectURL(src); } catch(_){}}
        }
        att.remove();
        updateStats();
      }
    }
  });

  moodSelect.addEventListener('change', updateMoodBadge);
  weatherSelect.addEventListener('change', updateStats);
  timeInput.addEventListener('change', updateStats);
  tagsInput.addEventListener('input', () => {
    updateStats();
    autoSaveDraft();
  });

  document.getElementById('location').addEventListener('input', () => {
    updateStats();
    autoSaveDraft();
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      quickSave();
    }
  });
  // 任意输入后恢复自动保存（如果用户继续编辑，说明希望继续保存）
  diaryContent.addEventListener('input', () => {
    if (autosavePausedUntil && Date.now() >= autosavePausedUntil) return;
    // 将暂停时间清零，恢复正常自动保存
    autosavePausedUntil = 0;
  }, { capture: true });
}

function addPlaceholderSupport() {
  const placeholder = diaryContent.dataset.placeholder;
  function showPlaceholder() {
    diaryContent.innerHTML = placeholder;
    diaryContent.classList.add('is-placeholder');
  }
  function hidePlaceholder() {
    if (diaryContent.classList.contains('is-placeholder')) {
      diaryContent.innerHTML = '';
    }
    diaryContent.classList.remove('is-placeholder');
  }

  diaryContent.addEventListener('focus', () => {
    if (diaryContent.classList.contains('is-placeholder')) {
      hidePlaceholder();
    }
  });

  diaryContent.addEventListener('blur', () => {
    if (diaryContent.innerHTML.trim() === '' || diaryContent.innerHTML === '<br>') {
      showPlaceholder();
      placeCaretAtEnd(diaryContent);
    }
  });

  if (!diaryContent.innerHTML.trim()) {
    showPlaceholder();
  } else {
    diaryContent.classList.remove('is-placeholder');
  }
}

function init() {
  const now = new Date();
  if (!timeInput.value) {
    timeInput.value = now.toISOString().slice(0, 16);
  }
  updateMoodBadge();
  renderEmojiGrid();
  restoreSelectionOnInput();
  addPlaceholderSupport();
  initDragAndDrop();
  initAudioRecorder();
  initCanvas();
  registerEvents();
  restoreDraft();
  // 再次全量规范一次，处理初始静态 DOM 中的附件（如从模板复制进来的内容）
  normalizeAttachments();
  updateStats();
}

window.addEventListener('DOMContentLoaded', init);

// 规范化已插入或恢复的附件元素：
// - 使附件整体不可编辑（contenteditable="false"）
// - 使删除按钮不可编辑，并重置为固定的“✕”文本
// - 防止历史污染导致的按钮文字异常
function normalizeAttachments(root = diaryContent) {
  if (!root) return;
  const atts = root.querySelectorAll('.attachment');
  atts.forEach(att => {
    if (att.getAttribute('contenteditable') !== 'false') {
      att.setAttribute('contenteditable', 'false');
    }
    const btn = att.querySelector('.remove-btn');
    if (btn) {
      if (btn.getAttribute('contenteditable') !== 'false') {
        btn.setAttribute('contenteditable', 'false');
      }
      btn.type = 'button';
      btn.title = '删除';
      btn.setAttribute('aria-label', '删除');
      // 只保留单一“✕”字符，清除被误输入的文本
      if (btn.textContent !== '✕') {
        btn.textContent = '✕';
      }
    }
  });
}