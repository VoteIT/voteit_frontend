<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useDropZone, useElementSize } from '@vueuse/core'

import PositionedImage from '@/components/PositionedImage.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import { withinBounds } from '../utils'

type ImageSize = { width: number; height: number }

const DATA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

const props = withDefaults(
  defineProps<{
    aspectRatio?: string
    clearable?: boolean
    crop?: boolean
    label?: string
    errorMessages?: string[]
    maxSize?: number
    position?: { x: number; y: number }
    src?: string
  }>(),
  {
    aspectRatio: '1',
    maxSize: 640,
    position: () => ({ x: 0.5, y: 0.5 })
  }
)

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'update:modelValue', value: Blob | null): void
  (e: 'update:position', value: { x: number; y: number }): void
}>()

const { xs } = useDisplay()

const image = reactive({
  src: props.src,
  failed: false,
  file: null as File | null,
  loading: false,
  origSize: null as ImageSize | null,
  size: null as ImageSize | null,
  position: props.position
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

const cropX = computed(() => {
  if (!image.size) return
  const { width, height } = image.size
  const imageRatio = width / height
  return imageRatio > targetRatio.value
})

const cropData = computed(() => {
  if (!image.origSize) return
  const { width, height } = image.origSize
  if (cropX.value) {
    const croppedWidth = height * targetRatio.value
    const full = croppedWidth / width
    const half = full / 2 // Only true for 1/1 ratio
    const minCrop = 1 - full
    const fractions = {
      start: withinBounds(image.position.x - half, 0, minCrop),
      end: withinBounds(1 - image.position.x - half, 0, minCrop)
    }
    return {
      width,
      height,
      fractions,
      // TODO: Calculate cutting positions here for drawImage (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)
      absolute: {
        x: width * fractions.start,
        y: 0,
        width: croppedWidth,
        height: height
      }
    }
  }

  const croppedHeight = width * targetRatio.value
  const full = croppedHeight / height
  const half = full / 2
  const minCrop = 1 - full
  const fractions = {
    start: withinBounds(image.position.y - half, 0, minCrop),
    end: withinBounds(1 - image.position.y - half, 0, minCrop)
  }
  return {
    width,
    height,
    fractions,
    absolute: {
      x: 0,
      y: height * fractions.start,
      width,
      height: croppedHeight
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
    if (!file) return // Revoke old using URL.revokeObjectURL()?
    image.loading = true
    try {
      if (props.crop) {
        const [full, cropped] = await Promise.all([
          resizeImage(file),
          resizeImage(file, cropData.value)
        ])
        image.origSize = full.orig
        image.src = full.src
        image.size = full.size
        emit('update:modelValue', cropped.blob)
      } else {
        const full = await resizeImage(file)
        emit('update:modelValue', full.blob)
        image.origSize = full.orig
        image.size = full.size
        image.src = full.src
      }
    } catch {
      image.failed = true
    }
    image.loading = false
  }
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

async function savePosition(close: () => void) {
  const { position, file } = image
  if (props.crop) {
    if (!file) throw new Error('No image selected')
    image.loading = true
    try {
      const { blob } = await resizeImage(file, cropData.value)
      emit('update:modelValue', blob)
    } catch {
      image.failed = true
    }
    image.loading = false
  }
  emit('update:position', position)
  close()
}

const imageElem = ref<HTMLImageElement>()
const imageSize = useElementSize(imageElem)

function setPosition(e: MouseEvent) {
  if (e.buttons !== 1) return
  image.position = {
    x: withinBounds(e.layerX / imageSize.width.value),
    y: withinBounds(e.layerY / imageSize.height.value)
  }
}

const aspectText = computed(() =>
  targetRatio.value === 1
    ? 'kvadratiskt format'
    : `bildförhållande ${props.aspectRatio.replace('/', ':')}`
)

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
    <v-sheet class="pa-2 pa-sm-4" rounded>
      <div class="d-flex flex-column flex-sm-row ga-2 ga-sm-4">
        <div class="flex-shrink-0">
          <PositionedImage
            v-if="!image.src && image.file === null"
            :active="isOverDropZone"
            :aspect-ratio="aspectRatio"
            class="cursor-pointer d-flex"
            :position="image.position"
            ref="dropZoneRef"
            rounded
            width="280px"
            @click="openImageSelector"
          >
            <div
              class="flex-grow-1 pa-12 d-flex flex-column justify-center align-center"
            >
              <v-icon icon="mdi-camera" size="x-large" />
              <p class="text-center">{{ $t('img.upload') }}</p>
            </div>
          </PositionedImage>
          <PositionedImage
            v-else
            :active="isOverDropZone"
            :aspect-ratio="aspectRatio"
            class="d-flex"
            :src="image.src"
            :position="image.position"
            ref="dropZoneRef"
            rounded
            width="280px"
          >
            <div class="flex-grow-1 pa-2 d-flex flex-column align-end ga-1">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                size="small"
                :text="$t('img.change')"
                @click="openImageSelector"
              />
              <DefaultDialog
                v-if="!crop || image.file"
                :title="crop ? $t('img.cropping') : $t('img.focusPoint')"
              >
                <template #activator="{ props }">
                  <v-btn
                    color="primary"
                    :prepend-icon="
                      crop ? 'mdi-box-cutter' : 'mdi-image-filter-center-focus'
                    "
                    size="small"
                    :text="crop ? $t('img.cropping') : $t('img.focusPoint')"
                    v-bind="props"
                  />
                </template>
                <template v-if="cropData" #default="{ close }">
                  <div
                    v-if="image.src"
                    class="focus-selection mb-4 overflow-hidden"
                    :class="{ cropX }"
                    :style="{
                      '--crop-start': `${cropData.fractions.start * 100}%`,
                      '--crop-end': `${cropData.fractions.end * 100}%`
                    }"
                  >
                    <img
                      :src="image.src"
                      @mousedown.prevent="setPosition"
                      @pointermove.prevent="setPosition"
                      ref="imageElem"
                    />
                    <div class="crop-start"></div>
                    <div class="crop-end"></div>
                  </div>
                  <div class="mb-4">
                    <h3>{{ $t('img.preview') }}</h3>
                    <p>
                      {{ $t('img.focusPointInfo') }}
                    </p>
                  </div>
                  <div class="text-right">
                    <v-btn variant="text" :text="$t('cancel')" @click="close" />
                    <v-btn
                      color="primary"
                      :loading="image.loading"
                      :text="$t('ok')"
                      @click="savePosition(close)"
                    />
                  </div>
                </template>
                <template v-else #default="{ close }">
                  <div
                    v-if="image.src"
                    class="focus-selection mb-4 overflow-hidden"
                    :style="{
                      '--pos-x': `${image.position.x * 100}%`,
                      '--pos-y': `${image.position.y * 100}%`
                    }"
                  >
                    <img
                      :src="image.src"
                      @mousedown.prevent="setPosition"
                      @pointermove.prevent="setPosition"
                      ref="imageElem"
                    />
                    <div class="focus-point"></div>
                  </div>
                  <div class="d-flex flex-sm-row ga-4 mb-4">
                    <div class="flex-grow-1">
                      <h3>{{ $t('img.preview') }}</h3>
                      <p>
                        {{ $t('img.focusPointInfo') }}
                      </p>
                    </div>
                    <div class="flex-shrink-0">
                      <PositionedImage
                        :aspect-ratio="aspectRatio"
                        :position="image.position"
                        rounded
                        :src="image.src"
                        :width="xs ? 100 : 200"
                      />
                    </div>
                  </div>
                  <div class="text-right">
                    <v-btn variant="text" :text="$t('cancel')" @click="close" />
                    <v-btn
                      color="primary"
                      :text="$t('ok')"
                      @click="savePosition(close)"
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
          </PositionedImage>
        </div>
        <div>
          <h2 v-if="label" class="mb-2">{{ label }}</h2>
          <p class="mb-1">{{ $t('img.cropAspect', { aspectText }) }}</p>
          <p>{{ $t('img.allowedFormats') }}</p>
        </div>
      </div>
    </v-sheet>
  </v-input>
</template>

<style lang="sass" scoped>
.v-sheet
  background-color: rgba(0,0,0,var(--v-idle-opacity))

.focus-selection
  position: relative
  line-height: 0
  img
    width: 100%
    filter: brightness(0.8)
  .focus-point
    position: absolute
    left: calc(var(--pos-x) - 16px)
    top: calc(var(--pos-y) - 16px)
    width: 32px
    height: 32px
    border-radius: 50%
    background-color: rgba(200,200,200,0.6)

  .crop-start,
  .crop-end
    position: absolute
    background-color: rgba(32,32,32,.7)
    pointer-events: none

  .crop-start
    border-bottom: 1px solid rgba(0,0,0,.8)
    top: 0
    left: 0
    right: 0
    height: var(--crop-start)

  .crop-end
    border-left: 1px solid rgba(0,0,0,.8)
    bottom: 0
    left: 0
    right: 0
    height: var(--crop-end)

  &.cropX
    .crop-start
      border-right: 1px solid rgba(0,0,0,.8)
      bottom: 0
      right: unset
      width: var(--crop-start)
      height: auto

    .crop-end
      border-left: 1px solid rgba(0,0,0,.8)
      top: 0
      left: unset
      height: auto
      width: var(--crop-end)
</style>
