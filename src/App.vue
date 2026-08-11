<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <h1>英语点读</h1>
        <p class="subtitle">English Reading</p>
      </div>
      <div class="header-actions">
        <button id="themeToggle" class="theme-toggle" @click="toggleTheme" aria-label="切换主题">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.5" />
            <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17.5 11.18C16.82 11.39 16.11 11.5 15.37 11.5C11.47 11.5 8.31 8.34 8.31 4.44C8.31 3.7 8.42 2.99 8.63 2.31C5.46 3.07 3 5.92 3 9.37C3 13.27 6.16 16.43 10.06 16.43C13.51 16.43 16.36 13.97 17.12 10.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </header>

    <div class="container">
      <!-- 左侧：Unit列表 -->
      <aside class="unit-list desktop-only">
        <h2>课程列表</h2>
        <div id="unitListContainer">
          <div
            v-for="(unit, index) in units"
            :key="index"
            class="unit-item"
            :class="{ active: index === currentUnitIndex }"
            @click="loadUnitByIndex(index)"
          >
            <h3>{{ unit.title }}</h3>
          </div>
        </div>
      </aside>

      <!-- 右侧：播放器 -->
      <div class="player-column">
        <main class="player-section">
          <div class="book-info">
            <img id="bookCover" src="" alt="课本封面" class="book-cover" />
            <div class="unit-info">
              <div class="unit-title-group">
                <label>
                 <select class="book-select" id="bookSelect" v-model="selectedBookKey" @change="onBookChange">
                    <option value="">选择课本</option>
                    <option v-for="book in books" :key="book.key" :value="book.key">
                      {{ book.title }}
                    </option>
                  </select>
                </label>
                <label>
                  <select id="unitSelect" class="unit-select" v-model="currentUnitIndex" @change="onUnitChange">
                    <option value="">选择 Unit</option>
                    <option v-for="(unit, index) in units" :key="index" :value="index">
                      {{ unit.title }}
                    </option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <!-- 控制面板 -->
          <section class="control-panel">
            <div class="navigation-buttons">
              <button id="prevUnitBtn" class="nav-btn prev-btn" title="上一课" @click="prevLyric" :disabled="currentLyricIndex <= 0">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M12 16L7 11L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button id="playPauseBtn" class="play-btn" :class="{ playing: isPlaying }" @click="togglePlay">
                <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
              <button id="nextUnitBtn" class="nav-btn next-btn" title="下一课" @click="nextLyric" :disabled="currentLyricIndex >= lyrics.length - 1">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M8 4L13 9L8 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button id="speedBtn" class="speed-btn" :class="{ active: playbackRate !== 1 }" @click="cycleSpeed">
                <span id="speedText">{{ playbackRate }}x</span>
              </button>
              <button id="loopToggleBtn" class="loop-toggle-btn" @click="toggleLoop">
                <svg class="loop-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M4.5 7.5a5.5 5.5 0 0 1 9.5-3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12.5 2.5L15.5 5.5L12.5 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15.5 12.5a5.5 5.5 0 0 1-9.5 3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7.5 17.5L4.5 14.5L7.5 11.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="repeat-one-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M4.5 7.5a5.5 5.5 0 0 1 9.5-3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12.5 2.5L15.5 5.5L12.5 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15.5 12.5a5.5 5.5 0 0 1-9.5 3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7.5 17.5L4.5 14.5L7.5 11.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  <text x="10" y="12.2" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor" stroke="none">1</text>
                </svg>
              </button>
              <button id="toggleTranslationBtn" class="toggle-translation-btn" @click="toggleTranslation">中</button>
            </div>

            <!-- 进度条 -->
            <div class="audio-player">
              <div class="progress-container">
                <div class="progress-bar" id="progressBar" @click="onProgressClick">
                  <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                  <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
                </div>
              </div>
              <div class="time-display">
                <span id="currentTime">{{ formattedCurrentTime }}</span>
                <span id="duration">{{ formattedDuration }}</span>
              </div>
            </div>
          </section>

          <!-- 歌词显示 -->
          <section class="lyrics-container">
            <div id="lyricsDisplay" class="lyrics-display">
              <div
                v-for="(lyric, index) in lyrics"
                :key="index"
                class="lyric-line"
                :class="{ active: index === currentLyricIndex }"
                @click="playLyric(index)"
              >
                <div class="lyric-text">{{ lyric.english }}</div>
                <div class="lyric-translation" v-if="lyric.chinese">{{ lyric.chinese }}</div>
              </div>
              <p class="placeholder" v-if="!lyrics.length">选择一个Unit开始学习...</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayer } from './composables/usePlayer'

const books = ref([])
const units = ref([])
const selectedBookKey = ref('')
const currentUnitIndex = ref(0)

const {
  isPlaying,
  lyrics,
  currentLyricIndex,
  formattedCurrentTime,
  formattedDuration,
  progressPercent,
  playbackRate,      // ← 新增
  duration,          // ← 新增（进度条点击会用到）
  loadUnit,
  togglePlay,
  playLyric,
  cycleSpeed,
  prevLyric,
  nextLyric,
  seekTo,
} = usePlayer()

