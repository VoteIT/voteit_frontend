import { all, imap, izip } from 'itertools'
import { ChannelsMessage } from './types'

export default class SocketDebug {
  private loggers: string[][]
  constructor () {
    this.loggers = []
  }

  public log (type: string) {
    this.loggers.push(type.split('.'))
  }

  private shouldLog (t: string) {
    const types = t.split('.')
    for (const logger of this.loggers) {
      if (all(
        imap(
          izip(logger, types),
          ([lt, st]) => lt === st
        )
      )) return true
    }
    return false
  }

  public debug ({ t, p }: ChannelsMessage) {
    if (this.shouldLog(t)) console.debug(`${t} message:`, p)
  }
}
