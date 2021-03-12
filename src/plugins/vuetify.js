import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/lib/styles/main.sass'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/lib/components'
import * as directives from 'vuetify/lib/directives'
import colors from 'vuetify/lib/util/colors'

const defaultTheme = {
  dark: false,
  variables: {},
  colors: {
    primary: colors.indigo.base,
    secondary: colors.grey.lighten1,
    accent: colors.indigo.darken4,
    warning: colors.red.darken2,
    success: colors.green.lighten1
  }
}

const darkTheme = {
  dark: true,
  variables: {},
  colors: {
    primary: colors.indigo.darken2,
    secondary: colors.blueGrey.darken2,
    accent: colors.indigo.base
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'defaultTheme',
    themes: {
      defaultTheme,
      darkTheme
    }
  }
})
