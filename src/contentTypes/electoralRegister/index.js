import useContentApi from '../useContentApi'

export default {
  naturalKey: 'poll.electoralregister',
  useContentApi: config => useContentApi('electoral-registers/', undefined, config)
}
