# UserBubble

Free and open-source feedback collection platform for any app. Collect feature requests, bug reports, and user votes directly from your web, mobile, and desktop apps.

## Features

- **Universal SDKs** — React, Next.js, React Native (Expo + bare), with Swift and Kotlin coming soon
- **Feedback board** — Upvoting, categories, statuses, and public/private posts
- **Roadmap** — Drag-and-drop Kanban board to communicate what's planned, in progress, and done
- **Changelog** — Publish updates and link them to resolved feedback
- **Multi-tenant** — Organizations with role-based access (owner, admin, member)
- **Anonymous support** — Configurable anonymous submissions, voting, and commenting
- **Self-hostable** — Deploy on your own infrastructure or use the hosted version

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm |
| Web app | Next.js (App Router) |
| Mobile | React Native / Expo |
| API | tRPC |
| Auth | Better Auth |
| Database | PostgreSQL + Drizzle ORM |
| UI | Tailwind CSS + custom component library |
| Linting | Biome (via Ultracite) |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/swarajbachu/userbubble.git
cd userbubble

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL, auth secrets, etc.

# Run database migrations
pnpm db:migrate

# Start development
pnpm dev
```

## Project Structure

```
apps/
  application/   # Main Next.js web app (dashboard)
  landing/       # Marketing / landing page
  expo/          # React Native mobile app
  docs/          # Documentation site
packages/
  api/           # tRPC router definitions
  auth/          # Better Auth configuration
  db/            # Drizzle schema, queries, and permissions
  sdk/           # Client SDKs for app integration
  ui/            # Shared UI component library
  validators/    # Shared Zod validators
```

## Contributing

Contributions are welcome! Please open an issue or pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and run `pnpm format` to lint
4. Commit and push
5. Open a pull request

## License

MIT — see [LICENSE](./LICENSE) for details.
