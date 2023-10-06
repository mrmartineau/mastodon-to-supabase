export interface Toot {
  id: string
  created_at: Date
  in_reply_to_id: null
  in_reply_to_account_id: null
  sensitive: boolean
  spoiler_text: string
  visibility: string
  language: string
  uri: string
  url: string
  replies_count: number
  reblogs_count: number
  favourites_count: number
  edited_at: Date
  favourited: boolean
  reblogged: boolean
  muted: boolean
  bookmarked: boolean
  content: string
  filtered: any[]
  reblog: null
  account: Account
  media_attachments: MediaAttachment[]
  mentions: any[]
  tags: Tag[]
  emojis: any[]
  card: Card
  poll: null
}

export interface Account {
  id: string
  username: string
  acct: string
  display_name: string
  locked: boolean
  bot: boolean
  discoverable: boolean
  group: boolean
  created_at: Date
  note: string
  url: string
  avatar: string
  avatar_static: string
  header: string
  header_static: string
  followers_count: number
  following_count: number
  statuses_count: number
  last_status_at: Date
  emojis: any[]
  fields: Field[]
}

export interface Field {
  name: string
  value: string
  verified_at: null
}

export interface Card {
  url: string
  title: string
  description: string
  type: string
  author_name: string
  author_url: string
  provider_name: string
  provider_url: string
  html: string
  width: number
  height: number
  image: string
  embed_url: string
  blurhash: string
}

export interface MediaAttachment {
  id: string
  type: string
  url: string
  preview_url: string
  remote_url: string
  preview_remote_url: null
  text_url: null
  meta: Meta
  description: string
  blurhash: string
}

export interface Meta {
  original: Original
  small: Original
}

export interface Original {
  width: number
  height: number
  size: string
  aspect: number
}

export interface Tag {
  name: string
  url: string
}
