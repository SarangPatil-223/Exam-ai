/**
 * proctoring.js — AI Proctoring Engine (simulated)
 *
 * Real webcam feed via getUserMedia.
 * Canvas overlay draws a face bounding box, gaze indicator, and scan lines.
 * A simulation loop fires detection events (look-away, multiple faces, audio
 * spike, tab-switch) at realistic intervals and updates the risk score.
 *
 * Production would replace the simulation loop with:
 *   - ArcFace / MediaPipe for face detection & gaze
 *   - YOLOv8 for object / phone detection
 *   - Whisper / WebAudio for audio analysis
 */

// ── Internal state ─────────────────────────────────────────────────────────
let _animFrame = null;   // canvas draw loop id
let _simInterval = null;   // event simulation interval id
let _visHandler = null;   // document visibilitychange listener
let _riskCb = null;   // risk score setter from React
let _currentRisk = 0;

// ── Helpers ────────────────────────────────────────────────────────────────
export function riskColor(score) {
  if (score >= 70) return '#ff6b6b';
  if (score >= 35) return '#FFF57E';
  return '#6AECE1';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function setRisk(delta) {
  _currentRisk = clamp(_currentRisk + delta, 0, 100);
  _riskCb?.(_currentRisk);
}

// ── Canvas Overlay ─────────────────────────────────────────────────────────
function drawOverlay(canvas, video, tick) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width = video.videoWidth || canvas.offsetWidth || 180;
  const H = canvas.height = video.videoHeight || canvas.offsetHeight || 135;

  ctx.clearRect(0, 0, W, H);

  // ── Animated scan line ──
  const scanY = ((tick * 2) % (H + 20)) - 10;
  const grad = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, 'rgba(38,204,194,0.18)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, scanY - 8, W, 16);

  // ── Corner brackets (face region) ──
  const bx = W * 0.2, by = H * 0.1, bw = W * 0.6, bh = H * 0.75;
  const cs = 14; // corner size
  ctx.strokeStyle = 'rgba(38,204,194,0.7)';
  ctx.lineWidth = 2;
  [
    // TL
    [[bx, by + cs], [bx, by], [bx + cs, by]],
    // TR
    [[bx + bw - cs, by], [bx + bw, by], [bx + bw, by + cs]],
    // BL
    [[bx, by + bh - cs], [bx, by + bh], [bx + cs, by + bh]],
    // BR
    [[bx + bw - cs, by + bh], [bx + bw, by + bh], [bx + bw - cs, by + bh]],
  ].forEach(pts => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    ctx.lineTo(...pts[1]);
    ctx.lineTo(...pts[2]);
    ctx.stroke();
  });

  // ── Gaze dot (simulated, slightly drifts) ──
  const gx = W * 0.5 + Math.sin(tick * 0.06) * W * 0.04;
  const gy = H * 0.38 + Math.cos(tick * 0.08) * H * 0.03;
  ctx.beginPath();
  ctx.arc(gx, gy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,245,126,0.85)';
  ctx.fill();

  // ── Status text ──
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(38,204,194,0.8)';
  ctx.fillText(`RISK ${_currentRisk}%`, 6, H - 6);
}

// ── Start ───────────────────────────────────────────────────────────────────
export async function startProctoring(videoEl, canvasEl, setRiskScore) {
  _riskCb = setRiskScore;
  _currentRisk = 0;

  // 1. Get webcam stream
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
  } catch (err) {
    console.warn('[Proctoring] Camera access denied or unavailable:', err.message);
    // Continue without camera — risk simulation still works
  }

  // 2. Canvas draw loop
  let tick = 0;
  function loop() {
    drawOverlay(canvasEl, videoEl, tick++);
    _animFrame = requestAnimationFrame(loop);
  }
  loop();

  // 3. Tab-switch detection (real)
  _visHandler = () => {
    if (document.hidden) {
      setRisk(12);
      console.warn('[Proctoring] Tab switch detected');
    }
  };
  document.addEventListener('visibilitychange', _visHandler);

  // 4. Simulated AI detection events
  const EVENTS = [
    { name: 'gaze_away', weight: 6, prob: 0.15 },
    { name: 'multiple_faces', weight: 18, prob: 0.03 },
    { name: 'no_face', weight: 10, prob: 0.05 },
    { name: 'audio_spike', weight: 8, prob: 0.08 },
    { name: 'phone_detected', weight: 22, prob: 0.02 },
    { name: 'recover', weight: -4, prob: 0.30 }, // gradual recovery
  ];

  _simInterval = setInterval(() => {
    for (const ev of EVENTS) {
      if (Math.random() < ev.prob) {
        setRisk(ev.weight);
        if (ev.weight > 0) {
          console.info(`[Proctoring] Event: ${ev.name} (+${ev.weight})`);
        }
        break;
      }
    }
  }, 2500);

  return stream;
}

// ── Stop ────────────────────────────────────────────────────────────────────
export function stopProctoring(stream) {
  // Cancel animation frame
  if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }

  // Stop simulation
  if (_simInterval) { clearInterval(_simInterval); _simInterval = null; }

  // Remove tab-switch listener
  if (_visHandler) {
    document.removeEventListener('visibilitychange', _visHandler);
    _visHandler = null;
  }

  // Stop camera tracks
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }

  _currentRisk = 0;
  _riskCb = null;
}
