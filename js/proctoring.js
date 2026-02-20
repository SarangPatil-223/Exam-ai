/**
 * Proctoring Engine — NeuralExam
 * Simulates AI proctoring: webcam feed, gaze tracking overlay, risk scoring.
 */

const Proctoring = (() => {
  let stream = null;
  let riskScore = 0;
  let warningCount = 0;
  let intervalId = null;
  let canvasCtx = null;
  let active = false;
  let onRiskUpdate = null;

  // ─── Start Proctoring ────────────────────────────────────────────────────────
  async function start(onUpdate) {
    onRiskUpdate = onUpdate;
    active = true;
    const video = document.getElementById('proctor-video');
    const canvas = document.getElementById('proctor-canvas');

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = stream;
      await new Promise(r => video.onloadedmetadata = r);
      canvas.width = video.videoWidth || 180;
      canvas.height = video.videoHeight || 135;
      canvasCtx = canvas.getContext('2d');
      updateStatus('Monitoring Active', 'ok');
    } catch (e) {
      // Camera not available — show simulated feed
      updateStatus('Simulated Mode', 'ok');
      drawSimulatedFeed(canvas);
    }

    // Start risk simulation loop
    intervalId = setInterval(simulateTick, 2500);
  }

  // ─── Simulated Feed ──────────────────────────────────────────────────────────
  function drawSimulatedFeed(canvas) {
    canvas.width = 180; canvas.height = 135;
    const ctx = canvas.getContext('2d');
    canvasCtx = ctx;
    function draw() {
      if (!active) return;
      ctx.fillStyle = '#0d1120';
      ctx.fillRect(0, 0, 180, 135);
      // Draw face silhouette
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.ellipse(90, 55, 30, 38, 0, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#26CCC2';
      ctx.beginPath(); ctx.arc(78, 48, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(102, 48, 5, 0, Math.PI * 2); ctx.fill();
      // Face box
      ctx.strokeStyle = '#6AECE1';
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 12, 70, 90);
      // Gaze line
      ctx.strokeStyle = 'rgba(38,204,194,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(90, 48); ctx.lineTo(90 + (Math.random() - 0.5) * 20, 48 + (Math.random() - 0.5) * 10); ctx.stroke();
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ─── Draw Overlays ───────────────────────────────────────────────────────────
  function drawOverlay(video, canvas) {
    if (!canvasCtx || !video.videoWidth) return;
    canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Face bounding box
    canvasCtx.strokeStyle = '#6AECE1';
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeRect(canvas.width * 0.25, canvas.height * 0.1, canvas.width * 0.5, canvas.height * 0.75);
    // Gaze dot
    canvasCtx.fillStyle = 'rgba(38,204,194,0.8)';
    canvasCtx.beginPath();
    canvasCtx.arc(canvas.width / 2 + (Math.random() - 0.5) * 20, canvas.height / 2 + (Math.random() - 0.5) * 15, 4, 0, Math.PI * 2);
    canvasCtx.fill();
  }

  // ─── Risk Simulation ─────────────────────────────────────────────────────────
  function simulateTick() {
    if (!active) return;
    const video = document.getElementById('proctor-video');
    const canvas = document.getElementById('proctor-canvas');
    if (video && video.srcObject && canvasCtx) drawOverlay(video, canvas);

    // Simulate risk events
    const event = Math.random();
    let delta = 0;
    let incident = null;

    if (event < 0.05) {
      delta = 25 + Math.random() * 15;
      incident = { type: 'face_absent', label: 'Face not detected', severity: 'high' };
    } else if (event < 0.12) {
      delta = 15 + Math.random() * 10;
      incident = { type: 'gaze_away', label: 'Gaze deviation detected', severity: 'medium' };
    } else if (event < 0.18) {
      delta = 10 + Math.random() * 8;
      incident = { type: 'multiple_faces', label: 'Multiple faces detected', severity: 'high' };
    } else if (event < 0.22) {
      delta = 8 + Math.random() * 5;
      incident = { type: 'audio_anomaly', label: 'Audio anomaly detected', severity: 'low' };
    } else {
      delta = -(2 + Math.random() * 3); // Natural decay
    }

    riskScore = Math.max(0, Math.min(100, riskScore + delta));
    if (incident) warningCount++;

    updateRiskUI(riskScore);
    if (onRiskUpdate) onRiskUpdate({ riskScore, incident, warningCount });
  }

  function updateRiskUI(score) {
    const display = document.getElementById('risk-score-display');
    const bar = document.getElementById('risk-bar-fill');
    const dot = document.getElementById('proctor-dot');
    if (!display) return;

    display.textContent = Math.round(score);
    if (bar) {
      bar.style.width = score + '%';
      bar.style.background = score < 30 ? '#6AECE1' : score < 60 ? '#FFF57E' : '#ff6b6b';
    }
    if (dot) {
      dot.className = 'proctor-dot' + (score >= 60 ? ' danger' : score >= 30 ? ' warning' : '');
    }
    if (display) {
      display.style.color = score < 30 ? '#6AECE1' : score < 60 ? '#FFF57E' : '#ff6b6b';
    }
  }

  function updateStatus(text, level) {
    const el = document.getElementById('proctor-status-text');
    if (el) el.textContent = text;
  }

  function stop() {
    active = false;
    if (intervalId) clearInterval(intervalId);
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  }

  function getRiskScore() { return riskScore; }
  function getWarningCount() { return warningCount; }
  function reset() { riskScore = 0; warningCount = 0; }

  return { start, stop, getRiskScore, getWarningCount, reset };
})();
