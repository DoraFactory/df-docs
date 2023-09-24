# CHANGELOG

## [0.1.0-beta.1][0.1.0-beta.1] · 2023-09-23

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

- Fix: Change Node.js version from `18+` into `18.x`.
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
- Doc: [Read Me](README.md).
- Doc: [Changelog](CHANGELOG.md).
- Doc: [MIT License](LICENSE).
- Doc: [Code of Conduct](CODE_OF_CONDUCT.md), based on [Contributor Covenant](https://www.contributor-covenant.org) v2.1.
- Chore: Configure GitHub [Dependabot](.github/dependabot.yml).

[0.1.0-beta.1]: https://github.com/DoraFactory/df-docs/compare/0.1.0-beta...0.1.0-beta.1
[0.1.0-beta]: https://github.com/DoraFactory/df-docs/compare/0.1.0-alpha...0.1.0-beta
[0.1.0-alpha]: https://github.com/DoraFactory/df-docs/compare/eacf593...0.1.0-alpha
