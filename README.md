# RoomNote

Professional meeting transcription with automatic speaker identification, speaker naming, inline notes, and PDF export.

Built on Deepgram's Nova 3 model — the same engine used by enterprise transcription tools. No subscription. No server. Runs on any Mac.

---

## What it does

- **Records live meetings** — place the laptop in the centre of the room, press Record
- **Identifies speakers automatically** — Deepgram tells them apart without training
- **Name your speakers** — after transcription, click "Speakers" and type real names
- **Inline notes** — click "+ Add note" under any utterance; notes appear in the PDF
- **Speaker statistics** — see who spoke how long and what percentage of the meeting
- **Search** — Cmd+F to find any word or phrase in the transcript
- **Save & restore sessions** — re-open any past session and keep editing
- **Export to PDF** — clean, print-ready document with speaker names, timestamps, and notes
- **Upload audio** — transcribe an existing recording instead of recording live

---

## Getting your Deepgram API key (free, 2 minutes)

1. Go to **https://console.deepgram.com/signup**
2. Sign up — no credit card required
3. You get **$200 free credit** (enough for thousands of hours of transcription)
4. In the Console, click **API Keys → Create a new API key**
5. Copy the key — you only see it once; paste it into RoomNote and it's saved

---

## How to install RoomNote on a Mac

RoomNote is built automatically from GitHub. You don't need to install any development tools.

### Step 1 — Upload the code to GitHub (do this from your Windows PC)

1. Go to **https://github.com** and sign in (or create a free account)
2. Click the **+** icon → **New repository**
   - Name: `roomnote`
   - Visibility: Private
   - Click **Create repository**
3. On the next screen, click **uploading an existing file**
4. Drag these files into the upload area:
   - `index.html`
   - `main.js`
   - `preload.js`
   - `package.json`
5. Commit those files
6. Now add the build workflow — click **Create new file**
   - In the filename box, type exactly: `.github/workflows/build.yml`
   - Paste the contents of the `build.yml` file from this folder
   - Click **Commit changes**

### Step 2 — GitHub builds the app automatically (5–10 minutes)

1. In your GitHub repository, click the **Actions** tab
2. You'll see **"Build RoomNote for Mac"** running (yellow dot = in progress)
3. Wait for the green tick ✓
4. Click the completed workflow run
5. At the bottom, under **Artifacts**, click **RoomNote-Mac-DMG**
6. A zip downloads — inside is `RoomNote-1.0.0-universal.dmg`

### Step 3 — Copy to USB stick

Extract the `.dmg` from the zip and copy it to your USB stick.

### Step 4 — Install on the Mac

1. Insert the USB stick into the Mac
2. Double-click `RoomNote-1.0.0-universal.dmg`
3. Drag the **RoomNote** icon into the **Applications** folder
4. Open **Finder → Applications → RoomNote**

**First launch — Gatekeeper bypass (one time only):**

macOS will block the first launch because the app isn't signed with an Apple Developer certificate.

- **Right-click** (or Control-click) on RoomNote in Applications
- Click **Open**
- Click **Open** again in the dialog
- RoomNote opens normally every time after that

---

## Using RoomNote

### Recording a meeting

1. Open RoomNote
2. Paste your Deepgram API key (saved automatically after first use)
3. Type a session name — e.g. *"Smith Matter — 9 July 2026"*
4. Select the correct microphone (defaults to built-in; choose an external mic if one is connected)
5. Leave **Nova 3** selected (best accuracy)
6. Click **Start Recording**
7. When done, click **Stop & Transcribe**
8. Wait 30–90 seconds while Deepgram processes
9. The transcript appears with speakers automatically separated

### After transcription

- **Name speakers** — click the **Speakers** button and type real names
- **Add notes** — click **+ Add note** under any segment; press Cmd+Enter to save
- **Search** — press Cmd+F or click the **Find** button
- **Save** — press Cmd+S to save a `.rn` session file (re-open any time)
- **Export PDF** — click the **PDF** button for a print-ready document
- **Copy text** — click **Copy** to paste the full transcript into Word or email

### Uploading an existing recording

On the setup screen, click **Choose an audio or video file**. Supports MP3, MP4, M4A, WAV, OPUS, FLAC, and most video formats.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+N | New session |
| Cmd+R | Start recording |
| Cmd+Shift+P | Pause / Resume |
| Cmd+Shift+S | Stop & Transcribe |
| Cmd+S | Save session |
| Cmd+O | Open session |
| Cmd+Shift+N | Name speakers |
| Cmd+P | Export PDF |
| Cmd+Shift+C | Copy full transcript |
| Cmd+F | Find in transcript |
| Cmd+Enter | Save note (while editing) |
| Esc | Cancel note / Close search |

---

## Tips for best results

- **Position matters** — place the laptop in the centre of the table, not in front of one person
- **Reduce background noise** — close windows, turn off fans and air conditioning if possible
- **Speak clearly** — brief pauses between speakers help the AI separate voices
- **External microphone** — a small USB conference mic (e.g. Jabra Speak) dramatically improves accuracy for 3+ people
- **Name speakers immediately** — do it right after transcription while voices are fresh in memory
- **Save your session** — Cmd+S saves the transcript and all your notes; re-open any time
- **Upload instead of recording** — if you have an existing recording, use the upload option

---

## Privacy

- Your **Deepgram API key** is stored only on this Mac, inside the app's local storage. It is never sent anywhere except to Deepgram's servers.
- **Audio** is sent to Deepgram for transcription and is not retained after processing.
- **Transcripts and notes** are stored only on this Mac — in session history and in `.rn` files you save.
- No data is ever sent to any server other than Deepgram.

---

## Troubleshooting

**"Microphone access denied"**
→ System Settings → Privacy & Security → Microphone → enable RoomNote

**"Error 401 — Unauthorized"**
→ Your Deepgram API key is wrong. Create a new key at console.deepgram.com and paste it in.

**"Error 402 — Payment required"**
→ Free credit exhausted. Add a payment method at console.deepgram.com (still very cheap).

**No speakers separated — everyone is "Speaker 1"**
→ Recording was too short, or only one person spoke. Diarization needs at least a few back-and-forth exchanges.

**App won't open — "can't be opened because Apple cannot check it for malicious software"**
→ Right-click the app → Open → Open. You only need to do this once.

**PDF export doesn't work**
→ Allow pop-ups for RoomNote in Safari/Chrome settings, or use the Copy button instead.

---

## Session file format

RoomNote sessions are saved as `.rn` files (plain JSON). You can open them in any text editor.

```json
{
  "version": 1,
  "name": "Smith Matter — 9 July 2026",
  "durSecs": 2340,
  "utterances": [...],
  "spkNames": { "0": "Jane Smith", "1": "David Jones" },
  "notes": { "4": "Key point re clause 7" },
  "savedAt": "2026-07-09T10:30:00Z"
}
```

---

## Building from source (advanced)

If you want to build locally on a Mac:

```bash
git clone https://github.com/YOUR_USERNAME/roomnote.git
cd roomnote
npm install
npm start              # Run in development mode
npm run build:mac      # Build unsigned .dmg (requires macOS)
```

The `.github/workflows/build.yml` does this automatically on every push to `main`.

---

*RoomNote v1.0.0 — Professional meeting transcription for legal and business use.*
