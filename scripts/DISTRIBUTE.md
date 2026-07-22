# Distributing Android builds to testers

EAS Submit only targets Google Play / the App Store, so we bridge EAS → **Firebase
App Distribution** with `npm run distribute:android`. It grabs the newest finished
EAS Android build and pushes the APK to a tester group. Testers get an email + an
in-app notification for every new build and install from one place — no per-build
links to re-send. No device/UDID limit on Android.

## One-time setup

1. **Authenticate the Firebase CLI** (either option):
   - Interactive (simplest for local use): `npx firebase-tools login`
   - Service account (better for automation): create a key in Firebase console →
     Project settings → Service accounts, give it the **Firebase App Distribution
     Admin** role, save it as `firebase-service-account.json` (gitignored), and
     `export GOOGLE_APPLICATION_CREDENTIALS=$PWD/firebase-service-account.json`.

2. **Create a tester group.** Firebase console → **App Distribution → Testers &
   Groups** → add a group (default alias this script expects: `testers`) and add
   tester emails. First time only, App Distribution asks you to enable it.

3. Testers accept the invite email, then install builds from the link or the
   **Firebase App Tester** app.

## Each release

```bash
eas build --profile preview --platform android   # build (counts against quota)
npm run distribute:android                        # push it to testers
```

Options:
- `GROUP=alpha npm run distribute:android` — target a different tester group.
- `NOTES="what to test" npm run distribute:android` — custom release notes
  (defaults to the build's git commit subject).

## Notes

- The Firebase app id is read from `google-services.json`, so it stays in sync.
- To make distribution automatic on every build instead, an `eas-build-on-success`
  hook can run the Firebase CLI on EAS's servers — needs the service-account key as
  an EAS secret. The manual script above is simpler and more transparent for now.
