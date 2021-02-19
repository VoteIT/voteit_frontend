import useChannels from '../../composables/useChannels.js'

export default {
  naturalKey: 'speaker.speakersystem',
  useChannels: config => useChannels('speaker_system', config)
}
