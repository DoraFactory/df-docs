# CHANGELOG

## [0.2.0][0.2.0] · 2023-11-19

### Added

- Feat: Add the “Governance” chapter into Vota Dev Guide.
- Feat: Add the `IconVote` SVG icon.

### Changed

- Feat: Update index of Vota Dev Guide.

## [0.1.1][0.1.1] · 2023-11-15

### Changed

- Docs: Update Prettier-related scripts for README.
- Docs: Minor polish for README.

## [0.1.0][0.1.0] · 2023-11-14

### Added

- Feat: Update Vota Op Guide.
  - Add mainnet faucet.
- Feat: Update Vota Dev Guide.
  - Add mainnet faucet.

### Changed

- Feat: Streamline the “Public Resources” chapter of Vota Dev Guide.
- Style: Format some SVG files (`components/**/*.svg`) with Prettier.
- Chore: Update Prettier config for SVGs.
- Chore: Update Prettier-related pnpm scripts.
- Build: Update devDeps to latest versions.
  - `@types/node`: 20.9.0
  - `@types/react`: 18.2.37
  - `eslint`: 8.53.0
  - `prettier`: 3.1.0
  - `prettier-plugin-tailwindcss`: 0.5.7

### Fixed

- Fix: Editorial fix of punctuations for Vota Dev Guide.

## [0.1.0-beta.4][0.1.0-beta.4] · 2023-10-29

### Added

- Feat: Update Vota Dev Guide.
  - Add testnet commands.
  - Add testnet resources.
  - Add gRPC endpoints and faucets.

### Changed

- Feat: Remove DORA token buying guide in Vota Operator Manual.
- Feat: Remove Dora-KSM Parachain from footer.
- Feat: Extend clickable area for Dora Factory official site link in footer.
- Build: Update deps to latest versions.
  - `@vercel/og`: 0.5.20
  - `next`: 13.5.6
- Build: Update devDeps to latest versions.
  - `@types/node`: 20.8.9
  - `@types/react`: 18.2.33
  - `eslint`: 8.52.0
  - `eslint-config-next`: 13.5.6
  - `sass`: 1.69.5
  - `tailwindcss`: 3.3.5

### Fixed

- Fix: Fix a typo in Vota DevOps Guide.
- Fix: Fix punctuations for Vota Dev Guide.

## [0.1.0-beta.3][0.1.0-beta.3] · 2023-10-14

### Added

- Feat: Dora Vota DevOps Guide.

### Changed

- Feat: Refine title gradient color for auto-generated OG images.
- Feat: Update Get Started page.
- Docs: Update contact email for Code of Conduct.
- Build: Update deps to latest versions.
  - `nextra`: 2.13.2
  - `nextra-theme-docs`: 2.13.2
- Build: Update devDeps to latest versions.
  - `@types/node`: 20.8.6
  - `@types/react`: 18.2.28
  - `eslint`: 8.51.0
  - `sass`: 1.69.3
  - `prettier-plugin-tailwindcss`: 0.5.6

### Fixed

- Fix: Fix a typo in Vota Operator Manual.
- Fix: Fix a link in Vota Developer Guide.

## [0.1.0-beta.2][0.1.0-beta.2] · 2023-10-04

### Changed

- Refactor: Prefix `SITE_ROOT` with `NEXT_PUBLIC_` to streamline environment variable configuration.
  - Reference: https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
- Perf: Optimize CLS for Nextra Card images.
  - Reference: https://web.dev/optimize-cls/
- Docs: Streamline and reword for README.
- Build: Update deps to latest versions.
  - `next`: 13.5.4
  - `nextra`: 2.13.1
  - `nextra-theme-docs`: 2.13.1
- Build: Update devDeps to latest versions.
  - `@types/node`: 20.8.2
  - `@types/react`: 18.2.24
  - `eslint-config-next`: 13.5.4
  - `postcss`: 8.4.31
  - `prettier-plugin-tailwindcss`: 0.5.5

