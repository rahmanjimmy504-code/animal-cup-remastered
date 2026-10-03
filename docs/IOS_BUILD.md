# iOS / IPA build

Animal Cup Remastered now has a Capacitor iOS wrapper and GitHub Actions IPA pipeline.

## What it builds

- Bundle ID: `com.jimmyrahman.animalcup`
- iPhone and iPad support
- Portrait and landscape orientations
- Safe-area / notch handling through Capacitor
- Native app icon generated from `resources/icon.svg`
- Fullscreen web shell loading the production Cloudflare deployment
- GitHub Release upload with SHA-256 checksum

The production URL is configured in `capacitor.config.ts`:

`https://animal-cup.rahmanjimmy504.workers.dev/`

## GitHub Actions

The workflow is:

`.github/workflows/ios-release.yml`

It runs manually from **Actions → Build Animal Cup Remastered iOS IPA**, or automatically when a main-branch commit contains:

`[build-ios-release]`

### Signed IPA

For a normally installable signed IPA, configure these repository Actions secrets:

- `IOS_CERTIFICATE_BASE64` — base64-encoded Apple signing certificate (.p12)
- `IOS_CERTIFICATE_PASSWORD` — password for the .p12
- `IOS_PROVISIONING_PROFILE_BASE64` — base64-encoded provisioning profile
- `IOS_DEVELOPMENT_TEAM` — Apple Developer Team ID
- `IOS_PROVISIONING_PROFILE_SPECIFIER` — provisioning profile name/specifier
- `IOS_KEYCHAIN_PASSWORD` — optional temporary keychain password

The certificate and provisioning profile must legitimately belong to the Apple Developer account/team used for the build. Do not commit certificates, private keys, or provisioning profiles to the repository.

The workflow defaults to **ad-hoc** export. The manual workflow also offers development and app-store export methods.

### Unsigned fallback

If the Apple signing secrets are not configured, Actions still attempts to produce an unsigned IPA and publishes it with `-unsigned` in the filename. This verifies the native build pipeline, but an unsigned IPA is **not directly installable on a normal iPhone or iPad**.

## Local commands

After installing dependencies:

`npm run ios:add`

`npm run ios:sync`

`npm run ios:assets`

Then open the generated Xcode project under `ios/App`.
