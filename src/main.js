import { createApp, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import moment from 'moment'

import Alerts from './plugins/Alerts.js'
import Api from './plugins/Api.js'
import Slugify from './plugins/Slugify.js'

import Icon from './components/Icon'
import Btn from './components/Btn'
import User from './components/User'
import ProgressBar from './components/ProgressBar.vue'

import en from './locales/en'

const locale = document.documentElement.lang

moment.locale(locale)

async function loadLocaleMessages (i18n, locale) {
  console.log(locale)
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}/auth.json`
  )
  // console.log(messages)
  i18n.global.setLocaleMessage(locale, en)
  return nextTick()
}

const i18n = createI18n({
  locale,
  fallbackLocale: 'en',
  messages: {
    en
  }
})

if (locale !== 'en') loadLocaleMessages(i18n, locale)

createApp(App)
  .use(router)
  .use(i18n)
  .use(Alerts)
  .use(Api)
  .use(Slugify)
  .component('Icon', Icon)
  .component('Btn', Btn)
  .component('User', User)
  .component('ProgressBar', ProgressBar)
  .mount('#app')
