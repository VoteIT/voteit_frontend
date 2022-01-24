const hostname = process.env.VUE_APP_BACKEND_PORT
  ? `${location.hostname}:${process.env.VUE_APP_BACKEND_PORT}`
  : location.host

export default hostname
