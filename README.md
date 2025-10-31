This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Backend split (migration notice)

The Node/Express backend that previously lived in `backend/` has been extracted into its own repository for production deployment and scaling.

- Frontend (this repo): Next.js app deployed to Vercel
- Backend (separate repo): Express + WebSockets + MySQL, deploy to Railway/Fly/Render/etc.

What you need to run locally now:

1. Start the backend from its new repository (set DB/JWT/CORS envs as before)
2. Set the frontend env to point to your backend:

	- `NEXT_PUBLIC_API_URL` = `https://your-backend-domain`
	- `NEXT_PUBLIC_WS_URL` = `wss://your-backend-domain/ws` (or rely on the rewrite below)
	- Optionally, `NEXT_PUBLIC_IMAGES_DOMAIN` for Next/Image remote optimization

This repo’s `next.config.ts` supports an optional rewrite so you can call the backend with relative `/api/*` in the browser. Set `NEXT_PUBLIC_API_URL` and the app will proxy `/api/*` to your backend.

Uploads are no longer expected to write to local disk in production. Configure S3/R2 in the backend and store public URLs in the database.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