// ========== 加载课本列表 ==========
const loadBooks = async () => {
  try {
    const response = await fetch('/data.json')
    const data = await response.json()
    books.value = data.books
    if (books.value.length) {
      selectedBookKey.value = books.value[0].key
      await loadBookConfig(books.value[0].bookPath)
    }
  } catch (error) {
    console.error('加载课本列表失败:', error)
  }
}

// ========== 加载课本配置 ==========
const loadBookConfig = async (bookPath) => {
  try {
    const response = await fetch(`${bookPath}/book.json`)
    const data = await response.json()
    units.value = data.units.map((unit) => ({
      ...unit,
      audioUrl: `${bookPath}/${unit.filename}.mp3`,
      lrcUrl: `${bookPath}/${unit.filename}.lrc`,
    }))
    if (units.value.length) {
      currentUnitIndex.value = 0
      await loadUnitByIndex(0)
    }
  } catch (error) {
    console.error('加载课本配置失败:', error)
  }
}

// ========== 加载单元 ==========
const loadUnitByIndex = async (index) => {
  if (index < 0 || index >= units.value.length) return
  currentUnitIndex.value = index
  const unit = units.value[index]
  await loadUnit(unit.audioUrl, unit.lrcUrl)
}

// ========== 课本切换 ==========
const onBookChange = async () => {
  const book = books.value.find(b => b.key === selectedBookKey.value)
  if (book) {
    await loadBookConfig(book.bookPath)
  }
}

// ========== 单元下拉切换 ==========
const onUnitChange = () => {
  loadUnitByIndex(currentUnitIndex.value)
}

// ========== 主题切换 ==========
const toggleTheme = () => {
  const isDark = document.body.classList.toggle('dark-theme')
  // 顺便记住用户的偏好（存到 localStorage）
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

// ========== 循环模式切换（简单版） ==========
const toggleLoop = () => {
  // 循环切换：off → click → sentence → list → off
  const modes = ['off', 'click', 'sentence', 'list']
  const currentIndex = modes.indexOf(localStorage.getItem('loopMode') || 'off')
  const nextMode = modes[(currentIndex + 1) % modes.length]
  localStorage.setItem('loopMode', nextMode)
  
  // 更新按钮样式
  const btn = document.getElementById('loopToggleBtn')
  btn.className = 'loop-toggle-btn'  // 重置
  if (nextMode === 'list') btn.classList.add('active')
  if (nextMode === 'sentence') btn.classList.add('sentence')
  if (nextMode === 'click') btn.classList.add('click')
  
  console.log('循环模式:', nextMode)
}

// ========== 翻译切换 ==========
const toggleTranslation = () => {
  const modes = ['show', 'english', 'chinese', 'blur']
  const currentIndex = modes.indexOf(localStorage.getItem('translationMode') || 'show')
  const nextMode = modes[(currentIndex + 1) % modes.length]
  localStorage.setItem('translationMode', nextMode)
  
  // 清除所有翻译相关的类
  document.body.classList.remove('english-translation', 'chinese-translation', 'blur-translation')
  
  // 添加对应的类
  if (nextMode === 'english') {
    document.body.classList.add('english-translation')
    document.getElementById('toggleTranslationBtn').textContent = '英'
  } else if (nextMode === 'chinese') {
    document.body.classList.add('chinese-translation')
    document.getElementById('toggleTranslationBtn').textContent = '中'
  } else if (nextMode === 'blur') {
    document.body.classList.add('blur-translation')
    document.getElementById('toggleTranslationBtn').textContent = '糊'
  } else {
    document.getElementById('toggleTranslationBtn').textContent = '双'
  }
}

// ========== 在 onMounted 中恢复用户偏好 ==========
onMounted(() => {
  // 恢复主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme')
  }
  
  // 恢复循环模式（UI 状态）
  const savedLoop = localStorage.getItem('loopMode')
  if (savedLoop && savedLoop !== 'off') {
    const btn = document.getElementById('loopToggleBtn')
    if (savedLoop === 'list') btn.classList.add('active')
    if (savedLoop === 'sentence') btn.classList.add('sentence')
    if (savedLoop === 'click') btn.classList.add('click')
  }
  
  // 恢复翻译模式
  const savedTranslation = localStorage.getItem('translationMode')
  if (savedTranslation && savedTranslation !== 'show') {
    document.body.classList.add(savedTranslation + '-translation')
    const btn = document.getElementById('toggleTranslationBtn')
    if (savedTranslation === 'english') btn.textContent = '英'
    if (savedTranslation === 'chinese') btn.textContent = '中'
    if (savedTranslation === 'blur') btn.textContent = '糊'
  }
  
  // 加载数据
  loadBooks()
})

// ========== 进度条点击 ==========
const onProgressClick = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  seekTo(percent * duration.value)
}

// ========== 启动 ==========
onMounted(() => {
  loadBooks()
})
</script>

<style>
/* 这里不需要额外样式，因为全局 style.css 已经包含了所有样式 */
</style>