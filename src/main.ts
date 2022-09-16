import { createApp, nextTick } from 'vue'
import { createI18n, I18n } from 'vue-i18n'
import App from './App.vue'
// import './registerServiceWorker'
import router from './router'

import moment from 'moment'

import Api from './plugins/Api'
import vuetify from './plugins/vuetify'

import Menu from './components/Menu.vue'
import ProgressBar from './components/ProgressBar.vue'
import Tag from './components/Tag.vue'
import User from './components/User.vue'
import Dropdown from './components/Dropdown.vue'
import UserAvatar from './components/UserAvatar.vue'
import Widget from './components/Widget.vue'
import PresenceCheckControl from './modules/presence/PresenceCheckControl.vue'
import Proposal from './modules/proposals/Proposal.vue'

import en from './locales/en.json'
import sv from './locales/sv.json'

// const availableLanguages = ['en', 'sv'] // FIXME somewhere else
// function resolveLocale (languages: readonly string[]): string {
//   for (const lang of languages) {
//     const short = lang.split('-')[0]
//     if (availableLanguages.includes(short)) return short
//   }
//   return 'en'
// }
// const locale = resolveLocale(navigator.languages)
const locale = 'sv'

moment.locale(locale)

// PLUGINS
require('@/modules/printing')

/* LOCKED TO 'sv' */
// async function loadLocaleMessages (i18n: I18n, locale: string) {
//   const messages = await import(
//     /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
//   )
//   i18n.global.setLocaleMessage(locale, messages)
//   return nextTick()
// }

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    en,
    sv
  }
})

/* LOCKED TO 'sv' */
// if (locale !== 'sv') loadLocaleMessages(i18n, locale)

createApp(App)
  .use(i18n)
  .use(router)
  .use(vuetify)
  .use(Api)
  .component('DropdownMenu', Menu)
  .component('ProgressBar', ProgressBar)
  .component('Tag', Tag)
  .component('User', User)
  .component('Dropdown', Dropdown)
  .component('UserAvatar', UserAvatar)
  .component('Widget', Widget)
  // Bubble requires this to be registered here, dunno why
  .component('PresenceCheckControl', PresenceCheckControl)
  .component('Proposal', Proposal)
  .mount('#app')
