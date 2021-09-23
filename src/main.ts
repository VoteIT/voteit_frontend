import { createApp, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import moment from 'moment'

import Api from './plugins/Api'
import vuetify from './plugins/vuetify'

import Btn from './components/Btn.vue'
import Menu from './components/Menu.vue'
import ProgressBar from './components/ProgressBar.vue'
import Switch from './components/inputs/Switch.vue'
import Tag from './components/Tag.vue'
import User from './components/User.vue'
import Dropdown from './components/Dropdown.vue'
import UserAvatar from './components/UserAvatar.vue'
import Widget from './components/Widget.vue'

import en from './locales/en.json'

const locale = document.documentElement.lang

moment.locale(locale)

async function loadLocaleMessages (i18n: any, locale: string) {
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )
  i18n.global.setLocaleMessage(locale, messages)
  return nextTick()
}

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    en
  }
})

if (locale !== 'en') loadLocaleMessages(i18n, locale)

createApp(App)
  .use(i18n)
  .use(router)
  .use(vuetify)
  .use(Api)
  .component('Btn', Btn)
  .component('Menu', Menu)
  .component('ProgressBar', ProgressBar)
  .component('Switch', Switch)
  .component('Tag', Tag)
  .component('User', User)
  .component('Dropdown', Dropdown)
  .component('UserAvatar', UserAvatar)
  .component('Widget', Widget)
  .mount('#app')
