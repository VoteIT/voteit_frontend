import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/lib/styles/main.sass'
import 'vuetify/lib/styles/styles.sass'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/lib/components'
import * as directives from 'vuetify/lib/directives'
import colors from 'vuetify/lib/util/colors'

const light = {
  dark: false,
  variables: {
    'border-color': '223,207,200',
    'border-opacity': 1
  },
  colors: {
    background: '#f8f4f2',
    'app-bar': '#563661',
    'app-bar-divider': '#765681',
    'app-bar-active': '#7976B7',
    'menu-active': '#9C8afa',
    surface: '#ffffff',
    'surface-active': colors.green.lighten5,
    primary: '#3729d8',
    secondary: colors.grey.darken1,
    'secondary-lighten-2': colors.grey.lighten2,
    accent: colors.indigo.darken4,
    error: colors.deepOrange.base,
    info: colors.lightBlue.base,
    'info-lighten-2': colors.lightBlue.lighten2,
    success: '#6ce498',
    'success-lighten-2': '#cbf6db',
    'success-darken-2': '#1da475',
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
