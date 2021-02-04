import hostname from './hostname'
import Axios from 'axios'

export default Axios.create({
  baseURL: `${location.protocol}//${hostname}/api/`
})
