// @ts-ignore: 依赖实际运行环境中的 ol 包类型声明
import Map from 'ol/Map'
// @ts-ignore: 依赖实际运行环境中的 ol 包类型声明
import Control from 'ol/control/Control'
// @ts-ignore: 依赖实际运行环境中的 ol 包类型声明
import DragBox from 'ol/interaction/DragBox'
// @ts-ignore: 依赖实际运行环境中的 ol 包类型声明
import DragPan from 'ol/interaction/DragPan'

const STYLE_ID = 'ol-toolbar-control-default-style'

/**
 * 为 Control 版本注入一套默认样式（包含内联 SVG 图标）
 * 只注入一次，不会重复插入
 */
function injectDefaultStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.type = 'text/css'

  style.textContent = `
.ol-toolbar-control {
  position: absolute;
  top: 10px;
  right: 10px;
}

.ol-toolbar-control-group {
  display: inline-flex;
  gap: 4px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.ol-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #409eff;
  background-color: #409eff;
  color: #fff;
  font-size: 12px;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 3px;
  cursor: pointer;
  outline: none;
}

.ol-toolbar-btn + .ol-toolbar-btn {
  margin-left: 2px;
}

.ol-toolbar-btn-primary {
  background-color: #409eff;
  border-color: #409eff;
}

.ol-toolbar-btn-success {
  background-color: #67c23a;
  border-color: #67c23a;
}

.ol-toolbar-btn-info {
  background-color: #909399;
  border-color: #909399;
}

.ol-toolbar-btn:hover {
  filter: brightness(1.05);
}

.ol-toolbar-btn.is-active {
  box-shadow: 0 0 0 1px #fff inset;
}

/* 图标：使用内联 SVG 作为背景图标 */
.ol-toolbar-btn-zoom-in {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 5v14M5 12h14' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
}

.ol-toolbar-btn-zoom-out {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 12h14' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
}

.ol-toolbar-btn-full-extent {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='5' y='5' width='14' height='14' rx='2' ry='2' fill='none' stroke='%23ffffff' stroke-width='2'/%3E%3Cpath d='M9 9h6v6H9z' fill='%23ffffff'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
}

.ol-toolbar-btn-refresh {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 11a7 7 0 0 1 11.9-4.9L19 9M19 5V9M19 13a7 7 0 0 1-11.9 4.9L5 15M5 19v-4' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
}
`

  document.head.appendChild(style)
}

type Mode = 'zoomIn' | 'zoomOut' | null

export interface OlToolbarControlOptions {
  /**
   * 初始模式（一般为 null）
   */
  initialMode?: Mode
  /**
   * 自定义容器元素（如果不传，默认添加到地图控件容器）
   * 传入后，控件会被添加到这个容器，位置由客户自己的 CSS 控制
   * 可以是 DOM 元素或选择器字符串
   */
  target?: HTMLElement | string
  /**
   * 自定义根元素的 className（用于客户自定义样式）
   */
  className?: string
  /**
   * 自定义位置（如果传了 target，这个会被忽略，位置由客户 CSS 控制）
   */
  position?: {
    top?: string | number
    left?: string | number
    right?: string | number
    bottom?: string | number
  }
}

/**
 * 一个基于 OpenLayers Control 的工具栏实现
 * 适用于不使用 Vue / Element Plus 的项目
 */
export class OlToolbarControl extends Control {
  private mapRef: Map | null = null
  private activeMode: Mode = null
  private dragBoxInteraction: DragBox | null = null
  private dragPanInteraction: DragPan | null = null
  private boxEndHandler: (() => void) | null = null

  private zoomInButton: HTMLButtonElement
  private zoomOutButton: HTMLButtonElement
  private fullExtentButton: HTMLButtonElement
  private refreshButton: HTMLButtonElement

