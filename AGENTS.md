# Working on UserBubble

Read `DESIGN.md` before changing visual components. Read `docs/architecture.md` before adding a product operation or transport.

Product operations live in `packages/api/src/application`. Transport adapters validate requests and run application Effects through the shared runtime. Keep authorization in the application boundary and verify the resource belongs to the selected organization.

External agents act on behalf of a real user and are limited by current membership and capability grants. SDK/embed credentials identify customers and never authorize management operations.

Retain published SDK contracts. Preserve customer content and historical migrations when retiring functionality. The product does not execute models or repository agents.

For verification, use package scripts in the root manifest. A failing check remains unfinished work; record the exact blocker and avoid reporting unrun checks as passing.
