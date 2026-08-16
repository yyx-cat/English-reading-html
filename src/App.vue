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
            <!-- 自由模式控制区 -->
            <div class="free-mode-controls" style="display: flex; align-items: center; gap: 12px; padding: 6px 10px; flex-wrap: wrap; border-top: 1px solid var(--border); margin-top: 4px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" v-model="freeModeEnabled" @change="onFreeModeToggle" />
                自由模式
              </label>
              <template v-if="freeModeEnabled">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 14px;">
                  重复：
                  <input type="number" v-model.number="repeatCount" min="1" max="10" style="width: 50px; padding: 4px 6px; border-radius: 8px; border: 1px solid var(--border); background: var(--paper-2); text-align: center;" />
                  遍
                </label>
                <button @click="startFreeMode" class="nav-btn" style="background: var(--accent-1); color: #fff; border: none; padding: 0 16px; height: 34px; border-radius: 12px; cursor: pointer;">
                  ▶ 开始练习
                </button>
                <button v-if="freeModeActive" @click="stopFreeMode" class="nav-btn" style="background: var(--ink-2); color: #fff; border: none; padding: 0 16px; height: 34px; border-radius: 12px; cursor: pointer;">
                  ⏹ 停止
                </button>
              </template>
            </div>
            <div class="navigation-buttons">
              <button id="prevUnitBtn" class="nav-btn prev-btn" title="上一课" @click="onPrevLyric" :disabled="(pointReadMode ? pointReadTargetIndex : currentLyricIndex) <= 0">
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
              <button id="nextUnitBtn" class="nav-btn next-btn" title="下一课" @click="onNextLyric" :disabled="(pointReadMode ? pointReadTargetIndex : currentLyricIndex) >= lyrics.length - 1">
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
              <button id="pointReadBtn" class="point-read-btn" :class="{ active: pointReadMode }" @click="togglePointRead" :title="pointReadMode ? '点读模式已开启' : '开启点读模式'">点读</button>
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
          <section class="lyrics-container" ref="lyricsContainerRef">
            <div id="lyricsDisplay" class="lyrics-display">
              <!-- 普通模式：显示所有歌词 -->
              <template v-if="!freeModeActive">
                <div
                  v-for="(lyric, index) in lyrics"
                  :key="index"
                  class="lyric-line"
                  :class="{ active: index === (pointReadMode ? pointReadTargetIndex : currentLyricIndex) }"
                  @click="onLyricClick(index)"
                >
                  <div class="lyric-text">{{ lyric.english }}</div>
                  <div class="lyric-translation" v-if="lyric.chinese">{{ lyric.chinese }}</div>
                </div>
              </template>

              <!-- 自由模式：只显示当前单词 -->
              <template v-else>
                <div class="lyric-line active" style="font-size: clamp(24px, 6vw, 40px); padding: 30px 20px; text-align: center; border: 2px solid var(--accent-1); border-radius: 16px;">
                  <div class="lyric-text" style="font-weight: 700;">
                    {{ lyrics[freeModeCurrentIndex]?.english || '加载中...' }}
                  </div>
                  <div class="lyric-translation" v-if="lyrics[freeModeCurrentIndex]?.chinese" style="font-size: 18px; margin-top: 12px;">
                    {{ lyrics[freeModeCurrentIndex]?.chinese }}
                  </div>
                  <div style="margin-top: 20px; font-size: 16px; color: var(--ink-2);">
                    第 {{ freeModeCurrentIndex + 1 }} / {{ totalWords }} 个单词
                    （重复 {{ currentRepeat + 1 }} / {{ repeatCount }} 遍）
                  </div>
                </div>
              </template>

              <p class="placeholder" v-if="!lyrics.length">选择一个Unit开始学习...</p>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- 轻提示 Toast（点读模式首次开启等引导） -->
    <transition name="toast-fade">
      <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { usePlayer } from './composables/usePlayer'