  constructor(options: OlToolbarControlOptions = {}) {
    injectDefaultStyles()

    const element = document.createElement('div')
    element.className = 'ol-unselectable ol-control ol-toolbar-control'

    // 添加自定义 className
    if (options.className) {
      element.className += ` ${options.className}`
    }

    const buttonGroup = document.createElement('div')
    buttonGroup.className = 'ol-toolbar-control-group'

    const zoomInButton = document.createElement('button')
    zoomInButton.type = 'button'
    zoomInButton.title = '放大'
    zoomInButton.className =
      'ol-toolbar-btn ol-toolbar-btn-primary ol-toolbar-btn-zoom-in'

    const zoomOutButton = document.createElement('button')
    zoomOutButton.type = 'button'
    zoomOutButton.title = '缩小'
    zoomOutButton.className =
      'ol-toolbar-btn ol-toolbar-btn-primary ol-toolbar-btn-zoom-out'

    const fullExtentButton = document.createElement('button')
    fullExtentButton.type = 'button'
    fullExtentButton.title = '全图'
    fullExtentButton.className =
      'ol-toolbar-btn ol-toolbar-btn-success ol-toolbar-btn-full-extent'

    const refreshButton = document.createElement('button')
    refreshButton.type = 'button'
    refreshButton.title = '刷新'
    refreshButton.className =
      'ol-toolbar-btn ol-toolbar-btn-info ol-toolbar-btn-refresh'

    buttonGroup.appendChild(zoomInButton)
    buttonGroup.appendChild(zoomOutButton)
    buttonGroup.appendChild(fullExtentButton)
    buttonGroup.appendChild(refreshButton)

    element.appendChild(buttonGroup)

    // 处理 target 选项
    let target: HTMLElement | string | undefined = options.target
    if (target && typeof target === 'string') {
      // 如果是字符串选择器，尝试查找元素
      const foundElement = document.querySelector(target) as HTMLElement
      if (foundElement) {
        target = foundElement
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `OlToolbarControl: 未找到选择器 "${options.target}" 对应的元素，将使用默认容器`
        )
        target = undefined
      }
    }

    // 处理 position 选项（只有在没有传 target 时才生效）
    if (!target && options.position) {
      const pos = options.position
      if (pos.top !== undefined) {
        element.style.top =
          typeof pos.top === 'number' ? `${pos.top}px` : pos.top
      }
      if (pos.left !== undefined) {
        element.style.left =
          typeof pos.left === 'number' ? `${pos.left}px` : pos.left
      }
      if (pos.right !== undefined) {
        element.style.right =
          typeof pos.right === 'number' ? `${pos.right}px` : pos.right
      }
      if (pos.bottom !== undefined) {
        element.style.bottom =
          typeof pos.bottom === 'number' ? `${pos.bottom}px` : pos.bottom
      }
    }

    super({
      element,
      target: target as HTMLElement | undefined
    })

    this.zoomInButton = zoomInButton
    this.zoomOutButton = zoomOutButton
    this.fullExtentButton = fullExtentButton
    this.refreshButton = refreshButton

    if (options.initialMode) {
      this.setActiveMode(options.initialMode)
    }

