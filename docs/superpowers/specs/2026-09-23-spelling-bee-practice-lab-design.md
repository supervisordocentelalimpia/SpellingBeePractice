# CEVAZ Spelling Bee Practice Lab - Design Specification

Date: 2026-09-23
Project: SpellingBeePractice
Audience: CEVAZ Kids Level 1
Deployment: GitHub Pages only
Architecture: Vanilla HTML/CSS/JavaScript ES modules using MVC
Persistence: browser `localStorage` only
Speech: browser Web Speech APIs (`SpeechRecognition` / `webkitSpeechRecognition` and `speechSynthesis`)

## 1. Product goal

Build a polished, highly gamified Spelling Bee practice web app for CEVAZ Kids Level 1. Children must be able to listen to American English words, spell words aloud into the microphone, see the letters the browser understood, identify exactly which expected letter needs practice, tap that letter to hear its American English letter name, repeat the isolated letter, rescue it, and then retry the whole spelling.

The app must feel like a game rather than an assessment. No numeric pronunciation scores are shown. Child-facing feedback uses `Excellent!`, `Great!`, and `Keep practicing!`.

The app preserves the official 60-word Level 1 bank from the current prototype and retains six practice missions.

## 2. Hard constraints

- Host and deploy entirely with GitHub + GitHub Pages.
- No Vercel, Azure, Firebase, Supabase, Google Sheets, server functions, API keys, or backend database.
- No personally identifying information.
- No translation to Spanish.
- No numeric score shown to children.
- No IPA training in the spelling activity.
- Use JavaScript, not Java.
- No required third-party runtime libraries or CDNs; the project should be self-contained.
- Primary supported experience: current Chromium browsers with microphone and Web Speech support; non-microphone missions remain usable if recognition is unavailable.

## 3. Core oral spelling loop

1. Child hears the target word from the selected `en-US` pronouncer.
2. Child taps the microphone and spells the word aloud, one letter at a time.
3. Browser speech recognition returns one or more transcript alternatives.
4. `LetterNormalizer` converts transcript tokens such as `bee`, `why`, `are`, and `double b` into candidate letter sequences.
5. `SpellingMatcher` aligns each candidate with the expected word using edit-distance sequence alignment.
6. The best evidence-supported candidate is selected; ambiguous/empty recognition is not silently corrected.
7. Exact spelling -> `Excellent!`, Bee Star, celebration, continue.
8. One mismatch -> `Great!`, start Letter Rescue for the expected letter.
9. Multiple mismatches -> `Keep practicing!`, rescue one expected letter at a time.
10. In Letter Rescue the child taps the target letter to hear its American English letter name, then repeats it into the microphone.
11. Successful isolated-letter recognition -> `<LETTER> rescued!`, star animation.
12. Child retries the complete word.

## 4. Letter Rescue

Example target: `RABBIT`
Recognized: `R A D B I T`

The aligned substitution is expected `B`, heard `D` at the first B position.

Child view:

- expected letters displayed as individual tiles
- matched letters shown neutral/mint
- target expected letter shown honey-gold with bee marker
- `Tap B to listen`
- tap plays the letter name using the selected American English voice
- `Repeat B` activates recognition for the isolated letter
- success: `B rescued!`
- child returns to `Now spell RABBIT again!`

Do not show the child IPA or phoneme notation in this flow.

## 5. Recognition normalization

`LetterNormalizer` must support common American-English recognition variants, including:

- A: `a`, `ay`, `hey`
- B: `b`, `bee`, `be`
- C: `c`, `see`, `sea`
- D: `d`, `dee`
- E: `e`, `ee`
- F: `f`, `ef`
- G: `g`, `gee`
- H: `h`, `aitch`
- I: `i`, `eye`
- J: `j`, `jay`
- K: `k`, `kay`
- L: `l`, `el`
- M: `m`, `em`
- N: `n`, `en`
- O: `o`, `oh`
- P: `p`, `pee`
- Q: `q`, `cue`, `queue`
- R: `r`, `are`
- S: `s`, `ess`
- T: `t`, `tee`, `tea`
- U: `u`, `you`
- V: `v`, `vee`
- W: `w`, `double u`, `double you`, `double-you`
- X: `x`, `ex`
- Y: `y`, `why`
- Z: `z`, `zee`

The parser also handles `double <letter>` and expands it to two letters. It removes punctuation and filler tokens where safe. Recognition alternatives are preserved so the matcher can choose the candidate with the lowest edit cost; ties that imply materially different corrections are treated as uncertain and ask for a retry.

## 6. Sequence alignment

Use Levenshtein-style dynamic programming and return structured operations:

- `match`
- `substitution`
- `deletion` (expected letter omitted)
- `insertion` (extra heard letter)

Repeated letters such as `RABBIT` must remain stable rather than shifting every subsequent letter.

Matcher result shape:

```js
{
  status: 'exact' | 'near-match' | 'retry',
  expected: ['R','A','B','B','I','T'],
  heard: ['R','A','D','B','I','T'],
  distance: 1,
  operations: [/* aligned operations */],
  rescueTargets: [/* expected-letter operations only */]
}
```

Insertions have no expected letter to rescue; the child is told an extra letter sneaked in and retries the word.

## 7. Speech architecture

### Recognition

Create `SpeechController` around:

```js
window.SpeechRecognition || window.webkitSpeechRecognition
```

Configuration:

- `lang = 'en-US'`
- `continuous = false`
- `interimResults = false`
- `maxAlternatives = 5`

Recognition modes:

- full spoken spelling
- isolated letter rescue
- whole-word confirmation for Voice Challenge

If recognition is missing, denied, produces no useful letters, or returns an error, the app gives a friendly retry/fallback message rather than grading the attempt.

### Text-to-speech

Use browser `speechSynthesis` and dynamically enumerate voices. Prioritize `en-US` voices; show up to five useful US-English choices. The selected voice is saved in localStorage by stable voice metadata when possible. If a saved voice is unavailable later, automatically fall back to the best current `en-US` voice.

Preview phrase:

`Hello! Ready for your Spelling Bee practice?`

Use the selected voice for target words, isolated letters, repeat requests, and Bee Arena prompts.

## 8. Six missions

### Mission 1 - Sound Detective

Hear a target word and build its spelling by tapping shuffled letter tiles. Correct completion awards progress.

### Mission 2 - Spell It Out!

Primary spoken spelling flow: hear -> microphone -> normalized transcript -> alignment -> Letter Rescue -> retry.

### Mission 3 - Voice Challenge

Hear a whole word and say the whole word. Browser recognition confirms whether the expected lexical word was recognized. This is recognition practice, not numeric pronunciation assessment.

### Mission 4 - Word Match

Emoji-to-word multiple-choice practice with optional audio replay.

### Mission 5 - Word Builder

Missing-letter reconstruction using an input field or letter buttons, with supportive feedback.

### Mission 6 - Bee Arena

Contest-style simulation:

- `Your word is...`
- hear word
- optional `Repeat please`
- spell aloud
- Letter Rescue when needed
- continue through a short round

The interface may reinforce `Repeat please` and `Excuse me`, but it is not a rules page.

## 9. Gamification

### Bee Stars

Award for constructive practice events. Never subtract stars.

Examples:

- exact spelling
- successful Letter Rescue
- successful retry after rescue
- mission completion

### Honeycomb Journey

Display 12 honeycomb cells. Fill cells based on cumulative constructive actions. When full, celebrate and continue counting stars; do not block practice.

### Badges

- `Super Listener`
- `Brave Speller`
- `Spelling Star`
- `Comeback Bee`
- `Bee Arena Ready`

### Streaks

Track consecutive exact successes during a session. Streak resets on a mismatch but never removes previously earned stars.

### Animations

Use lightweight CSS/DOM effects only: star burst, bee bounce, rescue pop, honeycomb fill, limited confetti. Respect `prefers-reduced-motion`.

## 10. Visual design

Style: colorful, polished, playful, modern; school-age rather than preschool.

Color roles:

- learning blue: primary controls and trust
- honey gold: missions and practice targets
- mint: success and rescued letters
- violet: special challenges
- coral: energetic accent, never punitive failure
- cream/off-white: visual rest
- deep navy: text

Requirements:

- strong hierarchy
- rounded cards
- large readable type
- touch targets about 44px minimum
- responsive at desktop/tablet/mobile, including ~320px wide screens
- no essential hover-only interactions
- visible keyboard focus
- accessible `aria-live` feedback
- no flashing

## 11. MVC architecture

### Models

- `WordModel.js`: official 60-word bank, random selection, lookup
- `SessionModel.js`: current mission/word/attempt/session streak
- `SettingsModel.js`: selected voice and UI preferences
- `RewardModel.js`: stars, honeycomb, badges and persistence

### Views

- `HomeView.js`: hero, voice selector, mission cards, progress
- `GameView.js`: shared game shell and feedback
- `SpellingView.js`: spoken spelling transcript and aligned letters
- `LetterRescueView.js`: rescue interaction

### Controllers

- `AppController.js`: application bootstrap, home/game navigation
- `GameController.js`: all six mission flows and question progression
- `SpeechController.js`: recognition + speech synthesis abstraction
- `SpellingController.js`: normalizer/matcher orchestration and rescue decisions

### Utilities/services

- `letter-normalizer.js`
- `sequence-aligner.js`
- `storage.js`
- `random.js`
- `celebration.js`

## 12. Repository structure

