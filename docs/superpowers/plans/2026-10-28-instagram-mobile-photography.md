# Instagram Mobile Photography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a six-post, original-audio Instagram mobile-photography Bonus Track and a Credits Instagram link without allowing post audio to overlap the persistent website soundtrack.

**Architecture:** Add `BT03` to the existing track/project data model and render it through one focused vertical player plus six lightweight poster selectors. Generate six web-ready clips from the 352 MB source recording with native macOS media tools, then let the existing persistent audio shell coordinate soundtrack fading, video exclusivity, and restoration.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js structural tests, macOS AVFoundation/Swift, `/usr/bin/avconvert`, GitHub Pages.

---

## File map

- Create `scripts/inspect-instagram-recording.swift` — print source duration and export inspection frames.
- Create `scripts/build-instagram-media.mjs` — validate six segment definitions and call `avconvert` for each clip.
- Create `scripts/extract-instagram-posters.swift` — export a JPEG poster from each generated clip.
- Create `assets/projects/bt03/segments.json` — store the six measured start times and durations.
- Create `assets/projects/bt03/post-01.jpg` through `post-06.jpg` — lightweight selectors and player posters.
- Create `assets/videos/instagram/post-01.m4v` through `post-06.m4v` — original-audio web clips.
- Create `tests/verify-instagram-photography.mjs` — structural, media, and sound-coordination regression checks.
- Modify `about.html:16` — add the Instagram profile link.
- Modify `site-data.js:11-20` — register `BT03` in the Bonus Track list.
- Modify `project-content.js` after `bt02` — describe the six-post Instagram project.
- Modify `project.js:20-152` — render the focused player and six selectors.
- Modify `project.css` after the current project media rules — style desktop and mobile Instagram layouts.
- Modify `project.html:6,18` — version the changed assets and load the new player code through the existing project bundle.
- Modify `persistent-shell.js:28,182-205,332-345` — fade/pause the soundtrack around video playback and prevent concurrent videos.
- Modify `tests/verify-portfolio-navigation.mjs:29-35` — require `bt03` in navigation data.

## Task 1: Lock the feature contract with failing tests

**Files:**
- Create: `tests/verify-instagram-photography.mjs`
- Modify: `tests/verify-portfolio-navigation.mjs:29-35`

- [ ] **Step 1: Write the feature-level structural test**

Create `tests/verify-instagram-photography.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');

const about = read('about.html');
const data = read('site-data.js');
const content = read('project-content.js');
const project = read('project.js');
const css = read('project.css');
const shell = read('persistent-shell.js');

assert.match(about, /https:\/\/www\.instagram\.com\/carnellzzZ0\.0\//);
assert.match(about, /Instagram · @carnellzzZ0\.0/);
assert.match(data, /id:\s*'bt03'[\s\S]*?side:\s*'bonus'/);
assert.match(content, /bt03:\s*\{[\s\S]*?type:\s*'instagram'/);
assert.equal((content.match(/label:\s*'POST 0[1-6]'/g) || []).length, 6);
assert.match(project, /renderInstagramSpread/);
assert.match(project, /data-instagram-selector/);
assert.match(css, /\.instagram-player/);
assert.match(css, /\.instagram-selector-list/);
assert.match(shell, /fadeMusic/);
assert.match(shell, /pauseOtherVideos/);

for (let index = 1; index <= 6; index += 1) {
  const suffix = String(index).padStart(2, '0');
  const video = resolve(root, `assets/videos/instagram/post-${suffix}.m4v`);
  const poster = resolve(root, `assets/projects/bt03/post-${suffix}.jpg`);
  assert.ok(statSync(video).size > 500_000, `${video} should be a real video`);
  assert.ok(statSync(video).size < 50_000_000, `${video} should remain below 50 MB`);
  assert.ok(statSync(poster).size > 20_000, `${poster} should be a real poster`);
}

console.log('BETWEEN WAVES Instagram photography checks passed');
```

- [ ] **Step 2: Require BT03 in the shared navigation test**

Change the existing ID loop in `tests/verify-portfolio-navigation.mjs` to:

```js
for (const id of ['a01', 'a02', 'a03', 'a04', 'b01', 'b02', 'bt01', 'bt02', 'bt03']) {
  assert.match(data, new RegExp(`id:\\s*['"]${id}['"]`));
}
```

- [ ] **Step 3: Run the tests and confirm the new test fails for missing BT03**

Run:

```bash
node tests/verify-instagram-photography.mjs
node tests/verify-portfolio-navigation.mjs
```

Expected: both commands fail because `bt03` and its media do not exist yet.

- [ ] **Step 4: Commit the failing contract**

```bash
git add tests/verify-instagram-photography.mjs tests/verify-portfolio-navigation.mjs
git commit -m "test: define Instagram photography bonus track"
```

## Task 2: Measure and segment the source recording

**Files:**
- Create: `scripts/inspect-instagram-recording.swift`
- Create: `assets/projects/bt03/segments.json`

- [ ] **Step 1: Create a deterministic inspection-frame exporter**

Create `scripts/inspect-instagram-recording.swift`:

```swift
import AppKit
import AVFoundation

guard CommandLine.arguments.count == 3 else {
  fputs("usage: swift inspect-instagram-recording.swift SOURCE OUTPUT_DIR\n", stderr)
  exit(2)
}

let source = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let asset = AVURLAsset(url: source)
let seconds = CMTimeGetSeconds(asset.duration)
guard seconds.isFinite && seconds > 0 else { fatalError("invalid movie duration") }
print(String(format: "duration=%.3f", seconds))

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

for second in stride(from: 0.0, through: seconds, by: 2.0) {
  let time = CMTime(seconds: second, preferredTimescale: 600)
  let image = try generator.copyCGImage(at: time, actualTime: nil)
  let bitmap = NSBitmapImageRep(cgImage: image)
  guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.78]) else {
    fatalError("could not encode inspection frame")
  }
  let name = String(format: "frame-%06.2f.jpg", second)
  try data.write(to: output.appendingPathComponent(name))
}
```

- [ ] **Step 2: Export frames every two seconds**

Run:

```bash
mkdir -p tmp/instagram-inspection
swift scripts/inspect-instagram-recording.swift "/Users/carnellzhuo/Downloads/ScreenRecording_10-28-2026 01-23-04_1.mov" tmp/instagram-inspection
```

Expected: the command prints one positive duration and creates timestamped JPEG frames.

- [ ] **Step 3: Record the six natural post boundaries**

Inspect the timestamped frames alongside the source movie. Create `assets/projects/bt03/segments.json` with a top-level `source` string containing the absolute source path and a `segments` array containing exactly six ordered objects. Every object must contain the two-digit `id`, measured numeric `start`, and measured numeric `duration`. Each `start` is the first frame of that post; each `duration` ends immediately before the next post begins. Do not commit guessed or evenly spaced values: all twelve numbers must come from the source recording inspection.

- [ ] **Step 4: Validate the measured manifest**

Run:

```bash
node -e "const m=require('./assets/projects/bt03/segments.json'); if(m.segments.length!==6) throw Error('expected six segments'); for(let i=0;i<6;i++){const s=m.segments[i]; if(s.id!==String(i+1).padStart(2,'0')||!(s.start>=0)||!(s.duration>0)) throw Error('invalid segment '+i); if(i&&s.start<m.segments[i-1].start+m.segments[i-1].duration-.05) throw Error('overlap at '+i)} console.log('six measured segments valid')"
```

Expected: `six measured segments valid`.

- [ ] **Step 5: Commit the inspection tools and measured boundaries**

```bash
git add scripts/inspect-instagram-recording.swift assets/projects/bt03/segments.json
git commit -m "chore: map Instagram recording into six posts"
```

## Task 3: Build six web videos and six posters

**Files:**
- Create: `scripts/build-instagram-media.mjs`
- Create: `scripts/extract-instagram-posters.swift`
- Create: `assets/videos/instagram/post-01.m4v` through `post-06.m4v`
- Create: `assets/projects/bt03/post-01.jpg` through `post-06.jpg`

- [ ] **Step 1: Create the media build script**

Create `scripts/build-instagram-media.mjs`:

```js
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/projects/bt03/segments.json'), 'utf8'));
const output = resolve(root, 'assets/videos/instagram');
mkdirSync(output, { recursive: true });