    this.bindEvents()
  }

  /**
   * OpenLayers 会在 control 被添加 / 移除到地图时调用 setMap
   */
  setMap(map: Map | null): void {
    if (this.mapRef && this.dragBoxInteraction) {
      // 从旧地图移除交互
      this.cleanupInteractions()
    }

    super.setMap(map as any)
    this.mapRef = map
  }

  private bindEvents() {
    this.zoomInButton.addEventListener('click', () => {
      this.handleZoomIn()
    })

    this.zoomOutButton.addEventListener('click', () => {
      this.handleZoomOut()
    })

    this.fullExtentButton.addEventListener('click', () => {
      this.handleFullExtent()
    })

    this.refreshButton.addEventListener('click', () => {
      // 目前仅占位，留给业务自行扩展
      // 可以在外层监听地图事件或者扩展本类时重写
      // eslint-disable-next-line no-console
      console.info('OlToolbarControl: 刷新按钮被点击（默认无行为）')
    })
  }

  private setActiveMode(mode: Mode) {
    this.activeMode = mode

    this.zoomInButton.classList.toggle('is-active', mode === 'zoomIn')
    this.zoomOutButton.classList.toggle('is-active', mode === 'zoomOut')
  }

  private ensureMap(): Map | null {
    if (!this.mapRef) {
      // eslint-disable-next-line no-console
      console.warn('OlToolbarControl: map 实例未绑定，请先通过 map.addControl 添加到地图上')
      return null
    }
    return this.mapRef
  }

  private cleanupInteractions() {
    const map = this.mapRef
    if (!map) return

    if (this.dragBoxInteraction) {
      this.dragBoxInteraction.setActive(false)
      if (this.boxEndHandler) {
        this.dragBoxInteraction.un('boxend', this.boxEndHandler)
        this.boxEndHandler = null
      }
      map.removeInteraction(this.dragBoxInteraction)
      this.dragBoxInteraction = null
    }

    if (this.dragPanInteraction) {
      map.addInteraction(this.dragPanInteraction)
      this.dragPanInteraction = null
    }

    this.setActiveMode(null)
  }

  private activateDragBox(mode: Exclude<Mode, null>) {
    const map = this.ensureMap()
    if (!map) return

    // 再次点击同一模式则关闭
    if (this.activeMode === mode) {
      this.cleanupInteractions()
      return
    }

    // 如果已有交互，先清理
    if (this.dragBoxInteraction) {
      this.cleanupInteractions()
    }

    // 临时禁用地图的拖拽交互
    const interactions = map.getInteractions()
    interactions.forEach((interaction: any) => {
      if (interaction instanceof DragPan) {
        this.dragPanInteraction = interaction
        map.removeInteraction(interaction)
      }
    })

    // 创建新的 DragBox 交互
    this.dragBoxInteraction = new DragBox({
      condition: (event: any) => {
        return event.originalEvent.button === 0 && this.activeMode === mode
      }
    })

    this.boxEndHandler = () => {
      const currentMap = this.mapRef
      if (!currentMap || !this.dragBoxInteraction) return

      const view = currentMap.getView()
      const extent = this.dragBoxInteraction.getGeometry()?.getExtent()
      if (!extent) return

      if (mode === 'zoomIn') {
        view.fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 300
        })
      } else if (mode === 'zoomOut') {
        const mapSize = currentMap.getSize()
        if (mapSize) {
          const currentExtent = view.calculateExtent(mapSize)
          const currentWidth = currentExtent[2] - currentExtent[0]
          const currentHeight = currentExtent[3] - currentExtent[1]
          const boxWidth = extent[2] - extent[0]
          const boxHeight = extent[3] - extent[1]

          const ratioX = boxWidth / currentWidth
          const ratioY = boxHeight / currentHeight
          const ratio = Math.max(ratioX, ratioY)

          if (ratio < 1) {
            const currentZoom = view.getZoom() || 0
            const newZoom = currentZoom + Math.log2(ratio)
            view.animate({
              zoom: newZoom,
              center: view.getCenter(),
              duration: 300
            })
          } else {
            view.fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 300
            })
          }
        }
      }
    }

    this.dragBoxInteraction.on('boxend', this.boxEndHandler)
    map.addInteraction(this.dragBoxInteraction)
    this.setActiveMode(mode)
  }

  private handleZoomIn() {
    this.activateDragBox('zoomIn')
  }

  private handleZoomOut() {
    this.activateDragBox('zoomOut')
  }

  private handleFullExtent() {
    const map = this.ensureMap()
    if (!map) return

    this.cleanupInteractions()

    const view = map.getView()
    const layers = map.getLayers()

    const extents: number[][] = []

    layers.forEach((layer: any) => {
      if (layer.getVisible && layer.getVisible()) {
        const extent = layer.getExtent ? layer.getExtent() : null
        if (extent) {
          extents.push(extent)
        } else if (typeof layer.getSource === 'function') {
          const source = layer.getSource()
          if (source && typeof source.getExtent === 'function') {
            const sourceExtent = source.getExtent()
            if (sourceExtent) {
              extents.push(sourceExtent)
            }
          }
        }
      }
    })

    if (extents.length === 0) {
      const defaultExtent = [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
      view.fit(defaultExtent, {
        padding: [50, 50, 50, 50],
        duration: 500,
        maxZoom: 18
      })
      return
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    extents.forEach((extent) => {
      minX = Math.min(minX, extent[0])
      minY = Math.min(minY, extent[1])
      maxX = Math.max(maxX, extent[2])
      maxY = Math.max(maxY, extent[3])
    })

    const fullExtent = [minX, minY, maxX, maxY]

    view.fit(fullExtent, {
      padding: [50, 50, 50, 50],
      duration: 500,
      maxZoom: 18
    })
  }
}