import { useAutoScroll } from './composables/useAutoScroll'

const books = ref([])
const units = ref([])
const selectedBookKey = ref('')
const currentUnitIndex = ref(0)

// 歌词滚动容器引用（用于自动滚动）
const lyricsContainerRef = ref(null)

const {
  isPlaying,
  lyrics,
  currentLyricIndex,
  currentTime,        // ← 自由模式监听需要
  formattedCurrentTime,
  formattedDuration,
  progressPercent,
  playbackRate,      // ← 新增
  duration,          // ← 新增（进度条点击会用到）
  loadUnit,
  togglePlay,
  playLyric,
  cycleSpeed,
  seekTo,
} = usePlayer()

// ========== 自由模式状态 ==========
const freeModeEnabled = ref(false)    // 是否启用自由模式
const freeModeActive = ref(false)     // 是否正在练习中
const repeatCount = ref(3)            // 默认重复 3 遍
const currentRepeat = ref(0)          // 当前单词已重复次数
const totalWords = ref(0)             // 当前单元总单词数
const freeModeCurrentIndex = ref(0)   // 当前练习的单词索引
const freeModeSeeking = ref(false)    // 防重入标志：seekTo 后短暂屏蔽 watch

// ========== 点读模式状态 ==========
const pointReadMode = ref(false)      // 是否处于点读模式（默认连续播放模式）
const pointReadTargetIndex = ref(-1)  // 点读模式当前目标句索引（作为暂停检测真相源，避免 seekTo 竞态）
const pointReadPausing = ref(false)   // 防重入标志：句末暂停时短暂屏蔽 watch

// ========== Toast 轻提示 ==========
const toastVisible = ref(false)       // Toast 是否可见
const toastMessage = ref('')          // Toast 文本内容
let toastTimer = null                 // Toast 自动隐藏计时器

/**
 * 显示一个轻提示 Toast（若干秒后自动消失）
 * @param {string} msg - 提示文本
 * @param {number} [duration=2500] - 显示时长（毫秒）
 * @returns {void}
 */
