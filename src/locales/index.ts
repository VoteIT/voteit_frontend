import { useStorage } from '@vueuse/core'
import { computed, nextTick, watch } from 'vue'
import { createI18n, I18n } from 'vue-i18n'

import en from './en.json'

const defaultLanguage = 'en'

export const languages = [
  {
    locale: 'en',
    name: 'English'
  },
  {
    locale: 'sv',
    name: 'Svenska'
  }
] as const
type Locale = typeof languages[number]['locale']

function isLocale (language: string): language is Locale {
  const short = language.split('-')[0]
  return languages.some(({ locale }) => locale === short)
}

function resolveLocale (): Locale {
  for (const language of navigator.languages) {
    if (isLocale(language)) return language
  }
  return defaultLanguage
}

export const browserLocale = resolveLocale()

const _currentLocale = useStorage<Locale>('currentLocale', browserLocale)
export const currentLocale = computed({
  get () {
    return _currentLocale.value
  },
  set (locale: string) {
    if (!isLocale(locale)) throw new Error(`"${locale}" is not a valid locale`)
    _currentLocale.value = locale
  }
})

export function setLocale (locale: Locale) {
  if (!isLocale(locale)) throw new Error(`"${locale}" is not a valid locale`)
  _currentLocale.value = locale
}

export const i18n = createI18n({
  legacy: false,
  locale: _currentLocale.value,
  fallbackLocale: 'en',
  messages: {
    en
  }
})

async function loadLocaleMessages (i18n: I18n, locale: string) {
  const messages = await import(
    `./${locale}.json`
  )
  i18n.global.setLocaleMessage(locale, messages)
  await nextTick()
  i18n.global.locale.value = locale
}

watch(currentLocale, locale => {
  if (!i18n.global.availableLocales.includes(locale)) loadLocaleMessages(i18n, locale)
  else i18n.global.locale.value = locale
}, { immediate: true })
