# Cloudflare worker to backup your Mastodon toots and favourites to Supabase

This is a Cloudflare worker that will backup your Mastodon toots and favourites to a Supabase database. It is designed to be run on a schedule, and will only save new items since the last time it was run (using Supabase's `upsert` functionality).

## Setup

### Supabase

You will need to create a Supabase project and add a table called `toots` using the following command:

```sql
create table
  public.toots (
    id uuid not null default uuid_generate_v4 (),
    created_at timestamp with time zone null default now(),
    text text null default ''::text,
    urls json null,
    toot_id text null,
    user_id text null,
    user_name text null,
    user_avatar text null,
    toot_url text null,
    media json null,
    reply json null,
    hashtags text[] null,
    liked_toot boolean not null default false,
    constraint toots_pkey primary key (id),
    constraint toots_toot_id_key unique (toot_id)
  ) tablespace pg_default;
```

### Cloudflare

This worker is setup to be scheduled via a CRON job. It is up to you how often it is run, but I have it set to run every 2 hours.

#### Environment Variables

You will need to set the following environment variables in your Cloudflare worker:

```sh
MASTODON_INSTANCE=your-instance.com # e.g. mastodon.social or toot.cafe
MASTODON_ID=your-mastodon-user-id # not username, it is a number
MASTODON_APP_API_TOKEN=your-mastodon-app-api-token
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-service-key
```

For local development, add them to a `.dev.vars` file in the root of the project

### Mastodon

Create a new application in your Mastodon instance. Go to `/settings/applications` in your instance. It will need `read` access to your toots.

---

## License

[MIT](https://choosealicense.com/licenses/mit/) © [Zander Martineau](https://zander.wtf)

> Made by Zander • [zander.wtf](https://zander.wtf) • [GitHub](https://github.com/mrmartineau/) • [Mastodon](https://main.elk.zone/toot.cafe/@zander)
