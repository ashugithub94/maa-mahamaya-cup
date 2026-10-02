# MAA MAHAMAYA CUP – KUMHARI, SEASON 01

Mobile-first player registration for the MAA MAHAMAYA CUP. The public site uses Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, React Hook Form, Zod, and Supabase. Uploads and admin reads stay behind server-side route handlers.

## 1. Run locally

Requirements: Node.js 18.17+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public pages render without the image assets while you are wiring the project, but registrations require the Supabase variables and schema below.

## 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the complete contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. In **Project Settings → API**, copy the Project URL, the publishable/`anon` key, and the server-only Secret key. The app also accepts the older `service_role` key as a fallback.
4. Put them in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
ADMIN_USER_ID=admin
ADMIN_PASSWORD=use-a-long-private-password
```

`SUPABASE_SECRET_KEY`, `ADMIN_USER_ID`, and `ADMIN_PASSWORD` are server-only. Never expose them with a `NEXT_PUBLIC_` prefix or commit `.env.local`.

## 3. Add tournament assets

Add these files to `public/`:

- `poster.jpg` — poster used in the hero and WhatsApp/Open Graph preview.
- `logo.png` — Maa Mahamaya logo.
- `payment-qr.jpg` — QR code for the UPI payment.

The expected payment details are already configured in `lib/constants.ts`:

```text
Payee: Rakesh Yadav
UPI: rakeshkhatra8055@okhdfcbank
Fee: ₹1,200
```

## 4. Test the registration flow

1. Open `/register` on a phone-sized browser viewport.
2. Complete the three steps with a real image and a small payment screenshot, or use placeholder files while testing.
3. Confirm that the response ends with a code such as `MMC-0001`.
4. Open `/admin`, sign in with `ADMIN_USER_ID` and `ADMIN_PASSWORD`, and verify the row, signed previews, CSV export, and approve/reject actions.

The public API rejects malformed data, invalid Indian mobile numbers, files above 2MB, missing consent, and duplicate mobile numbers. Images are compressed in the browser before upload; an optional profile image is cropped to a square first when provided.

## 5. Deploy free-tier

For a small tournament, use Vercel Hobby for the Next.js app and Supabase Free for Postgres and Storage. Both have usage limits; they are free within those limits, not unlimited services.

1. Push this folder to a Git provider such as GitHub.
2. Create a free Supabase project and run `supabase/schema.sql`.
3. Create a free Vercel account and choose **Add New → Project**.
4. Import the repository and keep the detected Next.js settings.
5. In **Settings → Environment Variables**, add the variables below for **Production**, **Preview**, and **Development**:

```text
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
ADMIN_USER_ID=choose-your-private-admin-id
ADMIN_PASSWORD=choose-a-long-private-password
```

6. Deploy. Open `/admin` on the deployed domain and use the exact `ADMIN_USER_ID` and `ADMIN_PASSWORD` values from Vercel.
7. Add your custom domain later if needed, then update `NEXT_PUBLIC_SITE_URL` and redeploy.

## 6. Deploy to Vercel

1. Add `poster.jpg`, `logo.png`, and `payment-qr.jpg` to the repository before the final production deploy.
2. Each time you change an environment variable in Vercel, redeploy so the new server configuration is used.

## Project map

```text
app/                 Pages, metadata, and server route handlers
components/          Public sections, wizard, cropper, and admin UI
lib/                 Tournament constants, validation, Supabase, auth helpers
supabase/schema.sql  Table, storage bucket, and RLS policies
public/              poster.jpg, logo.png, payment-qr.jpg go here
```

## Security notes

- Public registration submission goes through `/api/register`; the Supabase Secret key never reaches the browser.
- Registrations have RLS enabled with an insert-only public policy. There is no public read policy.
- The `receipts` bucket is private. Admin media previews are short-lived signed URLs.
- Admin login uses an HttpOnly signed cookie generated from `ADMIN_USER_ID` and `ADMIN_PASSWORD`, with a 12-hour expiry. The public can see the `/admin` login screen, but cannot read registrations or private media without a valid cookie. For a larger production operation, move admin authentication to Supabase Auth or another identity provider and add rate limiting/WAF rules at the edge.
