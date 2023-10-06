import { createClient } from '@supabase/supabase-js'
import * as linkify from 'linkifyjs'
import { type Toot } from './toot.types'
import html2md from 'html-to-md'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  TOOT_API_TOKEN: string
  TOOT_API_FAVE_ENDPOINT: string
  TOOT_API_STATUSES_ENDPOINT: string
}

const createTootEntryFactory = (toot: Toot, isLiked: boolean) => {
  console.log(`🚀 ~ createTootEntryFactory ~ toot:`, toot)
  const content = toot.content
  return {
    liked_toot: isLiked,
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
    created_at: new Date(toot.created_at),
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const myToots = await getMyToots(env)
    return new Response(JSON.stringify(myToots), { status: 200 })
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const myToots = await getMyToots(env)
    const faves = await getFaves(env)
    await upsertToots(env, myToots)
    // await upsertToots(env, faves)
    ctx.waitUntil(upsertToots(env, faves))
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
    return createTootEntryFactory(toot, true)
  })

  return transformedFaves
}

const upsertToots = async (
  env: Env,
  toots: ReturnType<typeof createTootEntryFactory>[]
) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  const { data, error } = await supabase
    .from('toots')
    .upsert(toots, { onConflict: 'toot_id' })

  if (error) {
    throw error
  }
}

const getMyToots = async (env: Env) => {
  const myTootsResponse = await fetch(env.TOOT_API_STATUSES_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${env.TOOT_API_TOKEN}`,
    },
  })

  const myToots = await myTootsResponse.json<any[]>()

  if (!myToots?.length) {
    throw new Error('No Toots')
  }

  const transformedToots = myToots
    .filter((toot) => {
      return toot.content.length !== 0
    })
    .map((toot: Toot) => {
      return createTootEntryFactory(toot, false)
    })

  return transformedToots || []
}