const showToast = (msg, duration = 2500) => {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

/**
 * 切换点读模式 / 连续播放模式
 * - 连续→点读：保持播放，同步目标句为当前句，后续播完自动暂停
 * - 点读→连续：不自动播放，等待用户操作
 * - 首次开启点读模式时弹出引导提示
 * @returns {void}
 */
const togglePointRead = () => {
  pointReadMode.value = !pointReadMode.value

  if (pointReadMode.value) {
    // 开启点读模式：同步当前目标句为正在高亮的句子
    if (currentLyricIndex.value >= 0) {
      pointReadTargetIndex.value = currentLyricIndex.value
    }
    // 首次使用引导（用 localStorage 记忆是否已提示过）
    if (!localStorage.getItem('pointReadGuided')) {
      showToast('点读模式已开启，点击句子播放，播完自动暂停')
      localStorage.setItem('pointReadGuided', '1')
    }
  } else {
    // 关闭点读模式：重置防重入标志，不主动播放
    pointReadPausing.value = false
    pointReadTargetIndex.value = -1
  }
}

// ========== 歌词自动滚动 ==========
// 自由模式时禁用自动滚动（自由模式只显示一个单词，无需滚动）
const autoScrollEnabled = computed(() => !freeModeActive.value)
// 滚动跟随的“目标索引”：
// - 点读模式：跟随用户点击的 pointReadTargetIndex（稳定，不被 timeupdate 句末误报带偏）
// - 连续模式：跟随播放进度 currentLyricIndex
const autoScrollActiveIndex = computed(() =>
  pointReadMode.value ? pointReadTargetIndex.value : currentLyricIndex.value
)
// 接入自动滚动：监听目标索引变化，把当前句滚到第二行位置
const { forceScrollToIndex, reset: resetAutoScroll } = useAutoScroll(
  lyricsContainerRef,
  autoScrollActiveIndex,
  lyrics,
  { enabledRef: autoScrollEnabled, idleTimeout: 3000 }
)

// ========== 点击歌词跳转播放 ==========
// 点击任意句 → 立即同步高亮 + 跳转播放 + 立即滚动到该句
// 点读模式下额外记录为目标句（播完自动暂停）；点击同一句 → seekTo 句首重播
// @param {number} index - 被点击的歌词索引
const onLyricClick = (index) => {
  // 立即同步高亮索引，避免等待 timeupdate（约 250ms）造成的高亮延迟
  currentLyricIndex.value = index
  playLyric(index)
  // 点读模式下记录目标句，作为句末暂停检测与滚动跟随的真相源
  if (pointReadMode.value) {
    pointReadTargetIndex.value = index
    // 清除可能残留的暂停防重入标志
    pointReadPausing.value = false
  }
  // 用户主动点击，立即强制滚动到点击句（避免依赖异步更新的索引造成跳转延迟）
  forceScrollToIndex(index)
}

// ========== 上一句 / 下一句按钮（点读模式下也同步目标句）==========
// 点读模式下以 pointReadTargetIndex 为基准计算，避免 currentLyricIndex 未及时更新导致跳错
// @returns {void}
const onPrevLyric = () => {
  const base = pointReadMode.value ? pointReadTargetIndex.value : currentLyricIndex.value
  const prev = base - 1
  if (prev < 0) return
  onLyricClick(prev)
}

// @returns {void}
const onNextLyric = () => {
  const base = pointReadMode.value ? pointReadTargetIndex.value : currentLyricIndex.value
  const next = base + 1
  if (next >= lyrics.value.length) return
  onLyricClick(next)
}

// ========== 加载课本列表 ==========
const loadBooks = async () => {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'data.json')
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
    const response = await fetch(`${bookPath}/book.json?t=${Date.now()}`)
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
  // 加载单元时，如果自由模式激活，自动退出
  if (freeModeActive.value) {
    freeModeActive.value = false
    currentRepeat.value = 0
    freeModeCurrentIndex.value = 0
    freeModeSeeking.value = false
  }
  // 点读模式：保留模式开关，但重置目标句索引（新单元 currentLyricIndex 已被置 -1）
  pointReadTargetIndex.value = -1
  pointReadPausing.value = false
  // 切换单元时重置滚动状态（滚回顶部、清除空闲计时）
  resetAutoScroll()
}

// ========== 切换自由模式 ==========
const onFreeModeToggle = () => {
  if (!freeModeEnabled.value && freeModeActive.value) {
    // 取消勾选时，如果正在练习，停止
    stopFreeMode()
  }
}

// ========== 开始自由模式 ==========
const startFreeMode = () => {
  if (!units.value.length || currentUnitIndex.value < 0) {
    alert('请先选择一个单元')
    return
  }
  // 确保歌词已加载
  if (!lyrics.value.length) {
    alert('当前单元没有歌词数据')
    return
  }

  freeModeActive.value = true
  freeModeCurrentIndex.value = 0
  currentRepeat.value = 0
  totalWords.value = lyrics.value.length

  // 从第一个单词开始播放
  playLyric(0)
}

// ========== 停止自由模式 ==========
const stopFreeMode = () => {
  freeModeActive.value = false
  // 暂停播放
  if (isPlaying.value) {
    togglePlay()
  }
  // 重置到开头
  seekTo(0)
  currentLyricIndex.value = -1
  currentRepeat.value = 0
  freeModeCurrentIndex.value = 0
  freeModeSeeking.value = false
  // 退出自由模式后恢复自动滚动状态（清除用户交互暂停）
  resetAutoScroll()
}

