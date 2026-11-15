# AgriLink

Direct-from-farms agricultural e-commerce platform connecting consumers, local producers, and administrators.

## Architecture & Technology Stack
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, React Router 7
- **Backend / BaaS**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Icons**: Iconify (`@iconify/react`)

## Repository Guidelines & Hygiene
- **Graphify Artifacts**: Local knowledge graph folders (`graphify/`, `graphify-out/`, `*.graphify*`) are strictly for local analysis and must **never** be committed or pushed to the GitHub repository. Refer to `AGENTS.md` for permanent agent guidelines.
- **Commits**: Follow Conventional Commits format (`feat:`, `fix:`, `refactor:`, `style:`, `test:`, `chore:`, `docs:`).
- **Verification**: Always verify tests with `npm test` and production build with `npm run build` prior to push.

