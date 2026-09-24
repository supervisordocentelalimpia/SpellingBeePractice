# GitHub Pages Spelling Bee Practice Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete CEVAZ Kids Level 1 Spelling Bee Practice Lab as a self-contained GitHub Pages app with MVC, browser speech recognition/TTS, Letter Rescue, six missions, and localStorage rewards.

**Architecture:** Static HTML/CSS/JavaScript ES modules. Pure domain logic (word bank, transcript normalization, sequence alignment, rewards) is isolated from DOM code and covered by Node's built-in test runner. Browser controllers wrap Web Speech APIs and degrade gracefully when unavailable. All persistence is localStorage under one versioned key.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES2022 modules, Web Speech API, Web Storage API, Node.js built-in `node:test` for unit tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-23-spelling-bee-practice-lab-design.md`

## Global Constraints

- GitHub Pages only; no backend, API keys, external runtime services, or required CDNs.
- Use the exact 60-word Level 1 bank from the spec.
- Use `Excellent!`, `Great!`, and `Keep practicing!`; never expose a numeric score.
- Spell It Out and Bee Arena compare normalized spoken letters using edit-distance alignment.
- Letter Rescue focuses on the expected orthographic letter, not IPA.
- Persist only non-identifying progress/preferences in `cevaz.spellingBee.level1.v1`.
- No punitive red failure state; practice targets use honey-gold and success uses mint.
- UI must remain usable at ~320px and respect `prefers-reduced-motion`.

## Review Focus

- Recognition returns `bee`/`be`/`B`, `why`, `are`, `you`, `double b`, or punctuation-heavy transcripts: normalize without silently inventing letters.
- Repeated-letter words such as `RABBIT` with missing/extra/substituted B: alignment must identify a plausible single rescue target and not shift the rest of the word.
- Multiple speech alternatives tie with materially different corrections: result must be `retry`, not an invented Letter Rescue.
- Web Speech or microphone permission is unavailable: Missions 1, 4, and 5 remain usable and spoken missions display a friendly fallback.
- Corrupted/unavailable localStorage: app starts with safe defaults and does not crash.

---

### Task 1: Domain data, normalization, and spelling alignment

**Files:**
- Create: `package.json`
- Create: `js/data/words.js`
- Create: `js/utils/letter-normalizer.js`
- Create: `js/utils/sequence-aligner.js`
- Create: `js/utils/random.js`
- Create: `tests/words.test.js`
- Create: `tests/letter-normalizer.test.js`
- Create: `tests/sequence-aligner.test.js`

**Interfaces:**
- Produces: `WORDS`, `normalizeTranscript(text)`, `normalizeAlternatives(transcripts)`, `alignSpelling(expected, heard)`, `chooseBestAlignment(expected, candidates)`, `shuffle(array)`, `sample(array, count)`.

- [ ] **Step 1: Write failing word-bank tests** asserting exactly 60 unique lowercase words and non-empty emoji metadata.
- [ ] **Step 2: Run `node --test tests/words.test.js` and confirm module-not-found failure.**
- [ ] **Step 3: Implement the exact 60-word bank from the spec and random helpers.**
- [ ] **Step 4: Re-run word tests and confirm pass.**
- [ ] **Step 5: Write failing normalizer tests** for A-Z variants, `double b`, punctuation, repeated letters, direct compact strings like `RABBIT`, and no useful tokens.
- [ ] **Step 6: Run `node --test tests/letter-normalizer.test.js` and confirm failure because implementation is missing.**
- [ ] **Step 7: Implement `normalizeTranscript` and `normalizeAlternatives` with longest-phrase token matching and no guessed correction.**
- [ ] **Step 8: Re-run normalizer tests and confirm pass.**
- [ ] **Step 9: Write failing alignment tests** for exact, substitution, deletion, insertion, repeated-letter RABBIT cases, BEAUTIFUL substitution, best alternative, and tied alternatives -> retry.
- [ ] **Step 10: Run `node --test tests/sequence-aligner.test.js` and confirm failure.**
- [ ] **Step 11: Implement dynamic-programming alignment and candidate selection.**
- [ ] **Step 12: Run `node --test tests/words.test.js tests/letter-normalizer.test.js tests/sequence-aligner.test.js` and confirm pass.**
- [ ] **Step 13: Commit Task 1.**

### Task 2: Local persistence, settings, session, and rewards

**Files:**
- Create: `js/utils/storage.js`
- Create: `js/models/WordModel.js`
- Create: `js/models/SessionModel.js`
- Create: `js/models/SettingsModel.js`
- Create: `js/models/RewardModel.js`
- Create: `tests/models.test.js`

**Interfaces:**
- Consumes: `WORDS`, `sample`.
- Produces: `createStorage(adapter)`, `WordModel`, `SessionModel`, `SettingsModel`, `RewardModel`.

- [ ] **Step 1: Write failing model/storage tests** for safe defaults, corrupt JSON fallback, voice save/load, reset, stars never decreasing, unique badges, honeycomb clamping, 60-word access, and session streak behavior.
- [ ] **Step 2: Run `node --test tests/models.test.js` and confirm failure.**
- [ ] **Step 3: Implement storage with key `cevaz.spellingBee.level1.v1` and in-memory fallback.**
- [ ] **Step 4: Implement models with small public APIs used by controllers.**
- [ ] **Step 5: Run `node --test tests/models.test.js` and confirm pass.**
- [ ] **Step 6: Run full test suite and confirm pass.**
- [ ] **Step 7: Commit Task 2.**