if (manifest.segments.length !== 6) throw new Error('expected six Instagram segments');

for (const segment of manifest.segments) {
  const destination = resolve(output, `post-${segment.id}.m4v`);
  const result = spawnSync('/usr/bin/avconvert', [
    '--source', manifest.source,
    '--preset', 'PresetAppleM4V1080pHD',
    '--output', destination,
    '--start', String(segment.start),
    '--duration', String(segment.duration),
    '--multiPass',
    '--replace',
  ], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`avconvert failed for post ${segment.id}`);
  const bytes = statSync(destination).size;
  if (bytes < 500_000 || bytes >= 50_000_000) throw new Error(`post ${segment.id} has invalid size ${bytes}`);
}
```

- [ ] **Step 2: Create the poster extractor**

Create `scripts/extract-instagram-posters.swift`:

```swift
import AppKit
import AVFoundation

guard CommandLine.arguments.count == 3 else {
  fputs("usage: swift extract-instagram-posters.swift VIDEO_DIR POSTER_DIR\n", stderr)
  exit(2)
}

let videos = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let posters = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: posters, withIntermediateDirectories: true)

for index in 1...6 {
  let id = String(format: "%02d", index)
  let asset = AVURLAsset(url: videos.appendingPathComponent("post-\(id).m4v"))
  let generator = AVAssetImageGenerator(asset: asset)
  generator.appliesPreferredTrackTransform = true
  let image = try generator.copyCGImage(at: CMTime(seconds: 0.6, preferredTimescale: 600), actualTime: nil)
  let bitmap = NSBitmapImageRep(cgImage: image)
  guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.84]) else {
    fatalError("could not encode poster \(id)")
  }
  try data.write(to: posters.appendingPathComponent("post-\(id).jpg"))
}
```

- [ ] **Step 3: Generate the media**

Run:

```bash
node scripts/build-instagram-media.mjs
swift scripts/extract-instagram-posters.swift assets/videos/instagram assets/projects/bt03
```

Expected: six playable M4V files below 50 MB and six non-empty JPEG posters.

- [ ] **Step 4: Listen to every generated clip**

Play all six clips from start to finish. Confirm each begins and ends on its own post, preserves that post's chosen music, has no clipped audio transition, keeps the vertical orientation, and contains no accidental fragment of the next post.

- [ ] **Step 5: Commit generated public media and build tooling**

```bash
git add scripts/build-instagram-media.mjs scripts/extract-instagram-posters.swift assets/videos/instagram assets/projects/bt03/post-*.jpg
git commit -m "feat: add six Instagram post media clips"
```

## Task 4: Register BT03 and the Credits account

**Files:**
- Modify: `about.html:16`
- Modify: `site-data.js:11-20`
- Modify: `project-content.js` after the `bt02` object

- [ ] **Step 1: Add the Instagram contact link**

Append this anchor inside `.contact-links` in `about.html`:

```html
<a href="https://www.instagram.com/carnellzzZ0.0/" target="_blank" rel="noopener noreferrer" aria-label="打开 Carnell 的 Instagram 主页">Instagram · @carnellzzZ0.0 ↗</a>
```

- [ ] **Step 2: Add BT03 to the shared track list**

Append this item after `bt02` in `site-data.js`:

```js
{ id: 'bt03', code: 'BT03', side: 'bonus', title: '手机摄影 / 城市切片', year: '2026', medium: 'SIX POSTS, SIX SONGS', href: 'project.html?track=bt03', sourceImage: 'assets/projects/bt03/post-01.jpg', preview: '用手机保存光线、街道与偶然发生的情绪。每一组画面，都保留它原本选择的音乐。' },
```

- [ ] **Step 3: Add the Instagram project model**

Append this project after `bt02` in `project-content.js`:

```js
bt03: {
  role: '手机摄影 · 视觉记录 · 选曲',
  intro: '六个帖子，六段原声。画面与音乐在这里作为同一份记录被保留下来。',
  blocks: [{
    type: 'instagram',
    eyebrow: 'VISUAL DIARY',
    title: 'Six Posts, Six Songs',
    body: '用手机保存光线、街道与偶然发生的情绪。戴上耳机，选择一段原声记录。',
    continuousLabel: '连续播放六个帖子',
    instagram: 'https://www.instagram.com/carnellzzZ0.0/',
    posts: Array.from({ length: 6 }, (_, index) => {
      const id = String(index + 1).padStart(2, '0');
      return {
        id,
        label: `POST ${id}`,
        song: '原帖选曲',
        src: `assets/videos/instagram/post-${id}.m4v`,
        poster: `assets/projects/bt03/post-${id}.jpg`,
      };
    }),
  }],
},
```

- [ ] **Step 4: Run the navigation tests**

Run:

```bash
node tests/verify-portfolio-navigation.mjs
```

Expected: `BETWEEN WAVES portfolio navigation checks passed`.

- [ ] **Step 5: Commit the account and data model**

```bash
git add about.html site-data.js project-content.js
git commit -m "feat: register Instagram photography bonus track"
```

## Task 5: Render the focused player and selector rail

**Files:**
- Modify: `project.js:20-152`
- Modify: `project.css` after the existing media rules
- Modify: `project.html:6,18`

- [ ] **Step 1: Add the Instagram renderer**

Add `renderInstagramSpread` before the `renderers` map in `project.js`. It must create one `<video>` and six selector buttons, update only the focused video's `src` and `poster`, and keep continuous play off by default:

```js
const renderInstagramSpread = (block) => {
  const section = createSpread('instagram', block);
  const media = section.querySelector('.booklet-spread__media');
  const player = element('div', 'instagram-player');
  const video = element('video');
  const prompt = element('span', 'instagram-player__prompt', '戴上耳机 · 播放原声');
  const selectors = element('div', 'instagram-selector-list');
  const controls = element('div', 'instagram-player__controls');
  const continuous = element('input');
  const continuousText = element('span', '', block.continuousLabel);
  let currentIndex = 0;

  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  const buttons = block.posts.map((post, index) => {
    const button = element('button', 'instagram-selector');
    const image = element('img');
    image.src = post.poster;
    image.alt = '';
    image.loading = 'lazy';
    button.type = 'button';
    button.dataset.instagramSelector = post.id;
    button.setAttribute('aria-label', `选择 ${post.label}`);
    button.append(image, element('b', '', post.label), element('span', '', post.song));
    button.addEventListener('click', () => selectPost(index));
    selectors.append(button);
    return button;
  });

  const selectPost = (index) => {
    currentIndex = index;
    const post = block.posts[index];
    video.pause();
    prompt.hidden = false;
    video.src = post.src;
    video.poster = post.poster;
    video.setAttribute('aria-label', `${post.label} · ${post.song}`);
    video.load();
    buttons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
  };

  continuous.type = 'checkbox';
  continuous.checked = false;
  const continuousLabel = element('label', 'instagram-continuous');
  continuousLabel.append(continuous, continuousText);
  video.addEventListener('play', () => prompt.hidden = true);
  video.addEventListener('ended', () => {
    if (!continuous.checked || currentIndex >= block.posts.length - 1) return;
    selectPost(currentIndex + 1);
    video.play().catch(() => {});
  });
  const instagram = element('a', 'project-source-link', '前往 Instagram 查看完整记录 ↗');
  instagram.href = block.instagram;
  instagram.target = '_blank';
  instagram.rel = 'noopener noreferrer';
  controls.append(continuousLabel, instagram);
  player.append(video, prompt);
  media.append(element('p', 'instagram-intro', block.body), player, selectors, controls);
  selectPost(0);
  return section;
};
```

Update the renderer map to include the new type:

```js
const renderers = {
  text: renderTextSpread,
  video: renderVideoSpread,
  image: renderImageSpread,
  gallery: renderGallerySpread,
  process: renderProcessSpread,
  reflection: renderReflectionSpread,
  instagram: renderInstagramSpread,
};
```

- [ ] **Step 2: Add the desktop and mobile layouts**

Append the following rules to `project.css`:

```css
.booklet-spread--instagram{grid-template-columns:minmax(16rem,.82fr) minmax(0,1.18fr);min-height:48rem}
.booklet-spread--instagram .booklet-spread__media{display:grid;grid-template-columns:minmax(14rem,.9fr) minmax(16rem,1.1fr);gap:1.5rem;align-content:center}
.instagram-intro,.instagram-player__controls{grid-column:1/-1}
.instagram-player{position:relative;align-self:start;max-width:25rem;margin-inline:auto;background:#000;box-shadow:0 28px 70px rgba(0,0,0,.38)}
.instagram-player video{display:block;width:100%;aspect-ratio:9/16;object-fit:contain;background:#000}
.instagram-player__prompt{position:absolute;left:50%;bottom:1.25rem;padding:.7rem 1rem;border:1px solid rgba(244,234,223,.35);border-radius:999px;background:rgba(2,15,25,.78);color:var(--paper);font-size:.62rem;letter-spacing:.12em;transform:translateX(-50%);white-space:nowrap;pointer-events:none}
.instagram-selector-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem;align-content:start}
.instagram-selector{display:grid;grid-template-columns:4.2rem 1fr;gap:.75rem;align-items:center;padding:.6rem;border:1px solid var(--line);background:rgba(244,234,223,.025);color:var(--paper);text-align:left;cursor:pointer}
.instagram-selector[aria-pressed="true"]{border-color:var(--accent);background:rgba(182,154,124,.12)}
.instagram-selector img{grid-row:1/3;width:4.2rem;aspect-ratio:9/16;object-fit:cover}
.instagram-selector b{font-size:.62rem;letter-spacing:.14em}
.instagram-selector span{color:var(--dim);font:400 .72rem/1.4 "Songti SC",STSong,serif}
.instagram-player__controls{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.instagram-continuous{display:inline-flex;align-items:center;gap:.65rem;color:var(--dim);font-size:.68rem;letter-spacing:.08em}
@media(max-width:760px){
  .booklet-spread--instagram{grid-template-columns:1fr;min-height:0}
  .booklet-spread--instagram .booklet-spread__media{display:block;padding-top:0}
  .instagram-player{width:min(100%,24rem)}
  .instagram-selector-list{display:flex;gap:.75rem;margin-top:1.2rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:.8rem}
  .instagram-selector{flex:0 0 9rem;grid-template-columns:3.4rem 1fr;scroll-snap-align:start}
  .instagram-selector img{width:3.4rem}
  .instagram-player__controls{align-items:flex-start;flex-direction:column;margin-top:1rem}
}
```

- [ ] **Step 3: Bump the project asset versions**

In `project.html`, change the project CSS and JS query strings to the date-based version `20261028-1` so GitHub Pages clients do not reuse stale files.

- [ ] **Step 4: Run the structural test**

Run:

```bash
node tests/verify-instagram-photography.mjs
```

Expected: the renderer and media assertions pass; only the pending sound fade assertion may still fail until Task 6.

- [ ] **Step 5: Commit the focused player UI**

```bash
git add project.js project.css project.html
git commit -m "feat: render six-post Instagram listening view"
```

## Task 6: Coordinate original audio with the persistent soundtrack

**Files:**
- Modify: `persistent-shell.js:28,182-205,332-345`

- [ ] **Step 1: Add a cancellable music fade**

Add this state next to `videoActive`:

```js
let volumeAnimationFrame = 0;
let resumeAfterVideo = false;
```

Add this helper before `play`:

```js
const fadeMusic = (target, duration = 420) => new Promise((resolve) => {
  cancelAnimationFrame(volumeAnimationFrame);
  const start = performance.now();
  const from = audio.volume;
  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    audio.volume = from + (target - from) * progress;
    if (progress < 1) volumeAnimationFrame = requestAnimationFrame(step);
    else resolve();
  };
  volumeAnimationFrame = requestAnimationFrame(step);
});
```

- [ ] **Step 2: Pause every other page video when one starts**

Add this helper inside `bindDocument` before registering media events:

```js
const pauseOtherVideos = (activeVideo) => {
  doc.querySelectorAll('video').forEach((video) => {
    if (video !== activeVideo && !video.paused) video.pause();
  });
};
```

- [ ] **Step 3: Replace the generic video listeners with fade-aware listeners**

Replace the current `play`, `pause`, and `ended` document handlers for video elements with:

```js
doc.addEventListener('play', async (event) => {
  if (!(event.target instanceof doc.defaultView.HTMLVideoElement)) return;
  pauseOtherVideos(event.target);
  resumeAfterVideo = !muted && !audio.paused;
  videoActive = true;
  setOcean(false);
  await fadeMusic(0, 420);
  if (videoActive) audio.pause();
  updateUI();
}, true);

const releaseVideo = async (event) => {
  if (!(event.target instanceof doc.defaultView.HTMLVideoElement)) return;
  videoActive = [...doc.querySelectorAll('video')].some((video) => !video.paused && !video.ended);
  if (videoActive || muted || !resumeAfterVideo) return;
  ensureSource();
  audio.volume = 0;
  try { await audio.play(); } catch { return; }
  setOcean(mode === 'continuation');
  await fadeMusic(musicVolume, 420);
  updateUI();
};

doc.addEventListener('pause', releaseVideo, true);
doc.addEventListener('ended', releaseVideo, true);
```

- [ ] **Step 4: Preserve explicit mute behavior**

In `setMuted`, set `resumeAfterVideo = false` whenever `nextMuted` is true. This ensures a user who muted the site does not hear it return after a post:

```js
const setMuted = (nextMuted) => {
  muted = nextMuted;
  if (muted) resumeAfterVideo = false;
  localStorage.setItem(storageKey, String(muted));
  if (muted) pause();
  else play();
};
```

- [ ] **Step 5: Run all JavaScript tests**

Run:

```bash
node tests/verify-instagram-photography.mjs
node tests/verify-portfolio-navigation.mjs
node tests/verify-demo.mjs
node tests/verify-album-interiors.mjs
```

Expected: all commands print their success messages and exit with status 0.

- [ ] **Step 6: Commit soundtrack coordination**

```bash
git add persistent-shell.js
git commit -m "feat: hand off soundtrack to post audio"
```

## Task 7: Browser and device QA

**Files:**
- Modify only if a test exposes a defect in the scoped feature.

- [ ] **Step 1: Serve the static site locally**

Run:

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/bonus.html` and `http://127.0.0.1:8000/project.html?track=bt03`.

- [ ] **Step 2: Verify desktop behavior**

Confirm:

- Bonus Tracks lists three tracks and previews BT03 correctly.
- BT03 shows one vertical player and a 2×3 selector grid.
- Selecting a poster updates the focused player without starting audio.
- Playing a post fades out 《望月者》 and the ocean sound before the post music becomes the only audible source.
- Pausing or ending returns the soundtrack only if it had been playing before.
- Starting another post pauses the previous one.
- Continuous play stays off on first load and advances only when enabled.

- [ ] **Step 3: Verify mobile behavior at 390×844**

Confirm:

- The vertical player fits without horizontal overflow.
- Six selectors form one swipeable row.
- `playsinline` keeps playback inside the page.
- Tapping play is sufficient to start the selected post's original audio.
- Scrolling and switching selectors do not trigger six simultaneous downloads.

- [ ] **Step 4: Verify degraded network and media errors**

Use browser network throttling and temporarily block one `post-*.m4v` request. Confirm the poster remains visible, controls do not break the rest of the page, and the Instagram link remains available.

- [ ] **Step 5: Verify Credits**

Open `about.html`, confirm `Instagram · @carnellzzZ0.0 ↗` uses the same contact typography as the existing links, and verify it opens the correct account in a new tab.

- [ ] **Step 6: Record final file and repository checks**

Run:

```bash
git diff --check
git status --short
find assets/videos/instagram -type f -maxdepth 1 -print -exec stat -f '%z bytes' {} \;
```

Expected: no whitespace errors; only intentional changes are present; all six videos are between 500 KB and 50 MB.

- [ ] **Step 7: Commit any scoped QA fixes**

If QA required a correction, commit only those files:

```bash
git add about.html site-data.js project-content.js project.js project.css project.html persistent-shell.js tests assets/projects/bt03 assets/videos/instagram scripts
git commit -m "fix: finish Instagram photography playback QA"
```

If QA required no correction, do not create an empty commit.
