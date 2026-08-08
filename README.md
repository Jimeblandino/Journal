# Los Pensamientos de Jime

A private, password-locked journal with photos and Spotify tracks — now backed
by a real shared database, so anyone you send the link to (and give the
password) sees the exact same entries you do.

## Step 1 — Create your free database (Supabase)

1. Go to https://supabase.com and sign up for a free account.
2. Click **New Project**. Pick any name, set a database password (write it
   down somewhere safe — you won't need it for the app itself, just for
   Supabase), and choose the region closest to you. Wait ~2 minutes while it
   provisions.
3. Once it's ready, click **SQL Editor** in the left sidebar → **New query**,
   paste this in, and click **Run**:

   ```sql
   create table if not exists kv_store (
     key text primary key,
     value text not null,
     updated_at timestamptz default now()
   );

   alter table kv_store disable row level security;
   ```

4. Go to **Project Settings** (gear icon) → **API**. You'll see two values
   you need:
   - **Project URL**
   - **anon public** key (a long string)

## Step 2 — Add those values to the project

1. In this folder, make a copy of `.env.example` and rename it to `.env`.
2. Open `.env` and paste in your Project URL and anon key:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 3 — Try it locally (optional)

Needs [Node.js](https://nodejs.org) installed.

```bash
npm install
npm run dev
```

Open the link it prints. Log in with the password and add an entry — then
check your Supabase project's **Table Editor → kv_store** and you should see
a row appear. That means it's working.

## Step 4 — Deploy it so it has a real link

1. Create a free GitHub account (if needed) → new repository → upload this
   whole folder using **Add file → Upload files** in the browser.
   (Your `.env` file won't upload — that's intentional, see Step 3 below.)
2. Create a free Vercel account at https://vercel.com → **Add New → Project**
   → connect GitHub → select your repository.
3. Before clicking Deploy, open **Environment Variables** in the setup screen
   and add the same two values from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. In a minute or two you'll get a live link like
   `los-pensamientos-de-jime.vercel.app`.

That link is now the same for everyone. Anyone who opens it, enters
`16052024`, sees your real journal — and if you add an entry from your phone,
it'll appear when they refresh, too.

(Netlify works the same way — add the two env vars under **Site settings →
Environment variables** instead.)

## Important things to know

- **This is a single shared journal, not separate accounts.** Everyone who
  has the password sees and can edit the same entries. There's no way for
  two people to each have their own private section within this version.
- **The password is a soft gate, not real security.** The Supabase anon key
  is visible in the site's code to anyone who looks (this is normal for this
  kind of app), and the database table has no additional access rules turned
  on, so in principle someone technical who found that key could read or
  write entries directly, bypassing the password screen entirely. Don't put
  anything highly sensitive in here — treat the password as "keeps casual
  visitors out," not as encryption.
- **Free tier limits**: Supabase's free plan includes 500MB of database
  storage and pauses projects after a week of no activity (opening the app
  wakes it back up in a few seconds). Plenty for personal journaling.
- **Photos** are resized automatically before saving to keep things light.
- **Music**: paste a Spotify song, album, or playlist link for a real
  embedded player and an "Open in Spotify" button, or upload a short audio
  file (~4MB max) as a fallback.

## If you'd rather go back to private-only (no sharing)

Swap `src/storage.js` back to a `localStorage`-based version — I can give you
that file again any time.
