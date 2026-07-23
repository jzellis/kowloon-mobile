#!/usr/bin/env node
// eas-build-on-success hook — auto-distribute the freshly built Android APK to
// Firebase App Distribution so testers get every build hands-free, with no
// second local command. EAS runs this ON its build servers after a successful
// build (it looks for the npm script named "eas-build-on-success").
//
// Guarded to Android + the `preview` profile. Auths firebase-tools with a
// service account supplied via the GOOGLE_SERVICE_ACCOUNT EAS *file* secret.
// If that secret isn't set, it logs and SKIPS — a missing secret never fails
// the build, and you can still run `npm run distribute:android` locally.
//
// One-time setup (see scripts/DISTRIBUTE.md):
//   1. Firebase console -> Project settings -> Service accounts -> generate a
//      key; give it the "Firebase App Distribution Admin" role.
//   2. eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT \
//        --type file --value ./firebase-service-account.json
//      (EAS exposes it on the builder as $GOOGLE_SERVICE_ACCOUNT = a file path.)

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const platform = process.env.EAS_BUILD_PLATFORM; // "android" | "ios"
const profile = process.env.EAS_BUILD_PROFILE; // "preview" | ...
const GROUP = process.env.FIREBASE_TESTERS_GROUP || "fb-friend-testers";

const skip = (msg) => {
  console.log(`[distribute] skip: ${msg}`);
  process.exit(0);
};

if (platform !== "android") skip(`platform=${platform} (Android only)`);
if (profile && profile !== "preview") skip(`profile=${profile} (preview only)`);

// Firebase service account (EAS file secret). Without it we can't auth.
const creds =
  process.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!creds || !existsSync(creds)) {
  skip("no GOOGLE_SERVICE_ACCOUNT file secret — run distribute:android locally instead");
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = creds;

// Firebase Android app id — read from google-services.json so it never drifts.
const gs = JSON.parse(readFileSync(new URL("../google-services.json", import.meta.url)));
const appId = gs.client[0].client_info.mobilesdk_app_id;

// Locate the built APK in the Gradle outputs.
let apk = "";
try {
  apk = execSync('find android -name "*.apk" -path "*outputs*" | head -1', {
    encoding: "utf8",
  }).trim();
} catch {
  /* fall through */
}
if (!apk) skip("no APK found under android/**/outputs");
console.log(`[distribute] APK: ${apk}`);

// Release notes = the build's git commit subject.
let notes = "Kowloon Android build";
try {
  notes = execSync("git log -1 --pretty=%s", { encoding: "utf8" }).trim() || notes;
} catch {
  /* keep default */
}

console.log(`[distribute] pushing to Firebase group "${GROUP}"...`);
execSync(
  `npx --yes firebase-tools@latest appdistribution:distribute "${apk}" ` +
    `--app "${appId}" --groups "${GROUP}" --release-notes ${JSON.stringify(notes)}`,
  { stdio: "inherit" }
);
console.log(`[distribute] done — testers in "${GROUP}" notified.`);
