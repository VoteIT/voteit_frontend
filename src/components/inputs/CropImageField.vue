<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useDropZone, useElementSize } from '@vueuse/core'

import DefaultDialog from '@/components/DefaultDialog.vue'
import { withinBounds } from '../utils'

type ImageSize = { width: number; height: number }
type CropArea = { sx: number; sy: number; sWidth: number; sHeight: number }

const DATA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

const props = withDefaults(
  defineProps<{
    aspectRatio?: string
    clearable?: boolean
    label?: string
    errorMessages?: string[]
    maxSize?: number
    rounded?: boolean
    src?: string
  }>(),
  {
    aspectRatio: '1',
    maxSize: 640
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Blob | null): void
}>()

const image = reactive({
  croppingOpen: false,
  src: props.src, // beskuren thumbnail — visas i huvudvyn
  origSrc: undefined as string | undefined, // full originalbild — visas i beskärningsdialogen
  failed: false,
  file: null as File | null,
  loading: false,
  origSize: null as ImageSize | null,
  cropArea: null as CropArea | null
})

/**
 * Test generation of dataURL in different formats to find the most efficient file format for used browser.
 */
const formatPrio = ['image/webp', 'image/jpeg', 'image/png'] as const
function toFormatDataURL(canvas: HTMLCanvasElement) {
  for (const type of formatPrio) {
    const dataURL = canvas.toDataURL(type)
    if (dataURL.startsWith(`data:${type}`)) return [type, dataURL]
  }
  throw new Error('No supported image data format found!')
}

function getScaled({ width, height }: { width: number; height: number }) {
  const imageMax = Math.max(height, width)
  const scale = Math.min(imageMax, props.maxSize) / imageMax
  return {
    width: scale * width,
    height: scale * height
  }
}

