import { createApp } from 'vue'
import App from './App.vue'
// import './registerServiceWorker'
import router from './router'

import Api from './plugins/Api'
import vuetify from './plugins/vuetify'
import { i18n } from './locales'

import Menu from './components/Menu.vue'
import ProgressBar from './components/ProgressBar.vue'
import Tag from './components/Tag.vue'
import User from './components/User.vue'
import Dropdown from './components/Dropdown.vue'
import UserAvatar from './components/UserAvatar.vue'
import Widget from './components/Widget.vue'
import PresenceCheckControl from './modules/presence/PresenceCheckControl.vue'
import Proposal from './modules/proposals/Proposal.vue'

// REGISTER PLUGINS
import './modules/meetings'
import './modules/meetings/dialects'
import './modules/active'
import './modules/agendas'
import './modules/discussions'
import './modules/polls/methods'
import './modules/proposals'
import './modules/reactions'
import './modules/presence'
import './modules/printing'
import './modules/speakerLists'

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
  // Bubble requires this to be registered here, dunno why (circular?)
  .component('PresenceCheckControl', PresenceCheckControl)
  .component('Proposal', Proposal)
  .mount('#app')
