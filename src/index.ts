import { createClient } from '@supabase/supabase-js'
import * as linkify from 'linkifyjs'
import { type Toot } from './toot.types'
import html2md from 'html-to-md'
import urlJoin from 'proper-url-join'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  MASTODON_APP_API_TOKEN: string
  MASTODON_INSTANCE: string
  MASTODON_ID: string
}

const createTootEntryFactory = (toot: Toot, isLiked: boolean, env: Env) => {
  const content = toot.content
  return {
    liked_toot: isLiked,
    text: html2md(content),
    urls: linkify.find(content) ?? [],
    toot_id: toot.id,
    user_id: toot.account.acct.includes('@')
      ? toot.account.acct
      : `${toot.account.acct}@${env.MASTODON_INSTANCE}`,
    user_name: toot.account.display_name,
    user_avatar: toot.account.avatar,
    toot_url: toot.url,
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
    await upsertToots(env, myToots)
    const faves = await getFaves(env)
    await upsertToots(env, faves)
    return new Response('Success!', { status: 200 })
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`🚀 ~ scheduled run`, event.scheduledTime)
    const myToots = await getMyToots(env)
    await upsertToots(env, myToots)
    const faves = await getFaves(env)
    ctx.waitUntil(upsertToots(env, faves))
  },
}

const getFaves = async (env: Env) => {
  const favesResponse = await fetch(
    urlJoin(`https://${env.MASTODON_INSTANCE}`, '/api/v1/favourites', {
      leadingSlash: 'keep',
    }),
    {
      headers: {
        Authorization: `Bearer ${env.MASTODON_APP_API_TOKEN}`,
      },
    }
  )

  const faves = await favesResponse.json<any[]>()

  if (!faves?.length) {
    throw new Error('No faves')
  }

  const transformedFaves = faves.map((toot: Toot) => {
    return createTootEntryFactory(toot, true, env)
  })

  return transformedFaves
}

const upsertToots = async (
  env: Env,
  toots: ReturnType<typeof createTootEntryFactory>[]
) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  const { error } = await supabase
    .from('toots')
    .upsert(toots, { onConflict: 'toot_id' })

  if (error) {
    throw error
  }

  console.log('Upsert successful')
}

const getMyToots = async (env: Env) => {
  const myTootsResponse = await fetch(
    urlJoin(
      `https://${env.MASTODON_INSTANCE}`,
      '/api/v1/accounts',
      env.MASTODON_ID,
      'statuses',
      { leadingSlash: 'keep' }
    ),
    {
      headers: {
        Authorization: `Bearer ${env.MASTODON_APP_API_TOKEN}`,
      },
    }
  )

  const myToots = await myTootsResponse.json<any[]>()

  if (!myToots?.length) {
    throw new Error('No Toots')
  }

  const transformedToots = myToots
    .filter((toot) => {
      return toot.content.length !== 0
    })
    .map((toot: Toot) => {
      return createTootEntryFactory(toot, false, env)
    })

  return transformedToots || []
}
