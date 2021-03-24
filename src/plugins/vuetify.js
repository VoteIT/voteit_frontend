import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/lib/styles/main.sass'
import 'vuetify/lib/styles/styles.sass'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/lib/components'
import * as directives from 'vuetify/lib/directives'
import colors from 'vuetify/lib/util/colors'

const light = {
  dark: false,
  variables: {},
  colors: {
    background: '#f8f4f2',
    'app-bar': '#563661',
    'menu-active': '#9C8afa',
    surface: '#ffffff',
    divider: '#dfcfc8',
    primary: colors.indigo.base,
    secondary: colors.grey.lighten1,
    accent: colors.indigo.darken4,
    error: colors.deepOrange.base,
    info: colors.lightBlue.base,
    success: colors.green.lighten1,
    warning: colors.red.darken2
  }
}

/* Some day
const dark = {
  dark: true,
  variables: {},
  colors: {
    background: '#111',
    surface: '#1e1e1e',
    primary: colors.indigo.darken2,
    secondary: colors.blueGrey.darken2,
    accent: colors.indigo.base,
    error: colors.deepOrange.darken2,
    info: colors.lightBlue.darken2,
    success: colors.green.darken2,
    warning: colors.red.darken4
  }
}
*/

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light
      // dark
    }
  }
})
