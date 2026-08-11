// src/composables/usePlayer.js
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { LRCParser } from '../utils/LRCParser'
import { formatTime, clamp } from '../utils/helpers'

export function usePlayer() {
  // ========== 响应式状态 ==========
  const audio = ref(null)                    // 音频元素
  const isPlaying = ref(false)               // 是否正在播放
  const currentTime = ref(0)                 // 当前播放时间（秒）
  const duration = ref(0)                    // 音频总时长（秒）
  const playbackRate = ref(1.0)              // 播放速度
  const lyrics = ref([])                     // 解析后的歌词数组
  const currentLyricIndex = ref(-1)          // 当前高亮的歌词索引
  const isLoading = ref(false)               // 是否正在加载

  // ========== 计算属性 ==========
  // 当前高亮的歌词行
  const activeLyric = computed(() => {
    if (currentLyricIndex.value < 0 || currentLyricIndex.value >= lyrics.value.length) {
      return null
    }
    return lyrics.value[currentLyricIndex.value]
  })

  // 格式化后的当前时间
  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  // 进度百分比
  const progressPercent = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  // ========== 核心方法 ==========
  // 加载音频和歌词
  const loadUnit = async (audioUrl, lrcUrl) => {
    isLoading.value = true
    
    try {
      // 1. 加载歌词
      const lrcResponse = await fetch(lrcUrl)
      const lrcText = await lrcResponse.text()
      lyrics.value = LRCParser.parse(lrcText, 0.3)  // 0.3秒偏移，让高亮提前
      
      // 2. 设置音频
      if (!audio.value) {
        audio.value = new Audio()
        bindAudioEvents()
      }
      audio.value.src = audioUrl
      audio.value.playbackRate = playbackRate.value
      audio.value.load()
      
      // 重置状态
      currentTime.value = 0
      currentLyricIndex.value = -1
      isPlaying.value = false
      
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 播放/暂停切换
  const togglePlay = () => {
    if (!audio.value) return
    if (isPlaying.value) {
      audio.value.pause()
    } else {
      audio.value.play()
    }
  }

  // 跳转到指定时间
  const seekTo = (time) => {
    if (!audio.value) return
    const clampedTime = clamp(time, 0, duration.value)
    audio.value.currentTime = clampedTime
    currentTime.value = clampedTime
  }

  // 点击歌词跳转
  const playLyric = (index) => {
    if (index < 0 || index >= lyrics.value.length) return
    const targetTime = lyrics.value[index].time
    seekTo(targetTime)
    if (!isPlaying.value) {
      audio.value?.play()
    }
  }

  // 切换播放速度
  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
    const currentIndex = speeds.indexOf(playbackRate.value)
    const nextIndex = (currentIndex + 1) % speeds.length
    playbackRate.value = speeds[nextIndex]
    if (audio.value) {
      audio.value.playbackRate = playbackRate.value
    }
  }

  // 上一句 / 下一句
  const prevLyric = () => {
    if (currentLyricIndex.value > 0) {
      playLyric(currentLyricIndex.value - 1)
    }
  }
  const nextLyric = () => {
    if (currentLyricIndex.value < lyrics.value.length - 1) {
      playLyric(currentLyricIndex.value + 1)
    }
  }

  // ========== 音频事件绑定 ==========
  const bindAudioEvents = () => {
    if (!audio.value) return

    audio.value.addEventListener('timeupdate', () => {
      currentTime.value = audio.value.currentTime
      // 更新高亮索引
      const newIndex = LRCParser.findLyricIndexByTime(lyrics.value, currentTime.value)
      if (newIndex !== currentLyricIndex.value) {
        currentLyricIndex.value = newIndex
      }
    })

    audio.value.addEventListener('loadedmetadata', () => {
      duration.value = audio.value.duration
    })

    audio.value.addEventListener('play', () => {
      isPlaying.value = true
    })

    audio.value.addEventListener('pause', () => {
      isPlaying.value = false
    })

    audio.value.addEventListener('ended', () => {
      isPlaying.value = false
      currentTime.value = 0
      currentLyricIndex.value = -1
    })
  }

  // ========== 生命周期 ==========
  onMounted(() => {
    if (!audio.value) {
      audio.value = new Audio()
      bindAudioEvents()
    }
  })

  onUnmounted(() => {
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
    }
  })

  // ========== 返回给组件使用 ==========
  return {
    // 状态
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    lyrics,
    currentLyricIndex,
    activeLyric,
    formattedCurrentTime,
    formattedDuration,
    progressPercent,
    isLoading,

    // 方法
    loadUnit,
    togglePlay,
    seekTo,
    playLyric,
    cycleSpeed,
    prevLyric,
    nextLyric,
  }
}