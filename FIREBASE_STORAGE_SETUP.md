# Firebase Storage Setup - Download Fix

## Problem
❌ Downloads fail with error: `firebase_storage.js doTheRequest @ firebase_storage.js:456`

**Root Cause**: Firebase Storage security rules are not configured, so all download requests are blocked.

## Solution

### Option 1: Deploy Rules via Firebase CLI (Recommended)

**Step 1**: Install Firebase CLI
```bash
npm install -g firebase-tools
```

**Step 2**: Login to Firebase
```bash
firebase login
```

**Step 3**: Initialize Firebase (if not done)
```bash
firebase init
# Select your project: keysystem-d0b86-8df89
# Select features: Storage
```

**Step 4**: Deploy Storage Rules
```bash
firebase deploy --only storage
```

✅ Done! Downloads should now work.

---

### Option 2: Configure Rules in Firebase Console (Manual)

If you prefer not to use CLI:

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select project: **keysystem-d0b86-8df89**
3. Go to **Storage** → **Rules**
4. Copy-paste the following rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read assets (public download)
    match /assets/{assetId}/{file=**} {
      allow read;
      // Only authenticated users can write/upload
      allow write: if request.auth != null;
    }

    // Allow authenticated users to write temporary files
    match /temp/{userId}/{file=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Default: deny everything else
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**

✅ Done! Downloads should now work.

---

## What These Rules Do

| Operation | Path | Allowed For | Rule |
|-----------|------|-------------|------|
| **Download** | `/assets/{assetId}/*` | Everyone | `allow read` |
| **Upload** | `/assets/{assetId}/*` | Authenticated users | `allow write: if request.auth != null` |
| **Delete** | `/assets/{assetId}/*` | Authenticated users | `allow write: if request.auth != null` |
| **Temporary files** | `/temp/{userId}/*` | The user | `allow read, write: if request.auth.uid == userId` |

---

## Testing

After deploying rules, try to:
1. Download an asset from `/asset/:id`
2. Download from `/` marketplace

Both should work without errors.

---

## Error Codes

If you still get errors, check the error code:

| Error | Cause | Solution |
|-------|-------|----------|
| `storage/object-not-found` | File doesn't exist in Storage | Check file was uploaded correctly |
| `storage/unauthorized` | Rules deny access | Check Firebase Storage rules are deployed |
| `storage/retry-limit-exceeded` | Network issue | Check internet connection |

---

## Files in This Project

- `storage.rules` - Security rules for Firebase Storage
- `firebase.json` - Firebase CLI configuration
- `client/lib/fileService.ts` - Download/upload functions (improved error handling)

---

## Need Help?

- Check browser console (F12) for detailed error messages
- See Firebase Storage logs: https://console.firebase.google.com/ → Storage → Rules → Logs
- Review Firebase documentation: https://firebase.google.com/docs/storage/security
