export default {
  install (app) {
    app.config.globalProperties.$slugify = text => typeof text === 'string' && text.toLowerCase().replaceAll(/\s+/g, '-')
  }
}
