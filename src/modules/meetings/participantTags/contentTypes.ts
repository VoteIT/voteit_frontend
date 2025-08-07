import ContentType from '@/contentTypes/ContentType'

export const participantTagsType = new ContentType({
  name: 'ptags',
  restEndpoint: 'ptags/' // User specific. Use pk for meeting for detail view: ptags/<meeting>/
})