function loadOriginalImage(
  file: File
): Promise<{ src: string; orig: ImageSize }> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) return reject(new Error('Not an image'))
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (evt) => {
      const dataURL = evt.target?.result as string | undefined
      if (!dataURL) return reject(new Error('No result'))
      const img = new Image()
      img.onerror = reject
      img.onload = () =>
        resolve({
          src: dataURL,
          orig: { width: img.naturalWidth, height: img.naturalHeight }
        })
      img.src = dataURL
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Turn aspect ration as width/height from string
 * @param aspectRatio A string, for example 1.234, 1 or 16/9
 */
const targetRatio = computed(() => {
  const [wAsp, hAsp] = props.aspectRatio.split('/').map(Number)
  if (hAsp) return wAsp / hAsp
  // If only one value, that is the actual target ratio
  return wAsp
})

function initCropArea(orig: ImageSize): CropArea {
  const sWidth = Math.min(orig.width, orig.height * targetRatio.value)
  const sHeight = sWidth / targetRatio.value
  return {
    sx: (orig.width - sWidth) / 2,
    sy: (orig.height - sHeight) / 2,
    sWidth,
    sHeight
  }
}

const cropData = computed(() => {
  if (!image.origSize || !image.cropArea) return
  const { sx, sy, sWidth, sHeight } = image.cropArea
  const { width: imgW, height: imgH } = image.origSize
  return {
    fractions: {
      left: sx / imgW,
      top: sy / imgH,
      right: (imgW - sx - sWidth) / imgW,
      bottom: (imgH - sy - sHeight) / imgH
    },
    absolute: {
      x: sx,
      y: sy,
      width: sWidth,
      height: sHeight
    }
  }
})

function resizeImage(file: File, crop?: (typeof cropData)['value']) {
  const reader = new FileReader()
  const img = new Image()

  return new Promise<{
    blob: Blob
    orig: ImageSize
    size: ImageSize
    src: string
  }>((resolve, reject) => {
    if (!file.type.match(/image.*/)) return reject(new Error('Not an image'))

    reader.onload = (evt) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const orig = { width: img.width, height: img.height }
        const size = getScaled(crop?.absolute ?? orig)
        canvas.width = size.width
        canvas.height = size.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error(`Can't draw image, no 2d context`)
        if (crop) {
          const abs = crop.absolute
          context.drawImage(
            img,
            abs.x,
            abs.y,
            abs.width,
            abs.height,
            0,
            0,
            canvas.width,
            canvas.height
          )
        } else context.drawImage(img, 0, 0, canvas.width, canvas.height)
        // Find most efficient format and create dataURL string
        const [type, src] = toFormatDataURL(canvas)
        canvas.toBlob(
          (blob) => {
            if (!blob) throw new Error(`Can't scale image, no blob generated`)
            resolve({ blob, orig, size, src })
          },
          type,
          0.8
        )
      }
      if (!evt.target?.result) return reject(new Error('No result'))
      img.src = evt.target.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

watch(
  () => image.file,
  async (file) => {
    image.failed = false
    if (file === null) return emit('update:modelValue', null)
    if (!file) return
    image.loading = true
    try {
      const { src, orig } = await loadOriginalImage(file)
      image.origSrc = src
      image.origSize = orig
      image.cropArea = initCropArea(orig)
      const { blob, src: croppedSrc } = await resizeImage(file, cropData.value)
      image.src = croppedSrc
      emit('update:modelValue', blob)
    } catch {
      image.failed = true
    }
    image.loading = false
    image.croppingOpen = true
  },
  { immediate: true }
)

watch(
  () => props.src,
  (src) => {
    image.src = src
  }
)

function isFileInput(e: Event): e is InputEvent & { target: HTMLInputElement } {
  return !!e.target && 'files' in e.target
}

function openImageSelector() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = DATA_TYPES.join(',')

  input.addEventListener('change', (e) => {
    if (isFileInput(e)) image.file = e.target.files?.[0] ?? null
  })
  input.click()
}

async function setCrop() {
  const { file } = image
  if (!file) throw new Error('No image selected')
  image.loading = true
  try {
    const { blob, src } = await resizeImage(file, cropData.value)
    image.src = src
    emit('update:modelValue', blob)
  } catch {
    image.failed = true
  }
  image.loading = false
  image.croppingOpen = false
}

const imageElem = ref<HTMLImageElement>()
const imageSize = useElementSize(imageElem)

type DragHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move'

const dragging = ref<{
  handle: DragHandle
  startX: number
  startY: number
  startArea: CropArea
} | null>(null)

function startDrag(handle: DragHandle, e: MouseEvent) {
  if (!image.cropArea) return
  dragging.value = {
    handle,
    startX: e.clientX,
    startY: e.clientY,
    startArea: { ...image.cropArea }
  }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragging.value || !image.origSize || !image.cropArea) return
  const scaleX = image.origSize.width / imageSize.width.value
  const scaleY = image.origSize.height / imageSize.height.value
  const dx = (e.clientX - dragging.value.startX) * scaleX
  const dy = (e.clientY - dragging.value.startY) * scaleY
  const { sx, sy, sWidth, sHeight } = dragging.value.startArea
  const { width: imgW, height: imgH } = image.origSize
  const ratio = targetRatio.value
  const MIN = Math.min(imgW, imgH) * 0.1

  const next: CropArea = { sx, sy, sWidth, sHeight }

  switch (dragging.value.handle) {
    case 'move': {
      next.sx = withinBounds(sx + dx, 0, imgW - sWidth)
      next.sy = withinBounds(sy + dy, 0, imgH - sHeight)
      break
    }
    case 'br': {
      const w = withinBounds(sWidth + dx, MIN, imgW - sx)
      const h = w / ratio
      if (sy + h <= imgH) {
        next.sWidth = w
        next.sHeight = h
      }
      break
    }
    case 'bl': {
      const w = withinBounds(sWidth - dx, MIN, sx + sWidth)
      const h = w / ratio
      if (sy + h <= imgH) {
        next.sx = sx + sWidth - w
        next.sWidth = w
        next.sHeight = h
      }
      break
    }
    case 'tr': {
      const w = withinBounds(sWidth + dx, MIN, imgW - sx)
      const h = w / ratio
      if (sy + sHeight - h >= 0) {
        next.sy = sy + sHeight - h
        next.sWidth = w
        next.sHeight = h
      }
      break
    }
    case 'tl': {
      const w = withinBounds(sWidth - dx, MIN, sx + sWidth)
      const h = w / ratio
      if (sy + sHeight - h >= 0) {
        next.sx = sx + sWidth - w
        next.sy = sy + sHeight - h
        next.sWidth = w
        next.sHeight = h
      }
      break
    }
    case 'r': {
      const w = withinBounds(sWidth + dx, MIN, imgW - sx)
      const h = w / ratio
      next.sWidth = w
      next.sHeight = h
      next.sy = withinBounds(sy + (sHeight - h) / 2, 0, imgH - h)
      break
    }
    case 'l': {
      const w = withinBounds(sWidth - dx, MIN, sx + sWidth)
      const h = w / ratio
      next.sx = sx + sWidth - w
      next.sWidth = w
      next.sHeight = h
      next.sy = withinBounds(sy + (sHeight - h) / 2, 0, imgH - h)
      break
    }
    case 'b': {
      const h = withinBounds(sHeight + dy, MIN, imgH - sy)
      const w = h * ratio
      next.sHeight = h
      next.sWidth = w
      next.sx = withinBounds(sx + (sWidth - w) / 2, 0, imgW - w)
      break
    }
    case 't': {
      const h = withinBounds(sHeight - dy, MIN, sy + sHeight)
      const w = h * ratio
      next.sy = sy + sHeight - h
      next.sHeight = h
      next.sWidth = w
      next.sx = withinBounds(sx + (sWidth - w) / 2, 0, imgW - w)
      break
    }
  }

  image.cropArea = next
}

function stopDrag() {
  dragging.value = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

/* Drop zone logic */
const dropZoneRef = shallowRef<HTMLDivElement>()
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (!files) return
    image.file = files[0]
  },
  dataTypes: DATA_TYPES,
  multiple: false
})
</script>

