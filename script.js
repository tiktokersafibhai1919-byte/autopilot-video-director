const videoInput = document.getElementById("videoFiles");
const voiceoverInput = document.getElementById("voiceoverFile");
const canvas = document.getElementById("studioCanvas");
const ctx = canvas.getContext("2d");

let audioCtx = null;
let audioDest = null;

videoInput.addEventListener("change", () => {
    const count = videoInput.files.length;
    document.getElementById("fileCountLabel").innerText =
        count > 0 ? `✅ ${count} clip(s) loaded into Autopilot Timeline` : "No clips selected yet";
});

// 1. Director Instruction Parser
function parseDirectorInstructions(text) {
    const lower = text.toLowerCase();
    let clipDuration = 4.0;
    const secMatch = lower.match(/(\d+(\.\d+)?)\s*s/);
    if (secMatch) {
        clipDuration = Math.max(1.5, Math.min(10, parseFloat(secMatch[1])));
    } else if (lower.includes("fast")) {
        clipDuration = 2.5;
    } else if (lower.includes("slow")) {
        clipDuration = 6.0;
    }

    return {
        clipDuration,
        enableZoom: lower.includes("zoom") || lower.includes("push"),
        enableBass: lower.includes("bass") || lower.includes("boom") || lower.includes("drop"),
        enableWhoosh: lower.includes("whoosh") || lower.includes("transition") || lower.includes("cut"),
        darkGrade: lower.includes("dark") || lower.includes("moody") || lower.includes("cinematic"),
        captionColor: lower.includes("white") ? "#ffffff" : "#facc15",
        showCaptions: !lower.includes("no caption")
    };
}

// 2. Procedural WebAudio SFX Synthesizer
function initAudioEngine() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioDest = audioCtx.createMediaStreamDestination();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function triggerSubBassDrop() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 0.9);

    gain.gain.setValueAtTime(0.75, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.connect(audioDest);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
    setSfxBadge("🔊 Sub-Bass Boom");
}

function triggerWhoosh() {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.45;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2200, audioCtx.currentTime + 0.22);
    filter.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.45);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.45, audioCtx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    gain.connect(audioDest);
    noise.start();
    setSfxBadge("🌬️ Whoosh Cut");
}

function setSfxBadge(label) {
    const badge = document.getElementById("activeSfxBadge");
    badge.innerText = label;
    setTimeout(() => {
        badge.innerText = "🎵 Autopilot Audio Active";
    }, 900);
}

// 3. Caption Text Wrapper & Burner
function drawBurnedCaptions(text, color) {
    if (!text) return;
    ctx.save();
    ctx.font = "900 34px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = text.toUpperCase().split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach(w => {
        if ((currentLine + w).length > 18) {
            lines.push(currentLine.trim());
            currentLine = w + " ";
        } else {
            currentLine += w + " ";
        }
    });
    if (currentLine.trim()) lines.push(currentLine.trim());

    const startY = canvas.height * 0.72 - (lines.length * 22);
    lines.forEach((line, idx) => {
        const y = startY + idx * 44;
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#000000";
        ctx.strokeText(line, canvas.width / 2, y);

        ctx.fillStyle = idx === 0 ? color : "#ffffff";
        ctx.fillText(line, canvas.width / 2, y);
    });
    ctx.restore();
}