// ========== 监听播放进度（自由模式专用）==========
// 当自由模式激活时，检测当前单词是否播放完毕，控制重复或跳下一个单词
// 注意：必须使用 freeModeCurrentIndex 作为真相源，不能用 currentLyricIndex
// 因为 seekTo 只更新 audio.currentTime 和 currentTime，不会同步 currentLyricIndex，
// 会导致 watch 再次触发时索引还是旧值，造成"跳转后被拉回"的死循环
watch(currentTime, (newTime) => {
  // 只有自由模式激活时才处理
  if (!freeModeActive.value || !lyrics.value.length) return
  // 防重入：seekTo 跳转后短暂屏蔽，避免 currentTime 变化立即触发误判
  if (freeModeSeeking.value) return

  // 用自由模式自维护的索引作为真相源
  const currentIdx = freeModeCurrentIndex.value
  if (currentIdx < 0 || currentIdx >= lyrics.value.length) return

  // 获取当前单词的结束时间（下一个单词的开始时间，或音频总时长）
  const currentLyric = lyrics.value[currentIdx]
  const nextLyric = lyrics.value[currentIdx + 1]
  const endTime = nextLyric ? nextLyric.time : duration.value

  // 如果当前播放时间 >= 结束时间 - 0.1秒（容差），说明这个单词已经播完了
  if (newTime >= endTime - 0.1) {
    // 增加重复计数
    currentRepeat.value += 1

    // 进入跳转处理，设置防重入标志
    freeModeSeeking.value = true

    if (currentRepeat.value < repeatCount.value) {
      // 还没达到重复次数，跳回当前单词开头继续播放
      seekTo(currentLyric.time)
    } else {
      // 已达到重复次数，准备播放下一个单词
      const nextIndex = currentIdx + 1
      if (nextIndex < lyrics.value.length) {
        // 重置重复计数，跳到下一个单词
        currentRepeat.value = 0
        // 更新自由模式当前索引
        freeModeCurrentIndex.value = nextIndex
        playLyric(nextIndex)
      } else {
        // 所有单词都练习完了
        freeModeActive.value = false
        freeModeSeeking.value = false
        alert('🎉 练习完成！共 ' + totalWords.value + ' 个单词，每个重复 ' + repeatCount.value + ' 遍。')
        return
      }
    }

    // 延迟释放防重入标志，等音频 timeupdate 稳定到新位置后再放行
    setTimeout(() => {
      freeModeSeeking.value = false
    }, 200)
  }
})

// ========== 点读模式：句末自动暂停 ==========
// 当点读模式开启时，检测当前目标句是否播放完毕，完毕则自动暂停（不播下一句）
// 注意：必须使用 pointReadTargetIndex 作为真相源，不能用 currentLyricIndex
// 因为 seekTo 只更新 audio.currentTime 和 currentTime，不会同步 currentLyricIndex，
// 会导致 watch 再次触发时索引还是旧值，造成误判
watch(currentTime, (newTime) => {
  // 非点读模式、已暂停、防重入中，均不处理
  if (!pointReadMode.value) return
  if (!isPlaying.value) return
  if (pointReadPausing.value) return
  if (pointReadTargetIndex.value < 0) return
  if (!lyrics.value.length) return

  const targetIdx = pointReadTargetIndex.value
  if (targetIdx >= lyrics.value.length) return

  // 目标句的结束时间 = 下一句的开始时间，或音频总时长
  const nextLyric = lyrics.value[targetIdx + 1]
  const endTime = nextLyric ? nextLyric.time : duration.value

  // 当前时间 >= 结束时间 - 0.1秒（容差），说明目标句已播完
  if (newTime >= endTime - 0.1) {
    // 设置防重入标志，避免暂停瞬间 timeupdate 再次触发导致误播放
    pointReadPausing.value = true
    // 暂停播放（点读模式核心：播完一句自动停）
    if (isPlaying.value) {
      togglePlay()
    }
    // 点读模式高亮由 pointReadTargetIndex 决定（模板中已处理），无需重置 currentLyricIndex
    // 短暂延迟后释放标志
    setTimeout(() => {
      pointReadPausing.value = false
    }, 200)
  }
})

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