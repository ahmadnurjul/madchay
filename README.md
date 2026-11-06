# A Little Greeting — GitHub Pages starter

A mobile-first, three-screen greeting website with a Three.js bouquet viewer, envelope interaction, letter screen, and audio surprise.

## Included
- Your uploaded parchment background (`assets/images/background.jpg`)
- Your uploaded bouquet reference image (`assets/images/bouquet-reference.jpg`) as a temporary visual fallback
- Flower, letter, and audio screens
- Touch/mouse rotation via Three.js OrbitControls
- Background loop and separate surprise audio player
- Responsive, non-scrolling viewport layout

## Add your files
1. Put your generated 3D model at `assets/models/bouquet.glb`.
2. Put your looping background track at `assets/audio/background.mp3`.
3. Put the surprise song or voice message at `assets/audio/surprise.mp3`.
4. Edit the sample letter in `index.html`.

The site currently displays the bouquet reference image until `bouquet.glb` is added. The envelope is an HTML overlay with a provisional position; it will need a small alignment adjustment after the actual GLB is installed.

## Run locally
For ES modules, use a local web server rather than opening `index.html` directly. For example, with Python installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages
1. Create a GitHub repository and upload the contents of this folder.
2. In repository Settings → Pages, choose **Deploy from a branch**.
3. Select `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to publish the site.

No backend is required. Three.js is loaded from jsDelivr and fonts from Google Fonts, so those resources require an internet connection.

## Notes
- Mobile browsers restrict autoplay. The welcome button is the user gesture that unlocks background audio.
- Keep audio files reasonably compressed for mobile loading.
- The model loader expects `assets/models/bouquet.glb` exactly.
- The envelope is not embedded in the GLB; it is intentionally separate so it can be animated and made clickable.
