import ContentType from '@/contentTypes/ContentType'
import { BugReport } from './types'

export const bugReportType = new ContentType<BugReport>({
  name: 'bug_report',
  restEndpoint: 'bug-reports/',
  restConfig: { alertOnError: false }
})