### Fixed

- Fix: Change preparation of DORA token amount from `20` into `5` in Vota Operator Manual.
- Fix: Fix `--gas-prices` and `--gas-adjustment` values for commands in Vota Dev Guide.

## [0.1.0-beta.1][0.1.0-beta.1] · 2023-09-24

### Added

- Feat: Gradient tint for auto-generated OG image title.

### Changed

- Feat: Remove/replace Testnet related information in Vota Dev Guide.
- Feat: Remove (hide) Aptos API docs.
- Feat: Update list of Products in nav.
- Feat: Update footer.
  - Remove legal files.
  - Update link list.
- Build: Update deps to latest versions.
- Build: Update devDeps to latest versions.

### Fixed

- Fix: Change Node.js version from `18+` into `18.x` in Vota Operator Manual.
- Fix: Attach `alt` attribution onto the image in Deploy MACI button for better a11y.

## [0.1.0-beta][0.1.0-beta] · 2023-09-21

### Added

- Feat: Add Vota Operator Manual.
  - https://docs.dorafactory.org/docs/vota
- Feat: Add Vota Developer Guide.
  - https://docs.dorafactory.org/docs/vota-dev
- Feat: Update Get Started page.
  - https://docs.dorafactory.org/docs
- CI: Add GitHub Actions workflow for production deployment.
- Docs: Add the hero image into README.

### Changed

- Feat: Replace `<Tabs>` with `<Tab.Tabs>` to align to Nextra latest feature.
- Build: Update deps to latest versions.
- Build: Update devDeps to latest versions.
- Build: Change `.env.production` into `.env`, and update `SITE_ROOT` in `.env`.
- Docs: Update contact email for Code of Conduct.

### Fixed

- Fix: Theme config `docsRepositoryBase` URL.
- Fix: SVGR config for Next.js.
  - Reference: https://react-svgr.com/docs/next/#usage

## [0.1.0-alpha][0.1.0-alpha] · 2023-09-09

### Added

- Feat: Scaffold and structure of documentation.
- Feat: Customized landing page to shape DF Docs visual identity.
- Feat: Customized nav with Dora Factory branding.
- Feat: Customized footer.
- Feat: Customized TOC based on Nextra Docs theme.
- Feat: Adaptive favicon and Apple touch icon.
- Feat: Dynamic page title, description, and Open Graph metadata.
- Feat: Auto-generated OG images for each page, based on `@vercel/og` with Vercel Edge Functions.
- Docs: [Read Me](README.md).
- Docs: [Changelog](CHANGELOG.md).
- Docs: [MIT License](LICENSE).
- Docs: [Code of Conduct](CODE_OF_CONDUCT.md), based on [Contributor Covenant](https://www.contributor-covenant.org) v2.1.
- Chore: Configure GitHub [Dependabot](.github/dependabot.yml).

[0.2.0]: https://github.com/DoraFactory/df-docs/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/DoraFactory/df-docs/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/DoraFactory/df-docs/compare/0.1.0-beta.4...0.1.0
[0.1.0-beta.4]: https://github.com/DoraFactory/df-docs/compare/0.1.0-beta.3...0.1.0-beta.4
[0.1.0-beta.3]: https://github.com/DoraFactory/df-docs/compare/0.1.0-beta.2...0.1.0-beta.3
[0.1.0-beta.2]: https://github.com/DoraFactory/df-docs/compare/0.1.0-beta.1...0.1.0-beta.2
[0.1.0-beta.1]: https://github.com/DoraFactory/df-docs/compare/0.1.0-beta...0.1.0-beta.1
[0.1.0-beta]: https://github.com/DoraFactory/df-docs/compare/0.1.0-alpha...0.1.0-beta
[0.1.0-alpha]: https://github.com/DoraFactory/df-docs/compare/eacf593...0.1.0-alpha
