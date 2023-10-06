import { createClient } from '@supabase/supabase-js'
import * as linkify from 'linkifyjs'
import { type Toot } from './toot.types'
import html2md from 'html-to-md'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  TOOT_API_TOKEN: string
  TOOT_API_FAVE_ENDPOINT: string
}

const createTootEntryFactory = (toot: Toot) => {
  const content = toot.content
  return {
    liked_toot: true,
    text: html2md(content),
    urls: linkify.find(content) ?? [],
    toot_id: toot.id,
    user_id: toot.account.acct,
    user_name: toot.account.display_name,
    user_avatar: toot.account.avatar,
    toot_url: toot?.url,
    media: toot.media_attachments,
    hashtags: toot.tags.map((item) => {
      return item.name
    }),
    reply: null,
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const faves = await getFaves(env)
    return new Response(JSON.stringify(faves), { status: 200 })
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const faves = await getFaves(env)
    ctx.waitUntil(upsertFaves(env, faves))
  },
}

const getFaves = async (env: Env) => {
  const favesResponse = await fetch(env.TOOT_API_FAVE_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${env.TOOT_API_TOKEN}`,
    },
  })

  const faves = await favesResponse.json<any[]>()

  if (!faves?.length) {
    throw new Error('No faves')
  }

  const transformedFaves = faves.map((toot: Toot) => {
    return createTootEntryFactory(toot)
  })

  return transformedFaves
}

const upsertFaves = async (
  env: Env,
  faves: ReturnType<typeof createTootEntryFactory>[]
) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  const { data, error } = await supabase
    .from('toots')
    .upsert(faves, { onConflict: 'toot_id' })

  if (error) {
    throw error
  }
}
