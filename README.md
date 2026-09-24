# CEVAZ Spelling Bee Adventure Lab · Level 1

A gamified browser practice app for CEVAZ Kids Level 1 Spelling Bee preparation.

## What children can practice

1. **Sound Detective** — hear a word and build its spelling with letter tiles.
2. **Spell It Out!** — hear a word, spell it aloud, see the letters recognized, and use **Letter Rescue** when one needs practice.
3. **Voice Challenge** — hear and repeat the whole word.
4. **Word Match** — connect an emoji/picture cue with the correct word.
5. **Word Builder** — repair words with missing letters.
6. **Bee Arena** — a short contest-style spoken spelling round with `Repeat please` practice.

The app contains the official 60 Level 1 words used in the supplied practice prototype.

## Letter Rescue

When spoken spelling does not match the target, the app aligns the expected and recognized letter sequences. For substitutions or omitted letters, it highlights the expected letter and lets the child:

- tap the letter to hear its American English letter name;
- repeat that letter into the microphone;
- rescue the letter;
- spell the whole word again.

Feedback is intentionally non-numeric: **Excellent!**, **Great!**, and **Keep practicing!**

## Technology

- HTML5
- CSS3
- Vanilla JavaScript ES modules
- MVC-style separation of models, views, and controllers
- Browser Web Speech API for speech recognition and text-to-speech
- `localStorage` for Bee Stars, honeycomb progress, badges, and selected voice
- GitHub Pages hosting
- No backend
- No API keys
- No runtime dependencies or CDNs

## Browser note

For the microphone activities, use a current Chromium-based browser such as Chrome or Edge where browser speech recognition is available. Speech capabilities vary by browser and device. The non-microphone missions remain usable when recognition is unavailable.

The app itself does not intentionally save microphone recordings or transcript history. Browser speech recognition may be processed by the browser/vendor's speech service depending on the device and browser.

## Local progress

Progress is stored only in the current browser under:

`cevaz.spellingBee.level1.v1`

Changing devices/browsers or clearing site data resets that progress.

## Tests

With Node.js installed:

```bash
npm test
```

The test suite covers the 60-word bank, letter-name normalization, repeated-letter alignment, Letter Rescue decisions, local storage safety, rewards, views, and game helpers.

## Publish

See [`GITHUB_SETUP_STEP_BY_STEP.md`](./GITHUB_SETUP_STEP_BY_STEP.md) for click-by-click instructions.
