export enum SpeakerListState {
  Open = 'open',
  Closed = 'closed',
}

export default [
  {
    transition: 'open',
    icon: 'mdi-check',
    state: SpeakerListState.Open
  },
  {
    transition: 'close',
    icon: 'mdi-close',
    state: SpeakerListState.Closed
  }
]
