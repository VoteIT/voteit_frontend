export enum SpeakerListState {
  Open = 'open',
  Closed = 'closed',
}

export default [
  {
    transition: 'open',
    icon: 'check',
    state: SpeakerListState.Open
  },
  {
    transition: 'close',
    icon: 'close',
    state: SpeakerListState.Closed
  }
]
