import restApi from '@/utils/restApi'
import { useStorage } from '@vueuse/core'
import { Settings } from 'luxon'
import { computed, nextTick, watch } from 'vue'
import { createI18n, I18n } from 'vue-i18n'

import en from '../locales/en.json'

const defaultLanguage = 'en'

const locales = import.meta.glob('@/locales/*.json', { as: 'raw' })
export const languages = Object.keys(locales).map(path => path.split('/').at(-1)!.split('.').at(0)!)
type Locale = typeof languages[number]

function isLocale (value: string): value is Locale {
  return languages.includes(value)
}

function resolveLocale (): Locale {
  for (let language of navigator.languages) {
    // We only work with short locale names now, i.e. ['en', 'sv', ...]
    language = language.split('-')[0]
    if (isLocale(language)) return language
  }
  return defaultLanguage
}

const browserLocale = resolveLocale()

const selectedLocale = useStorage<Locale | ''>('selectedLocale', '')
export const currentLocale = computed<Locale>({
  get () {
    return selectedLocale.value || browserLocale
  },
  set (locale: string) {
    if (!isLocale(locale)) throw new Error(`"${locale}" is not a valid locale`)
    selectedLocale.value = locale
  }
})

export function setLocale (locale: Locale) {
  if (!isLocale(locale)) throw new Error(`"${locale}" is not a valid locale`)
  selectedLocale.value = locale
}

export const i18n = createI18n({
  legacy: false,
  locale: currentLocale.value,
  fallbackLocale: 'en',
  messages: {
    en
  }
}) as I18n

async function loadLocaleMessages (i18n: I18n, locale: string) {
  const loader = locales[`/src/locales/${locale}.json`] as () => Promise<string>
  if (!loader) throw new Error(`Locale ${locale} not found!`)
  const raw = await loader()
  i18n.global.setLocaleMessage(locale, JSON.parse(raw))
  await nextTick()
}

/**
 * Set Axios header if locale is selected (not empty string)
 */
watch(selectedLocale, locale => {
  if (!locale) return
  restApi.defaults.headers['Accept-Language'] = locale
  Settings.defaultLocale = locale
}, { immediate: true })

watch(currentLocale, async (locale) => {
  // Load messages if not available
  if (!i18n.global.availableLocales.includes(locale)) await loadLocaleMessages(i18n, locale)
  // This should be a ref, not a string, but check anyway
  if (typeof i18n.global.locale === 'string') i18n.global.locale = locale
  else i18n.global.locale.value = locale
}, { immediate: true })
