const hostname = import.meta.env.VITE_BACKEND_PORT
  ? `${location.hostname}:${import.meta.env.VITE_BACKEND_PORT}`
  : location.host

export default hostname
