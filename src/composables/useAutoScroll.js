// src/composables/useAutoScroll.js
import { watch, onMounted, onBeforeUnmount } from 'vue'

/**
 * 歌词自动滚动组合式函数
 * 让当前高亮句子稳定在滚动容器顶部偏下（第二行）位置；
 * 用户手动滚动时暂停自动滚动，停止操作一段时间后自动恢复。
 * @param {import('vue').Ref<HTMLElement|null>} containerRef - 滚动容器的 DOM 引用（即 .lyrics-container）
 * @param {import('vue').Ref<number>} activeIndexRef - 当前高亮行的索引（即 currentLyricIndex）
 * @param {import('vue').Ref<Array>} itemsRef - 歌词数组（用于判断是否为空、首尾边界）
 * @param {Object} [options] - 配置项
 * @param {string} [options.lineSelector='.lyric-line'] - 歌词行的 CSS 选择器
 * @param {number} [options.idleTimeout=3000] - 用户停止操作后恢复自动滚动的空闲时长（毫秒）
 * @param {import('vue').Ref<boolean>|null} [options.enabledRef=null] - 可选：是否启用自动滚动的开关引用
 * @returns {{ scrollToActive: Function, scrollToIndex: Function, forceScrollToActive: Function, bindEvents: Function, unbindEvents: Function }}
 */
