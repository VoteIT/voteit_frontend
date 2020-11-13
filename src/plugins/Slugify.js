export default {
  install (app) {
    app.config.globalProperties.$slugify = text => text.toLowerCase().replaceAll(/\s+/g, '-')
  }
}
