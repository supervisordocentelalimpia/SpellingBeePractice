# Publish CEVAZ Spelling Bee Practice Lab on GitHub Pages

These instructions assume no programming knowledge.

## Part 1 — Create the repository

If you already created `SpellingBeePractice`, skip to Part 2.

1. Open GitHub and click **New repository**.
2. Repository name: `SpellingBeePractice`.
3. Select **Public**.
4. You can leave README, `.gitignore`, and license unchecked because this project already includes its own files.
5. Click **Create repository**.

## Part 2 — Upload the project files

1. Download and unzip `CEVAZ_SpellingBeePractice_GitHub.zip` on your computer.
2. Open the `SpellingBeePractice` folder created by the ZIP.
3. In GitHub, open your repository `SpellingBeePractice`.
4. Click **Add file** → **Upload files**.
5. Drag the **contents inside** the unzipped `SpellingBeePractice` folder into GitHub's upload area. Do not upload the ZIP itself.
6. Confirm GitHub shows files/folders such as:
   - `index.html`
   - `css`
   - `js`
   - `tests`
   - `README.md`
   - `.nojekyll`
7. At the bottom, in **Commit changes**, write: `Upload Spelling Bee Practice Lab`.
8. Commit directly to the default branch.
9. Click **Commit changes**.

Important: `index.html` must be in the repository root, not inside another nested `SpellingBeePractice` folder.

## Part 3 — Turn on GitHub Pages

1. Inside the repository, click **Settings**.
2. In the left menu, click **Pages**.
3. Find **Build and deployment**.
4. Under **Source**, choose **Deploy from a branch**.
5. Under **Branch**, choose your default branch. It is usually `main` or `master`.
6. In the folder dropdown, select **/ (root)**.
7. Click **Save**.
8. Wait for GitHub to publish the site. Refresh the Pages settings page after a short wait.
9. GitHub will display the public site address near the top of the Pages section.

The address normally looks similar to:

`https://YOUR-USERNAME.github.io/SpellingBeePractice/`

## Part 4 — First test

Open the published Pages URL in Chrome or Edge.

Check these items:

1. The **Spelling Bee Adventure Lab** home screen appears.
2. The **Choose your Pronouncer** area shows available American English voices after the browser loads them.
3. Click **Preview voice**.
4. Open **Sound Detective** and confirm the buttons work.
5. Return home and open **Spell It Out!**.
6. Click **Hear word**.
7. Click **Spell aloud**.
8. When the browser asks for microphone permission, click **Allow**.
9. Spell the word one letter at a time in English.
10. If a letter does not match, test **Letter Rescue**:
    - tap the highlighted expected letter;
    - listen to it;
    - tap **Repeat [letter]**;
    - say that letter;
    - retry the complete word.

## If the microphone does not work

1. Use current **Chrome** or **Microsoft Edge**.
2. Make sure you are using the published `https://...github.io/...` address, not opening `index.html` directly from your computer.
3. Click the lock/site-controls icon next to the address bar and confirm **Microphone = Allow**.
4. Reload the page.
5. Make sure the correct microphone is selected in the browser/operating system.

If browser speech recognition is unavailable on that device, Sound Detective, Word Match, and Word Builder still work.

## Updating the app later

To replace a file:

1. Open the file in the GitHub repository.
2. Use the edit/upload controls to replace it, or use **Add file → Upload files** with the updated project files.
3. Commit the changes.
4. GitHub Pages automatically republishes the latest committed version.

## Never do this

- Do not paste passwords or private keys into any `.js` file.
- Do not rename `index.html`.
- Do not move `index.html` out of the repository root.
- Do not delete the `css` or `js` folders.
