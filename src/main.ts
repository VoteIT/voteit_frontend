import { createApp } from 'vue'
import App from './App.vue'
// import './registerServiceWorker'
import router from './router'

import pinia from './plugins/pinia'
import vuetify from './plugins/vuetify'
import { i18n } from './utils/locales'

// REGISTER PLUGINS
import './modules/auth'
import './modules/meetings'
import './modules/meetings/dialects'
import './modules/active'
import './modules/agendas'
import './modules/discussions'
import './modules/plenary'
import './modules/polls'
import './modules/polls/methods'
import './modules/proposals'
import './modules/reactions'
import './modules/printing'
import './modules/speakerLists'
import './modules/speakerLists/genderTags'
import './modules/rooms'

createApp(App).use(i18n).use(pinia).use(router).use(vuetify).mount('#app')
