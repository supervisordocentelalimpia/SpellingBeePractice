# Google Apps Script backend

This folder is the secure data layer for the GitHub Pages frontend.

## Google Sheet

This backend writes to the existing spreadsheet **Spelling Bee Practica - APP**.

Spreadsheet ID:

`1OySIbVR0ov8n2CAJief4H25qPxB-kVxFjIrK552omoU`

## Deployment

1. Open the spreadsheet.
2. Go to **Extensions -> Apps Script**.
3. Replace `Code.gs` with this folder's `Code.gs`.
4. Save.
5. Run `setupBackend()` once and authorize access.
6. Go to **Deploy -> New deployment -> Web app**.
7. Execute as **Me**.
8. Choose an access level your students can reach.
9. Deploy and copy the URL ending in `/exec`.

Then connect it to GitHub Pages in one of two ways:

- Temporary test:
  `https://supervisordocentelalimpia.github.io/SpellingBeePractice/?api=YOUR_EXEC_URL`
- Permanent:
  paste the `/exec` URL into the root `config.js`.

## Data controls

The backend uses:

- normalized student names;
- stable student IDs;
- `LockService`;
- idempotent `Launch_Key`;
- idempotent `Event_Key`;
- separate technical microphone events;
- first-attempt, retry, word and activity-level evidence.

A microphone failure is never counted as an English error.
