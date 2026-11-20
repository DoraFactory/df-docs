<div align="center">
  <a href="https://df-docs.vercel.app/"><img src="assets/readme-hero.png" alt="DF Docs"></a>
  <p><strong>Dora Factory Documentation</strong><br/><a href="https://dorafactory.org/">Home</a> · <a href="https://twitter.com/DoraFactory">Twitter</a> · <a href="https://discord.com/invite/gKT5DsWwQ5">Discord</a></p>
</div>

## Links

- Vercel project: <https://vercel.com/dora-factory/df-docs>
- Stable (`main`)：<https://docs.dorafactory.org>
- Canary Preview (`develop`)：<https://df-docs-preview.vercel.app>

## Conventions

- Versioning: [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
- Git workflow: [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- Commit message format: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Changelog format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## Development

The documentation site is powered by [Nextra](https://github.com/shuding/nextra). This repo uses [PNPM](https://pnpm.io/) as the package manager.

### Installation

```bash
pnpm install
```

### Running the development server

```bash
pnpm dev
```

### Building for production

```bash
pnpm build
```

### Sharing previews (Open Graph)

`pnpm dev` and `pnpm build` automatically discover every Markdown/MDX document under `pages/`, including pages hidden from navigation. They generate a metadata index in `.generated/seo.json` and static sharing images in `public/og/`. These outputs are generated locally, ignored by Git, and included in the normal production build. Use these scripts instead of invoking `next dev` or `next build` directly. Docker's existing `yarn build` also runs the same pipeline.

The shared SEO model and tooling are written in TypeScript, with JSX image templates in `scripts/og/render.tsx`. `tsx` executes the Node tools; `tsc` checks their types separately. `pnpm typecheck` checks both the application and the strict tooling configuration in `tsconfig.og.json` (including unchecked array/map access). Production builds run the strict tooling check before generation, followed by Next.js's application check. The shared library, scripts, and tests have local ESM package scopes so the repository's existing CommonJS configuration files can retain their current format. The TypeScript runner is pinned to a version tested on Node 18, matching the Docker build environment.

New documents normally need only an H1 and an introductory paragraph. Sharing titles use `ogTitle`, then `title`, then the H1, then the navigation title. Descriptions use `description`, then the legacy `desc`, then the first substantive prose paragraph. Markdown formatting is removed; code, tables, images, imports, expressions, and callout notices are excluded from automatic summaries. Pure component pages must provide explicit metadata. The home page has its own brand copy; ordinary documents never silently fall back to it.

Optional overrides:

```yaml
---
title: Run a Full Node
description: Set up a Dora Vota full node and synchronize it with mainnet.
ogTitle: Run a Dora Vota Full Node
locale: en_US
# Optional local PNG, JPEG or WebP under public/. It is fingerprinted too.
ogImage: /images/my-sharing-cover.png
ogImageAlt: Dora Vota node setup
---
```

The page title, canonical URL, OG tags, Twitter Card, and documentation quickstart cards use the same metadata. Titles and summaries are fitted to the image with measured font widths and word-aware truncation. Public Sans and local Noto Sans SC subsets provide offline Latin/Chinese rendering; unsupported glyphs produce an actionable generation error rather than an invisible card. Add a bundled fallback font or provide an override if a new writing system is needed.

Generated image URLs include a fingerprint of their metadata, template, and font/background assets. Updating a title, introductory summary, or template changes the image URL. Changes deeper in the document do not rewrite an unchanged summary; explicit descriptions are maintained by the author. Dev mode watches document, navigation, and asset changes and regenerates the index and affected cards. Old generated files remain available during that dev session.

The document watcher uses polling so it also works on mounted filesystems. If Next.js reports native watcher limits such as `EMFILE` in a restricted development environment, run `WATCHPACK_POLLING=true pnpm dev` to enable polling for Next.js as well.

`NEXT_PUBLIC_SITE_ROOT` controls the site origin and defaults to `https://docs.dorafactory.org`; development uses `http://localhost:3000`. Set it to the intended origin for a preview deployment. Images use the same origin, so no separate OG service deployment is needed. The original `/api/og?title=...&desc=...` endpoint remains available for older links.

```bash
pnpm og:generate # Regenerate metadata and sharing images
pnpm test:og     # Content extraction, compatibility, fonts, wrapping and updates
pnpm typecheck   # Application types and strict OG/tooling types
pnpm og:check    # Verify HTML and images from an existing production build
```

Every production build checks all generated document HTML for exactly one set of sharing tags, matching descriptions/canonical URLs, and valid image dimensions. Missing titles/summaries, invalid custom covers, duplicate document routes, or unsupported dynamic document routes fail with a source-specific message. Dynamic routes need a route-enumeration adapter before they can be added. Generation dependencies must be installed in the build stage; the standalone runtime only needs the resulting public images.

After deployment, validate representative links in the target chat/social app. A new image URL prevents reuse of an old image when the page is fetched again, but the site cannot force a platform to refresh a cached page preview or replace previews in historical messages.

### Lint & Prettier

This repo uses [ESLint](https://eslint.org/) to handle JavaScript and TypeScript code quality, and uses [Prettier](https://prettier.io/) to format [most of](.prettierignore) the code style.

```bash
# ESLint
pnpm lint
```

```bash
# Check code style by Prettier
pnpm prettier
```

```bash
# Format & overwrite code style by Prettier
pnpm prettier:write
```

## Deployments

### Dependencies

Sharing previews use static images generated during the build and do not require an Edge Function. The legacy Open Graph image API [`/api/og`](pages/api/og.tsx), retained for older consumers, uses [`@vercel/og`](https://vercel.com/docs/functions/edge-functions/og-image-generation) and may depend on [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions).

### Stable

The [Stable](https://docs.dorafactory.org) version of the documentation corresponds to the [`main`](https://github.com/DoraFactory/df-docs/tree/main) branch.

### Canary Preview

The [Canary Preview](https://df-docs.vercel.app) version corresponds to the [`develop`](https://github.com/DoraFactory/df-docs/tree/develop) branch, which is deployed via [Vercel](https://vercel.com/).