```text
SpellingBeePractice/
├── index.html
├── README.md
├── package.json
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── data/
│   │   └── words.js
│   ├── models/
│   │   ├── WordModel.js
│   │   ├── SessionModel.js
│   │   ├── SettingsModel.js
│   │   └── RewardModel.js
│   ├── views/
│   │   ├── HomeView.js
│   │   ├── GameView.js
│   │   ├── SpellingView.js
│   │   └── LetterRescueView.js
│   ├── controllers/
│   │   ├── AppController.js
│   │   ├── GameController.js
│   │   ├── SpeechController.js
│   │   └── SpellingController.js
│   └── utils/
│       ├── letter-normalizer.js
│       ├── sequence-aligner.js
│       ├── storage.js
│       ├── random.js
│       └── celebration.js
├── tests/
│   ├── letter-normalizer.test.js
│   ├── sequence-aligner.test.js
│   ├── rewards.test.js
│   └── words.test.js
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

## 13. LocalStorage contract

Use one versioned key:

`cevaz.spellingBee.level1.v1`

Persist only:

```js
{
  version: 1,
  selectedVoice: { name, lang, voiceURI } | null,
  stars: number,
  honeycomb: number,
  badges: string[],
  stats: {
    practiced: number,
    exact: number,
    rescuedLetters: number,
    completedMissions: string[]
  }
}
```

No child name, email, age, microphone audio, or transcript history is persisted.

Provide `Reset progress` with an explicit confirmation dialog.

## 14. Official Level 1 word bank

Use exactly these 60 words from the supplied prototype:

`kids, boy, friend, girl, goodbye, hello, robot, short, tall, afraid, bird, brave, cat, coin, dog, empty, flower, full, hat, magic, rabbit, ball, big, board, book, cake, cupcake, food, hungry, little, skate, skateboard, toy, thirsty, question, child, beautiful, magician, family, excellent, one, brown, yes, she, you, red, again, they, bush, show, white, bench, blue, skinny, black, five, run, jump, drink, stop`

Retain suitable emoji metadata for visual missions.

## 15. Error handling

- Microphone denied: explain permission is needed for spoken missions and keep Missions 1, 4 and 5 usable.
- Recognition unavailable: same non-microphone fallback.
- No recognizable letter sequence: `I couldn't hear that clearly. Let's try again!`
- Uncertain alternative tie: ask for another spelling attempt; do not invent a mismatch.
- TTS voices not loaded yet: temporarily disable preview/start audio, retry after `voiceschanged`.
- TTS unavailable: keep visual practice usable and explain audio is unavailable.
- Storage unavailable/corrupted: reset to safe default state in memory without breaking the app.

## 16. Testing requirements

### Unit tests

`LetterNormalizer`:

- A-Z common variants
- `double <letter>`
- punctuation/noise cleanup
- repeated letters
- transcripts containing standalone letters
- ambiguous/no-useful-token result

`SpellingMatcher`:

- exact
- substitution
- deletion
- insertion
- `RABBIT` repeated-letter cases
- `BEAUTIFUL` substitution
- best-alternative selection
- tied materially different alternatives -> retry

`RewardModel` / storage:

- default state
- star increment without subtraction
- badge uniqueness
- persistence parse fallback
- reset

`WordModel`:

- exactly 60 words
- unique spellings
- all have emoji metadata

### Browser/manual checks

- home renders and mission cards work
- `en-US` voice selector appears after voices load
- preview button speaks when TTS is available
- all six missions open
- Sound Detective works by click/tap
- Word Match works
- Word Builder works
- spoken missions show graceful unsupported state if SpeechRecognition is missing
- transcript letter tiles render
- Letter Rescue can play the expected letter name
- rewards update and survive reload
- reset progress clears rewards
- no horizontal overflow at approximately 320px

## 17. GitHub Pages deployment

Deployment steps for a non-programmer:

1. Create/open public repository `SpellingBeePractice`.
2. Upload the complete project contents to the repository root.
3. Commit to the default branch.
4. Open `Settings` -> `Pages`.
5. Under `Build and deployment`, select `Deploy from a branch`.
6. Select the default branch (`main` or `master`) and folder `/ (root)`.
7. Save and wait for GitHub Pages to publish.
8. Open the generated HTTPS Pages URL.
9. Allow microphone access when a spoken mission first requests it.

No secrets or environment variables are required.

## 18. Acceptance criteria

Version 1 is accepted when:

- all 60 official words are present
- GitHub Pages can host the project with no backend
- American-English voice selection/fallback works from browser voices
- target words and isolated letters can be spoken by TTS when available
- spoken spelling uses microphone recognition when supported
- transcript alternatives normalize into letter sequences
- exact, substitution, deletion and insertion cases align correctly
- expected rescue letter is identified for substitution/deletion
- tapping rescue letter speaks that letter name
- isolated-letter retry can mark the letter rescued
- child can retry full spelling after rescue
- feedback is `Excellent!`, `Great!`, or `Keep practicing!`, not a numeric score
- Letter Rescue has no punitive red failure state
- stars/honeycomb/badges persist in localStorage only
- all six missions work or degrade gracefully when microphone/TTS is unsupported
- responsive design works at desktop/tablet/mobile widths
- automated unit tests pass
