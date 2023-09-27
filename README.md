<div align="center">
  <a href="https://df-docs.vercel.app/"><img src="assets/readme-hero.png" alt="DF Docs"></a>
  <p><strong>Dora Factory Documentation</strong><br/><a href="https://dorafactory.org/">Home</a> · <a href="https://twitter.com/DoraFactory">Twitter</a> · <a href="https://discord.com/invite/gKT5DsWwQ5">Discord</a></p>
</div>

## Links

- Stable (`main`)：<https://docs.dorafactory.org>
- Canary Preview (`develop`)：<https://df-docs.vercel.app>

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

### Lint & Prettier

This repo uses [ESLint](https://eslint.org/) to handle JavaScript and TypeScript code quality, and uses [Prettier](https://prettier.io/) to format [most of](.prettierignore) the code style.

```bash
# ESLint
pnpm lint
```

```bash
# Check code style by Prettier
pnpm prettier:check
```

```bash
# Format & overwrite code style by Prettier
pnpm prettier
```

## Deployment

### Dependencies

The Open Graph image generation API [`/api/og`](pages/api/og.tsx), which uses [`@vercel/og`](https://vercel.com/docs/functions/edge-functions/og-image-generation) library, is dependent on [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions).

### Stable

The [Stable](https://docs.dorafactory.org) version of the documentation corresponds to the [`main`](https://github.com/DoraFactory/df-docs/tree/main) branch.

### Canary Preview

The [Canary Preview](https://df-docs.vercel.app) version corresponds to the [`develop`](https://github.com/DoraFactory/df-docs/tree/develop) branch, which is deployed via [Vercel](https://vercel.com/).
