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
- **Agent access** — Shared product operations through the management API, CLI, and local or remote MCP, with scoped grants and revocation

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm |
| Web app | Next.js (App Router) |
| Mobile | React Native / Expo |
| API | Effect 4 services, tRPC, management API v2, CLI and MCP |
| Auth | Better Auth |
| Database | PostgreSQL + Drizzle ORM |
| UI | Tailwind CSS + coss/Base UI components |
| Linting | Biome (via Ultracite) |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/swarajbachu/userbubble.git
cd userbubble

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, auth secrets, etc.

# Run database migrations
pnpm exec dotenv -e .env -- pnpm db:migrate

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
  api/           # Effect contracts, application services and transport adapters
  cli/           # Workspace CLI and local MCP entry point
  client/        # Generated typed management client
  auth/          # Better Auth configuration
  db/            # Drizzle schema, queries, and permissions
  sdk/           # Client SDKs for app integration
  ui/            # Shared UI component library
  validators/    # Browser-safe shared validators
sdks/
  core/          # Shared SDK identification and types
  web/           # Web/React widget SDK
  react-native/  # Native SDK and optional storage adapters
```

## Architecture and verification

Start with [architecture](docs/architecture.md), [agent access](docs/agent-access.md), and the [CLI guide](packages/cli/README.md). See [upgrade and migration guidance](docs/upgrade.md), [icon installation](docs/icon-installation.md), [capability parity](docs/capability-parity.md), [verification evidence](docs/verification.md), [performance](docs/performance.md), and the [technical completion audit](docs/technical-completion-audit.md). UI guidance is in [DESIGN.md](DESIGN.md); release notes are in [CHANGELOG.md](CHANGELOG.md).

## Contributing

Contributions are welcome! Please open an issue or pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and run `pnpm lint` and `pnpm typecheck`; follow [verification instructions](docs/verification.md) for integration and browser checks
4. Commit and push
5. Open a pull request

## License

MIT — see [LICENSE](./LICENSE) for details.
