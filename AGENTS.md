# Development and deployment

- Preview at https://solid-convex.wonder1.de is a production build in preview mode, using `.env.preview` and the preview Convex backend. Refresh both with `bun run deploy:preview`, or the frontend only with `bun run preview:deploy`; inspect with `bun run preview:status` and `bun run preview:logs`.
- Run development separately via `project-registry dev up solid-convex`; it gets its own port and domain and uses `.env.development`.
- `bun run test:e2e:dev` targets the preview. Deploy production with `bun run deploy:production`.
