# 🎬 Autopilot 9:16 Video Director

An instruction-driven, zero-cost browser-based vertical video editor with a built-in **WebAudio Procedural SFX Engine**, automated timeline assembly, and real-time bold caption burning for short-form creators.

🔗 **Live Web Studio:** [Launch Autopilot 9:16 Video Director](https://tiktokersafibhai1919-byte.github.io/autopilot-video-director/)

## 🚀 Overview
Editing vertical videos on mobile often requires manual timeline trimming, searching for sound effects, and syncing captions. **Autopilot 9:16 Video Director** turns natural text instructions (e.g., *"Fast 3.5s cuts, dramatic zoom, deep bass drop, whoosh transitions, bold yellow captions"*) into an automated editing timeline rendered 100% locally in the browser via HTML5 `<canvas>` and `MediaRecorder`.

## ✨ Key Capabilities
* **Natural Instruction Parser:** Converts plain-text editing cues into cut durations, Ken-Burns zoom curves, color grading filters, and caption styles.
* **WebAudio Procedural SFX Synthesizer:** Generates real-time **Sub-Bass Drops** and **Bandpass-Filtered Whoosh Transitions** directly in the browser without external `.mp3` dependencies.
* **Auto-Burned Hormozi-Style Captions:** Splits voiceover scripts into punchy 4-word chunks and burns high-contrast shadowed text onto the 9:16 video canvas.
* **Client-Side Video Export:** Captures synchronized 30fps canvas video and synthesized/voiceover audio streams into a downloadable `.webm` file.

## 🛠️ Tech Stack
* **Rendering Engine:** HTML5 `<canvas>` (540×960 9:16 Vertical Pipeline)
* **Audio Synthesis:** Web Audio API (`OscillatorNode`, `BiquadFilterNode`, `MediaStreamAudioDestinationNode`)
* **Video Recording:** Browser `MediaRecorder` API
* **Deployment:** GitHub Pages

## 📂 Project Structure
```text
autopilot-video-director/
├── index.html      # Studio workspace & 9:16 live monitor
├── style.css       # Responsive dark-theme studio layout
├── script.js       # Instruction parser, WebAudio SFX engine & canvas renderer
└── README.md       # Documentation
