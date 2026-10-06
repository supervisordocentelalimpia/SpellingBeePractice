# CEVAZ Spelling Bee Practice Lab · GitHub Edition v4

Interactive Level 1 Spelling Bee practice for children.

## Live student frontend

https://supervisordocentelalimpia.github.io/SpellingBeePractice/

GitHub Pages is enabled for this repository.

## Architecture

```
Student
  -> GitHub Pages (HTML/CSS/JavaScript + microphone)
  -> Google Apps Script Web App (backend)
  -> Existing Google Sheet
     - Students
     - Sessions
     - Activity_Log
     - Dashboard
     - Student_Overview
     - Word_Analysis
     - Data_Quality
```

## Practice missions

1. Sound Detective
2. Spell It Out
3. Voice Challenge
4. Word Match
5. Word Builder
6. Bee Arena

Bee Arena follows:

**SAY -> SPELL -> SAY AGAIN**

Its 45-second timer is only a fluency reference. Reaching zero does not close the microphone, end the round, or mark the child wrong. Overtime continues as +1s, +2s, and so on.

## Microphone

The frontend is served from GitHub Pages over HTTPS so the browser can request microphone permission normally.

The student gate includes **Test microphone** before practice.

The app checks:

- secure HTTPS context;
- microphone capture permission;
- an available audio track;
- Web Speech Recognition support;
- speech-recognition errors separately from academic attempts.

Technical microphone failures are logged as technical incidents and are not counted as English errors.

For voice activities, use a current Chrome or Edge browser.

## Student identity / duplicate protection

The backend protects the audit trail through:

- normalized student names;
- stable student ID recovery;
- `LockService`;
- `Launch_Key` session deduplication;
- `Event_Key` idempotency.

This prevents repeated clicks or reloads from counting the same learner several times.

## Google Sheets teacher controls

Use:

- **Student_Overview** for one-row-per-student control;
- **Dashboard** for filtered instructional interpretation;
- **Word_Analysis** for word-level intervention;
- **Data_Quality** before drawing conclusions from the data.

See [Teacher Data Guide](./docs/TEACHER_DATA_GUIDE.md).

## Connect the existing Google Sheet

The server-side code is in [apps-script/Code.gs](./apps-script/Code.gs).

Follow [apps-script/README.md](./apps-script/README.md).

After the Apps Script Web App is deployed, paste its public `/exec` URL into [config.js](./config.js).

For a one-device test before editing config.js:

```
https://supervisordocentelalimpia.github.io/SpellingBeePractice/?api=YOUR_APPS_SCRIPT_EXEC_URL
```

The app saves that backend URL in the browser after the first visit.

## Security

Do **not** place any Google password, OAuth token, API key, service-account private key, or other secret in this public repository.

The GitHub frontend contains only public client code. Google Sheets writes happen through Apps Script.