export function useAutoScroll(containerRef, activeIndexRef, itemsRef, options = {}) {
  // 解构配置项并设置默认值
  const {
    lineSelector = '.lyric-line',
    idleTimeout = 3000,
    enabledRef = null,
  } = options

  let userInteracting = false   // 用户是否正在手动滚动（true 时暂停自动滚动）
  let idleTimer = null          // 用户空闲恢复的计时器
  let rafId = null              // requestAnimationFrame 句柄（用于自定义平滑动画）

  /**
   * 判断自动滚动是否启用
   * @returns {boolean}
   */
  const isEnabled = () => {
    // 若提供了 enabledRef 且当前值为 false，则视为禁用
    if (enabledRef && enabledRef.value === false) return false
    return true
  }

  /**
   * 平滑滚动到指定 scrollTop 值（用 requestAnimationFrame 实现 easeInOut 动画）
   * @param {HTMLElement} container - 滚动容器
   * @param {number} target - 目标 scrollTop
   * @returns {void}
   */
  const smoothScrollTo = (container, target) => {
    // 取消上一次未完成的动画，避免抖动
    if (rafId) cancelAnimationFrame(rafId)
    const start = container.scrollTop
    const distance = target - start
    // 距离很小时直接到位，避免无意义动画
    if (Math.abs(distance) < 1) {
      container.scrollTop = target
      return
    }
    const duration = 320
    const startTime = performance.now()

    // 动画步进函数
    const step = (now) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      // easeInOutQuad 缓动函数
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      container.scrollTop = start + distance * eased
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        rafId = null
      }
    }
    rafId = requestAnimationFrame(step)
  }

  /**
   * 滚动到指定索引的歌词行（核心计算）
   * @param {number} index - 目标歌词行索引
   * @param {boolean} [force=false] - 是否强制滚动（忽略用户交互暂停）
   * @returns {void}
   */
  const scrollToIndex = (index, force = false) => {
    // 用户正在交互且非强制时，跳过自动滚动
    if (!force && userInteracting) return

    const container = containerRef.value
    if (!container) return
    const lines = container.querySelectorAll(lineSelector)
    if (index < 0 || index >= lines.length) return

    const targetEl = lines[index]
    const total = lines.length

    // 边界处理 1：第一句 → 滚动到顶部，避免上方留白
    if (index === 0) {
      smoothScrollTo(container, 0)
      return
    }

    // 边界处理 2：倒数第 1、2 句 → 滚动到底部，避免下方留白
    if (index >= total - 2) {
      const maxScroll = container.scrollHeight - container.clientHeight
      smoothScrollTo(container, maxScroll)
      return
    }

    // 一般情况：让当前行位于"第二行位置"
    // 用 getBoundingClientRect 相对计算，避免 offsetParent 不一致的问题
    const containerRect = container.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
    // 当前行顶部相对容器内容顶部的绝对偏移
    const offsetTopAbsolute = targetRect.top - containerRect.top + container.scrollTop
    // 目标 scrollTop = 当前行顶部偏移 - 当前行高度 - 间距（让顶部刚好露出一行）
    const targetScrollTop = offsetTopAbsolute - targetEl.offsetHeight - 4

    // 限制在合法范围
    const maxScroll = container.scrollHeight - container.clientHeight
    const clamped = Math.max(0, Math.min(targetScrollTop, maxScroll))
    smoothScrollTo(container, clamped)
  }

  /**
   * 滚动到当前高亮行（受用户交互暂停控制）
   * @returns {void}
   */
  const scrollToActive = () => {
    if (!isEnabled()) return
    scrollToIndex(activeIndexRef.value, false)
  }

  /**
   * 强制滚动到当前高亮行（忽略用户交互暂停，并重置空闲计时）
   * 用于用户点击歌词跳转的场景
   * @returns {void}
   */
  const forceScrollToActive = () => {
    if (!isEnabled()) return
    // 用户主动点击算作一次交互，重置空闲计时
    resetIdleTimer()
    scrollToIndex(activeIndexRef.value, true)
  }

  /**
   * 强制滚动到指定索引的歌词行（忽略用户交互暂停，并重置空闲计时）
   * 用于用户点击歌词后立即滚动到点击句，避免等待 activeIndexRef 异步更新造成的跳转延迟
   * @param {number} index - 目标歌词行索引
   * @returns {void}
   */
  const forceScrollToIndex = (index) => {
    if (!isEnabled()) return
    // 用户主动点击算作一次交互，重置空闲计时
    resetIdleTimer()
    scrollToIndex(index, true)
  }

  /**
   * 重置自动滚动状态（切换单元时调用）
   * 清除用户交互暂停、空闲计时器，并把容器滚回顶部
   * @returns {void}
   */
  const reset = () => {
    userInteracting = false
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    const container = containerRef.value
    if (container) {
      container.scrollTop = 0
    }
  }

  /**
   * 重置用户空闲计时器（用户停止操作一段时间后恢复自动滚动）
   * @returns {void}
   */
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      userInteracting = false
    }, idleTimeout)
  }

  /**
   * 用户手动滚动事件处理（wheel / touch / 鼠标按下拖滚动条）
   * @returns {void}
   */
  const onUserInteract = () => {
    userInteracting = true
    resetIdleTimer()
  }

  // ========== 监听高亮索引变化，触发自动滚动 ==========
  const stopWatch = watch(activeIndexRef, (newIndex) => {
    if (!isEnabled()) return
    if (newIndex < 0) return
    if (!itemsRef.value || !itemsRef.value.length) return
    scrollToActive()
  })

  // ========== 事件绑定与解绑 ==========
  let bound = false

  /**
   * 绑定用户交互事件到滚动容器
   * @returns {void}
   */
  const bindEvents = () => {
    const container = containerRef.value
    if (!container || bound) return
    // 滚轮、触摸开始/移动、鼠标按下（拖滚动条或点击行）都视为用户交互
    container.addEventListener('wheel', onUserInteract, { passive: true })
    container.addEventListener('touchstart', onUserInteract, { passive: true })
    container.addEventListener('touchmove', onUserInteract, { passive: true })
    container.addEventListener('mousedown', onUserInteract, { passive: true })
    bound = true
  }

  /**
   * 解绑用户交互事件
   * @returns {void}
   */
  const unbindEvents = () => {
    const container = containerRef.value
    if (!container) return
    container.removeEventListener('wheel', onUserInteract)
    container.removeEventListener('touchstart', onUserInteract)
    container.removeEventListener('touchmove', onUserInteract)
    container.removeEventListener('mousedown', onUserInteract)
    bound = false
  }

  // 在组件挂载后绑定事件
  onMounted(() => {
    bindEvents()
  })

  // 在组件卸载前清理资源
  onBeforeUnmount(() => {
    unbindEvents()
    if (idleTimer) clearTimeout(idleTimer)
    if (rafId) cancelAnimationFrame(rafId)
    stopWatch()
  })

  return {
    scrollToActive,        // 滚动到当前高亮（受用户交互控制）
    forceScrollToActive,   // 强制滚动到当前高亮（点击跳转用）
    forceScrollToIndex,    // 强制滚动到指定索引（点击跳转用，避免索引异步延迟）
    scrollToIndex,         // 滚动到指定索引
    reset,                 // 重置状态并滚回顶部（切换单元用）
    bindEvents,            // 重新绑定事件（容器变化时调用）
    unbindEvents,          // 解绑事件
  }
}