// 4. Main Autopilot Timeline Engine
async function runAutopilot(recordExport) {
    const files = Array.from(videoInput.files);
    if (files.length === 0) {
        alert("Please select at least 1 or 2 video clips first!");
        return;
    }

    initAudioEngine();
    const instructions = document.getElementById("directorPrompt").value;
    const rules = parseDirectorInstructions(instructions);

    const rulesBox = document.getElementById("parsedRulesBox");
    rulesBox.classList.remove("hidden");
    rulesBox.innerText = `🤖 Autopilot Plan: ${rules.clipDuration}s/clip | Zoom: ${rules.enableZoom ? "ON" : "OFF"} | Bass SFX: ${rules.enableBass ? "ON" : "OFF"} | Whoosh: ${rules.enableWhoosh ? "ON" : "OFF"}`;

    const statusBox = document.getElementById("statusBox");
    statusBox.innerText = "⏳ Loading clips into 9:16 timeline...";

    // Load Video Elements
    const videoElements = await Promise.all(files.map(file => {
        return new Promise(resolve => {
            const vid = document.createElement("video");
            vid.src = URL.createObjectURL(file);
            vid.muted = true;
            vid.playsInline = true;
            vid.onloadedmetadata = () => resolve(vid);
        });
    }));

    // Optional Voiceover Track
    let voAudio = null;
    if (voiceoverInput.files.length > 0) {
        voAudio = new Audio(URL.createObjectURL(voiceoverInput.files[0]));
        const voSource = audioCtx.createMediaElementSource(voAudio);
        voSource.connect(audioCtx.destination);
        voSource.connect(audioDest);
    }

    // Prepare Script Chunks
    const rawScript = document.getElementById("captionScript").value.trim();
    const scriptWords = rawScript ? rawScript.split(/\s+/) : [];
    const totalDuration = videoElements.length * rules.clipDuration;

    // Setup MediaRecorder if Exporting
    let recorder = null;
    const recordedChunks = [];
    if (recordExport) {
        const canvasStream = canvas.captureStream(30);
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioDest.stream.getAudioTracks()
        ]);
        recorder = new MediaRecorder(combinedStream, { mimeType: "video/webm" });
        recorder.ondataavailable = e => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "autopilot-916-edit.webm";
            a.click();
            statusBox.innerText = "✅ Final Autopilot Video Rendered & Downloaded!";
        };
        recorder.start();
    }

    statusBox.innerText = recordExport
        ? "⏺️ Autopilot Rendering Final Video... Please wait until timeline finishes."
        : "▶️ Playing Autopilot Preview...";

    if (voAudio) voAudio.play();

    let currentClipIdx = -1;
    const startTime = performance.now();

    function renderLoop(now) {
        const elapsed = (now - startTime) / 1000;
        if (elapsed >= totalDuration) {
            videoElements.forEach(v => v.pause());
            if (voAudio) voAudio.pause();
            if (recorder && recorder.state === "recording") recorder.stop();
            if (!recordExport) statusBox.innerText = "✅ Autopilot Preview Complete.";
            document.getElementById("timelineProgress").style.width = "100%";
            return;
        }

        const clipIdx = Math.min(videoElements.length - 1, Math.floor(elapsed / rules.clipDuration));
        const clipLocalTime = elapsed - (clipIdx * rules.clipDuration);

        // Trigger Clip Switch & Procedural SFX
        if (clipIdx !== currentClipIdx) {
            if (currentClipIdx >= 0) videoElements[currentClipIdx].pause();
            currentClipIdx = clipIdx;
            const activeVid = videoElements[currentClipIdx];
            activeVid.currentTime = 0;
            activeVid.play();

            if (clipIdx === 0 && rules.enableBass) {
                triggerSubBassDrop();
            } else if (clipIdx > 0 && rules.enableWhoosh) {
                triggerWhoosh();
            }
        }

        const vid = videoElements[currentClipIdx];

        // Draw Background & Aspect-Fill 9:16 Video
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        if (rules.darkGrade) {
            ctx.filter = "contrast(118%) saturate(112%) brightness(92%)";
        }

        const zoomFactor = rules.enableZoom ? 1 + (clipLocalTime / rules.clipDuration) * 0.12 : 1.0;
        const vidAspect = vid.videoWidth / vid.videoHeight || (9 / 16);
        const canvasAspect = canvas.width / canvas.height;

        let drawW, drawH;
        if (vidAspect > canvasAspect) {
            drawH = canvas.height * zoomFactor;
            drawW = drawH * vidAspect;
        } else {
            drawW = canvas.width * zoomFactor;
            drawH = drawW / vidAspect;
        }

        const drawX = (canvas.width - drawW) / 2;
        const drawY = (canvas.height - drawH) / 2;
        ctx.drawImage(vid, drawX, drawY, drawW, drawH);

        // Flash Transition on Cut
        if (clipLocalTime < 0.15 && clipIdx > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(0.15 - clipLocalTime) * 3.5})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        // Sync & Burn Captions (4 words per chunk)
        if (rules.showCaptions && scriptWords.length > 0) {
            const progressRatio = elapsed / totalDuration;
            const wordCenter = Math.floor(progressRatio * scriptWords.length);
            const chunkStart = Math.floor(wordCenter / 4) * 4;
            const activeChunk = scriptWords.slice(chunkStart, chunkStart + 4).join(" ");
            drawBurnedCaptions(activeChunk, rules.captionColor);
        }

        // Update Timeline UI
        const pct = Math.min(100, (elapsed / totalDuration) * 100);
        document.getElementById("timelineProgress").style.width = `${pct}%`;
        document.getElementById("timeDisplay").innerText =
            `00:${String(Math.floor(elapsed)).padStart(2, "0")} / 00:${String(Math.floor(totalDuration)).padStart(2, "0")}`;

        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
      }
      
