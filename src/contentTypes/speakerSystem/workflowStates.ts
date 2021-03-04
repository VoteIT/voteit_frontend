export enum SpeakerSystemState {
  Inactive = 'inactive',
  Active = 'active',
  Archived = 'archived'
}

export default [
  {
    transition: 'inactivate',
    icon: 'visibility_off',
    state: SpeakerSystemState.Inactive
  },
  {
    transition: 'activate',
    icon: 'visibility',
    state: SpeakerSystemState.Active
  },
  {
    transition: 'archive',
    icon: 'archive',
    state: SpeakerSystemState.Archived
  }
]