<template>
  <v-input :error-messages="errorMessages">
    <v-sheet class="pa-2 pa-sm-4 w-100" rounded>
      <div class="d-flex flex-column flex-sm-row ga-2 ga-sm-4">
        <div class="flex-shrink-0 w-100 w-sm-50">
          <div
            class="preview-wrapper"
            :style="{ aspectRatio }"
            ref="dropZoneRef"
          >
            <!-- Image container — overflow:hidden klipper rundningen -->
            <div
              class="preview-container"
              :class="{
                'preview-container--rounded': rounded,
                'preview-container--active': isOverDropZone
              }"
            >
              <div
                v-if="!image.src && image.file === null"
                class="preview-placeholder cursor-pointer d-flex flex-column justify-center align-center pa-12"
                @click="openImageSelector"
              >
                <v-icon icon="mdi-camera" size="x-large" />
                <p class="text-center">{{ $t('img.upload') }}</p>
              </div>
              <img v-else-if="image.src" :src="image.src" class="preview-img" />
            </div>

            <!-- Knappar utanför overflow:hidden — beskärs inte av rundningen -->
            <div
              v-if="image.src || image.file !== null"
              class="preview-actions pa-2 d-flex flex-column align-end ga-1"
            >
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                size="small"
                :text="$t('img.change')"
                @click="openImageSelector"
              />
              <DefaultDialog
                v-if="image.file"
                :title="$t('img.cropping')"
                v-model="image.croppingOpen"
              >
                <template #activator="{ props }">
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-box-cutter"
                    size="small"
                    :text="$t('img.cropping')"
                    v-bind="props"
                  />
                </template>
                <template #default="{ close }">
                  <div
                    v-if="cropData && image.origSrc"
                    class="focus-selection mb-4 overflow-hidden"
                    :style="{
                      '--crop-left': `${cropData.fractions.left * 100}%`,
                      '--crop-top': `${cropData.fractions.top * 100}%`,
                      '--crop-right': `${cropData.fractions.right * 100}%`,
                      '--crop-bottom': `${cropData.fractions.bottom * 100}%`
                    }"
                  >
                    <img :src="image.origSrc" ref="imageElem" />
                    <div
                      class="crop-frame"
                      :class="{ 'crop-frame--rounded': rounded }"
                    ></div>
                    <div
                      class="crop-move"
                      @mousedown.prevent="startDrag('move', $event)"
                    ></div>
                    <div
                      class="handle handle-t"
                      @mousedown.prevent="startDrag('t', $event)"
                    ></div>
                    <div
                      class="handle handle-b"
                      @mousedown.prevent="startDrag('b', $event)"
                    ></div>
                    <div
                      class="handle handle-l"
                      @mousedown.prevent="startDrag('l', $event)"
                    ></div>
                    <div
                      class="handle handle-r"
                      @mousedown.prevent="startDrag('r', $event)"
                    ></div>
                    <div
                      class="handle handle-tl"
                      @mousedown.prevent="startDrag('tl', $event)"
                    ></div>
                    <div
                      class="handle handle-tr"
                      @mousedown.prevent="startDrag('tr', $event)"
                    ></div>
                    <div
                      class="handle handle-bl"
                      @mousedown.prevent="startDrag('bl', $event)"
                    ></div>
                    <div
                      class="handle handle-br"
                      @mousedown.prevent="startDrag('br', $event)"
                    ></div>
                  </div>
                  <div class="mb-4">
                    <h3>{{ $t('img.preview') }}</h3>
                    <p>{{ $t('img.focusPointInfo') }}</p>
                  </div>
                  <div class="text-right">
                    <v-btn variant="text" :text="$t('cancel')" @click="close" />
                    <v-btn
                      color="primary"
                      :loading="image.loading"
                      :text="$t('ok')"
                      @click="setCrop"
                    />
                  </div>
                </template>
              </DefaultDialog>
              <v-btn
                v-if="clearable"
                class="mt-auto"
                color="warning"
                prepend-icon="mdi-close"
                size="small"
                :text="$t('img.clear')"
                @click="image.file = null"
              />
            </div>
          </div>
        </div>
        <div class="d-flex flex-column">
          <h2 v-if="label" class="mb-2">{{ label }}</h2>
          <p>{{ $t('img.allowedFormats') }}</p>
          <v-spacer />
          <slot name="actions"></slot>
        </div>
      </div>
    </v-sheet>
  </v-input>
