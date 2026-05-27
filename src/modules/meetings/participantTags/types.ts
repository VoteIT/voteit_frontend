export interface AllTagsPayload {
  meeting: number
  tags: { [k: string]: number[] }
}

export interface TagChangedPayload {
  meeting: number
  tags: { [k: string]: string | string[] }
  user: number
}
