import ContentType from '@/contentTypes/ContentType'

export const meetingDataType = new ContentType({
  name: 'meetingData',
  restEndpoint: 'meeting-data/',
  restConfig: { alertOnError: false }
})