</template>

<style lang="sass" scoped>
.v-sheet
  background-color: rgba(0,0,0,var(--v-idle-opacity))

.preview-wrapper
  position: relative

.preview-container
  position: absolute
  inset: 0
  overflow: hidden
  border-radius: 4px
  background-color: rgba(0, 0, 0, var(--v-idle-opacity))
  transition: box-shadow 0.2s

  &--rounded
    border-radius: 50%

  &--active
    box-shadow: 0 5px 5px -3px rgba(0,0,0,0.2), 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12)

.preview-placeholder
  height: 100%

.preview-img
  width: 100%
  height: 100%
  object-fit: cover
  display: block

.preview-actions
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: flex-end
  padding: 8px
  gap: 4px

.focus-selection
  position: relative
  line-height: 0
  img
    width: 100%
    filter: brightness(0.8)

  .crop-frame
    position: absolute
    left: var(--crop-left)
    top: var(--crop-top)
    right: var(--crop-right)
    bottom: var(--crop-bottom)
    pointer-events: none
    box-shadow: 0 0 0 9999px rgba(32, 32, 32, 0.7)
    border: 1px solid rgba(255, 255, 255, 0.5)

    &--rounded
      border-radius: 50%

  .crop-move
    position: absolute
    left: var(--crop-left)
    top: var(--crop-top)
    right: var(--crop-right)
    bottom: var(--crop-bottom)
    cursor: move

  .handle
    position: absolute
    width: 10px
    height: 10px
    background: white
    border: 1px solid rgba(0, 0, 0, 0.5)
    z-index: 1

  .handle-t
    left: calc(var(--crop-left) + (100% - var(--crop-left) - var(--crop-right)) / 2)
    top: var(--crop-top)
    transform: translate(-50%, -50%)
    cursor: n-resize

  .handle-b
    left: calc(var(--crop-left) + (100% - var(--crop-left) - var(--crop-right)) / 2)
    bottom: var(--crop-bottom)
    transform: translate(-50%, 50%)
    cursor: s-resize

  .handle-l
    left: var(--crop-left)
    top: calc(var(--crop-top) + (100% - var(--crop-top) - var(--crop-bottom)) / 2)
    transform: translate(-50%, -50%)
    cursor: w-resize

  .handle-r
    right: var(--crop-right)
    top: calc(var(--crop-top) + (100% - var(--crop-top) - var(--crop-bottom)) / 2)
    transform: translate(50%, -50%)
    cursor: e-resize

  .handle-tl
    left: var(--crop-left)
    top: var(--crop-top)
    transform: translate(-50%, -50%)
    cursor: nw-resize

  .handle-tr
    right: var(--crop-right)
    top: var(--crop-top)
    transform: translate(50%, -50%)
    cursor: ne-resize

  .handle-bl
    left: var(--crop-left)
    bottom: var(--crop-bottom)
    transform: translate(-50%, 50%)
    cursor: sw-resize

  .handle-br
    right: var(--crop-right)
    bottom: var(--crop-bottom)
    transform: translate(50%, 50%)
    cursor: se-resize
</style>
