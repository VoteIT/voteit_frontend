const hostname = process.env.NODE_ENV === 'development' ? 'localhost:8000' : location.host

export default hostname