### Task 3: Speech and spoken-spelling controllers

**Files:**
- Create: `js/controllers/SpeechController.js`
- Create: `js/controllers/SpellingController.js`
- Create: `tests/controllers.test.js`

**Interfaces:**
- Consumes: `normalizeTranscript`, `normalizeAlternatives`, `chooseBestAlignment`, `SettingsModel`.
- Produces: `SpeechController` with `getVoices()`, `speak(text, options)`, `listen(mode)`; `SpellingController` with `evaluateTranscripts(expected, alternatives)` and `evaluateLetter(expectedLetter, alternatives)`.

- [ ] **Step 1: Write failing controller tests** with injected fake speech window objects covering unsupported recognition, en-US voice sorting, recognition alternatives, transcript evaluation, isolated-letter success, and uncertain retry.
- [ ] **Step 2: Run `node --test tests/controllers.test.js` and confirm failure.**
- [ ] **Step 3: Implement SpeechController with dependency injection and browser defaults.**
- [ ] **Step 4: Implement SpellingController as pure orchestration around normalizer and matcher.**
- [ ] **Step 5: Run controller tests and confirm pass.**
- [ ] **Step 6: Run full test suite and confirm pass.**
- [ ] **Step 7: Commit Task 3.**

### Task 4: Views and responsive visual system

**Files:**
- Create: `index.html`
- Create: `css/app.css`
- Create: `js/views/HomeView.js`
- Create: `js/views/GameView.js`
- Create: `js/views/SpellingView.js`
- Create: `js/views/LetterRescueView.js`
- Create: `js/utils/celebration.js`
- Create: `tests/views.test.js`

**Interfaces:**
- Produces render helpers for home, shared game shell, spoken letter tiles, Letter Rescue, reward summary, and celebration effects.

- [ ] **Step 1: Write failing view tests** that assert required mission titles, feedback copy, voice selector markup, rescue copy, accessibility labels, and no numeric score copy.
- [ ] **Step 2: Run `node --test tests/views.test.js` and confirm failure.**
- [ ] **Step 3: Implement semantic HTML shell and pure render functions.**
- [ ] **Step 4: Implement `css/app.css` with CEVAZ learning blue, honey gold, mint success, violet challenge, coral accent, cream background, navy text, responsive 320px behavior, focus states, and reduced motion.**
- [ ] **Step 5: Implement celebration utility with bounded DOM particles and reduced-motion guard.**
- [ ] **Step 6: Run view tests and confirm pass.**
- [ ] **Step 7: Run full suite and confirm pass.**
- [ ] **Step 8: Commit Task 4.**

### Task 5: AppController and all six playable missions

**Files:**
- Create: `js/controllers/GameController.js`
- Create: `js/controllers/AppController.js`
- Create: `js/app.js`
- Create: `tests/game-logic.test.js`

**Interfaces:**
- Consumes all models/controllers/views.
- Produces complete browser application bootstrapped by `js/app.js`.

- [ ] **Step 1: Write failing game-logic tests** for deterministic helpers used by Sound Detective shuffled letters, Word Match choices, Word Builder mask generation, reward decisions, and Bee Arena round length.
- [ ] **Step 2: Run `node --test tests/game-logic.test.js` and confirm failure.**
- [ ] **Step 3: Implement tested pure game helpers inside GameController exports.**
- [ ] **Step 4: Implement AppController navigation, voice selection, reset-progress confirmation, and reward refresh.**
- [ ] **Step 5: Implement Mission 1 Sound Detective.**
- [ ] **Step 6: Implement Mission 2 Spell It Out with recognition -> transcript -> alignment -> Letter Rescue -> isolated letter retry -> whole-word retry.**
- [ ] **Step 7: Implement Mission 3 Voice Challenge with lexical recognition confirmation and supportive retry.**
- [ ] **Step 8: Implement Mission 4 Word Match.**
- [ ] **Step 9: Implement Mission 5 Word Builder.**
- [ ] **Step 10: Implement Mission 6 Bee Arena with `Repeat please`, short round progression, and shared Letter Rescue.**
- [ ] **Step 11: Run `node --test` and confirm entire suite passes.**
- [ ] **Step 12: Commit Task 5.**

### Task 6: Documentation, browser verification, and release package

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `GITHUB_SETUP_STEP_BY_STEP.md`
- Create: `tests/static.test.js`
- Create: release ZIP `/mnt/data/CEVAZ_SpellingBeePractice_GitHub.zip`

**Interfaces:**
- Produces a copy/paste/upload-ready GitHub Pages project and non-programmer deployment guide.

- [ ] **Step 1: Write failing static tests** that ensure `index.html` references existing local assets/modules, no Vercel/Azure/API-key strings occur in runtime files, and required files exist.
- [ ] **Step 2: Run `node --test tests/static.test.js` and confirm failure until docs/static contract exists.**
- [ ] **Step 3: Write README and exact GitHub Pages click-by-click setup guide.**
- [ ] **Step 4: Run full test suite and confirm pass.**
- [ ] **Step 5: Start a local static server and verify page load, visible mission cards, no blank page/error overlay, navigation, non-microphone missions, and 320px layout with browser tooling.**
- [ ] **Step 6: Verify repository contains no secrets and no runtime dependency on external backend services.**
- [ ] **Step 7: Create ZIP excluding `.git` and transient verification files.**
- [ ] **Step 8: Run final ZIP/content verification and commit Task 6.**
