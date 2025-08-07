interface AllTagsPayload {
  meeting: number
  tags: { [k: string]: number[] }
}

interface TagChangedPayload {
  meeting: number
  tags: { [k: string]: string | string[] }
  user: number
}
