const hostname = {
  production: location.host,
  development: 'localhost:8000'
}[process.env.NODE_ENV]

export default hostname
