/**
 * App — NeuralExam Main Controller
 * SPA router, exam session manager, and global utilities.
 */

// ─── Exam Controller ──────────────────────────────────────────────────────────
const Exam = (() => {
  let questions = [];
  let answers = {};
  let currentIdx = 0;
  let flagged = new Set();
  let timerInterval = null;
  let thetaChartInstance = null;
  let secondsLeft = 3600;
  let examConfig = {};
  let startTime = null;

  function init(config) {
    examConfig = config;
    secondsLeft = (config.duration || 60) * 60;
    questions = QuestionEngine.selectForExam({ subject: config.subject, count: config.questions || 20 });
    if (!questions.length) questions = QuestionEngine.getAll().slice(0, 10);
    answers = {};
    flagged = new Set();
    currentIdx = 0;
    startTime = Date.now();
    AdaptiveEngine.reset();

    // If adaptive, select first question via engine
    if (config.adaptive) {
      const first = AdaptiveEngine.selectNextQuestion(questions, 0);
      if (first) {
        const idx = questions.indexOf(first);
        if (idx > -1) { questions.splice(idx, 1); questions.unshift(first); }
      }
    }

    renderExamHeader();
    renderQuestionNav();
    showQuestion(0);
    startTimer();
    initThetaChart();

    if (config.proctor) {
      Proctoring.reset();
      Proctoring.start(handleProctoringEvent);
    }
  }

  function renderExamHeader() {
    const nameEl = document.getElementById('exam-header-name');
    const subjectEl = document.getElementById('exam-subject-badge');
    if (nameEl) nameEl.textContent = examConfig.title || 'Exam';
    if (subjectEl) subjectEl.textContent = examConfig.subject || 'General';
  }

  function renderQuestionNav() {
    const grid = document.getElementById('qnav-grid');
    if (!grid) return;
    grid.innerHTML = questions.map((_, i) => `
      <button class="qnav-btn ${i === currentIdx ? 'current' : ''} ${answers[questions[i].id] !== undefined ? 'answered' : ''} ${flagged.has(i) ? 'flagged' : ''}"
        onclick="Exam.jumpTo(${i})">${i + 1}</button>
    `).join('');
  }

  function showQuestion(idx) {
    currentIdx = idx;
    const q = questions[idx];
    if (!q) return;

    document.getElementById('q-number').textContent = 'Q' + (idx + 1);
    document.getElementById('q-bloom').textContent = q.bloom;
    document.getElementById('q-diff').textContent = q.difficulty;
    document.getElementById('q-diff').className = 'diff-badge diff-' + q.difficulty.toLowerCase();
    document.getElementById('q-type').textContent = q.type;
    document.getElementById('q-irt').textContent = `a=${q.irt.a} b=${q.irt.b} c=${q.irt.c}`;
    document.getElementById('question-text').textContent = q.text;

    const answerArea = document.getElementById('answer-area');
    if (q.type === 'MCQ') {
      answerArea.innerHTML = q.options.map((opt, i) => `
        <div class="mcq-option ${answers[q.id] === i ? 'selected' : ''}" onclick="Exam.selectMCQ(${i})">
          <div class="option-letter">${['A', 'B', 'C', 'D'][i]}</div>
          <div class="option-text">${opt}</div>
        </div>
      `).join('');
    } else {
      answerArea.innerHTML = `
        <textarea class="subjective-textarea" id="subj-answer" placeholder="Type your answer here..." oninput="Exam.saveSubjective(this.value)">${answers[q.id] || ''}</textarea>
        <div style="font-size:12px;color:#64748b;margin-top:6px">Rubric criteria: ${q.rubric ? q.rubric.map(r => r.criterion).join(' · ') : 'N/A'}</div>
      `;
    }

    document.getElementById('btn-prev').disabled = idx === 0;
    document.getElementById('btn-next').textContent = idx === questions.length - 1 ? 'Submit' : 'Next';
    if (idx === questions.length - 1) {
      document.getElementById('btn-next').innerHTML = '<i data-lucide="send"></i> Submit';
    } else {
      document.getElementById('btn-next').innerHTML = 'Next <i data-lucide="arrow-right"></i>';
    }
    lucide.createIcons();

    updateProgress();
    renderQuestionNav();
  }

  function selectMCQ(optIdx) {
    const q = questions[currentIdx];
    answers[q.id] = optIdx;
    document.querySelectorAll('.mcq-option').forEach((el, i) => {
      el.classList.toggle('selected', i === optIdx);
      el.querySelector('.option-letter').style.background = i === optIdx ? 'var(--primary)' : '';
      el.querySelector('.option-letter').style.color = i === optIdx ? '#fff' : '';
    });
    renderQuestionNav();

    // Adaptive: record response and update theta
    if (examConfig.adaptive) {
      const isCorrect = optIdx === q.correct;
      const { theta, se } = AdaptiveEngine.recordResponse(q, isCorrect);
      updateAdaptivePanel(theta, se);
    }
  }

  function saveSubjective(val) {
    const q = questions[currentIdx];
    answers[q.id] = val;
    renderQuestionNav();
  }

  function nextQuestion() {
    if (currentIdx === questions.length - 1) { submitExam(); return; }
    showQuestion(currentIdx + 1);
  }

  function prevQuestion() {
    if (currentIdx > 0) showQuestion(currentIdx - 1);
  }

  function jumpTo(idx) { showQuestion(idx); }

  function flagQuestion() {
    if (flagged.has(currentIdx)) flagged.delete(currentIdx);
    else flagged.add(currentIdx);
    renderQuestionNav();
    App.toast(flagged.has(currentIdx) ? 'Question flagged for review' : 'Flag removed', 'info');
  }

  function updateProgress() {
    const answered = Object.keys(answers).length;
    const total = questions.length;
    const pct = total > 0 ? answered / total : 0;
    const circumference = 138.2;
    const offset = circumference - pct * circumference;
    const ring = document.getElementById('ring-fill');
    if (ring) ring.style.strokeDashoffset = offset;
    const label = document.getElementById('ring-label');
    if (label) label.textContent = answered + '/' + total;
    const footer = document.getElementById('exam-footer-info');
    if (footer) footer.textContent = answered === total ? 'All questions answered — ready to submit!' : `${total - answered} question(s) remaining`;
  }

  function updateAdaptivePanel(theta, se) {
    const conf = AdaptiveEngine.getConfidence();
    const info = AdaptiveEngine.getCurrentFisherInfo();
    document.getElementById('adp-theta').textContent = theta.toFixed(3);
    document.getElementById('adp-se').textContent = isFinite(se) ? se.toFixed(3) : '∞';
    document.getElementById('adp-info').textContent = info.toFixed(3);
    document.getElementById('adp-conf').textContent = conf + '%';
    document.getElementById('theta-display').textContent = theta.toFixed(2);

    // Update theta chart
    if (thetaChartInstance) {
      const hist = AdaptiveEngine.getThetaHistory();
      thetaChartInstance.data.labels = hist.map((_, i) => 'Q' + (i + 1));
      thetaChartInstance.data.datasets[0].data = hist;
      thetaChartInstance.update('none');
    }
  }

  function initThetaChart() {
    const ctx = document.getElementById('theta-chart');
    if (!ctx) return;
    if (thetaChartInstance) thetaChartInstance.destroy();
    thetaChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Start'],
        datasets: [{ label: 'θ', data: [0], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#6366f1' }]
      },
      options: {
        responsive: true, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { min: -3, max: 3, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsLeft--;
      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      const el = document.getElementById('exam-timer');
      if (el) {
        el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        if (secondsLeft <= 300) el.style.color = '#ef4444';
        else if (secondsLeft <= 600) el.style.color = '#f59e0b';
        else el.style.color = '';
      }
      if (secondsLeft <= 0) submitExam();
    }, 1000);
  }

  function handleProctoringEvent({ riskScore, incident, warningCount }) {
    if (incident) {
      const alert = document.getElementById('proctor-alert');
      const alertText = document.getElementById('proctor-alert-text');
      if (alert && alertText) {
        alertText.textContent = incident.label + ' — Risk: ' + Math.round(riskScore);
        alert.style.display = 'flex';
        setTimeout(() => { alert.style.display = 'none'; }, 4000);
      }
    }
    if (riskScore >= 90) {
      App.toast('⚠️ High risk detected! Exam may be auto-submitted.', 'warning');
    }
  }

  function dismissAlert() {
    const alert = document.getElementById('proctor-alert');
    if (alert) alert.style.display = 'none';
  }

  function submitExam() {
    if (timerInterval) clearInterval(timerInterval);
    Proctoring.stop();
    const elapsed = Math.round((Date.now() - startTime) / 60000);
    const evalResult = EvaluationEngine.evaluateExam(questions, answers);
    App.showResults(evalResult, examConfig, elapsed, AdaptiveEngine.getThetaHistory());
  }

  return { init, selectMCQ, saveSubjective, nextQuestion, prevQuestion, jumpTo, flagQuestion, submitExam, dismissAlert };
})();

// ─── Main App ─────────────────────────────────────────────────────────────────
const App = (() => {
  let currentRole = 'teacher';
  let resultCharts = {};

  function init() {
    lucide.createIcons();
    goTo('landing');
  }

  function goTo(view, role) {
    if (role) currentRole = role;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');

    if (view === 'teacher') {
      Teacher.switchTab('overview');
    }
    if (view === 'student') {
      Student.renderExamCards();
      Student.switchTab('s-exams');
    }
    lucide.createIcons();
  }

  function setLoginRole(role) {
    currentRole = role;
    document.getElementById('tab-teacher').classList.toggle('active', role === 'teacher');
    document.getElementById('tab-student').classList.toggle('active', role === 'student');
    lucide.createIcons();
  }

  function handleLogin() {
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Sign In';
      btn.disabled = false;
      goTo(currentRole);
      toast('Welcome back! Signed in successfully.', 'success');
    }, 800);
  }

  function startExam(config) {
    goTo('exam');
    setTimeout(() => {
      Exam.init(config);
      lucide.createIcons();
    }, 100);
  }

  function showResults(evalResult, config, elapsed, thetaHistory) {
    goTo('results');
    setTimeout(() => renderResults(evalResult, config, elapsed, thetaHistory), 100);
  }

  function renderResults(evalResult, config, elapsed, thetaHistory) {
    const pct = evalResult.percentage;
    const theta = AdaptiveEngine.getTheta();

    document.getElementById('result-score').textContent = pct + '%';
    document.getElementById('result-title').textContent = pct >= 80 ? '🎉 Excellent Work!' : pct >= 60 ? '👍 Good Effort!' : '📚 Keep Practicing!';
    document.getElementById('result-subtitle').textContent = `You scored ${evalResult.totalScore}/${evalResult.totalMax} — Grade: ${evalResult.grade}`;
    document.getElementById('result-correct').textContent = evalResult.correctCount + ' Correct';
    document.getElementById('result-wrong').textContent = evalResult.wrongCount + ' Wrong';
    document.getElementById('result-theta').textContent = 'θ = ' + theta.toFixed(2);
    document.getElementById('result-time').textContent = elapsed + ' min';

    // Animate score ring
    const ring = document.getElementById('result-ring');
    if (ring) {
      const circumference = 439.8;
      const offset = circumference - (pct / 100) * circumference;
      ring.style.stroke = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
      setTimeout(() => { ring.style.transition = 'stroke-dashoffset 1.5s ease'; ring.style.strokeDashoffset = offset; }, 100);
    }

    // Bloom chart
    const bloomCtx = document.getElementById('result-bloom-chart');
    if (bloomCtx) {
      if (resultCharts.bloom) resultCharts.bloom.destroy();
      const bloomData = evalResult.bloomPerformance;
      const labels = Object.keys(bloomData);
      resultCharts.bloom = new Chart(bloomCtx, {
        type: 'radar',
        data: {
          labels,
          datasets: [{ label: 'Your Score', data: labels.map(l => bloomData[l] || 0), backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', borderWidth: 2, pointBackgroundColor: '#6366f1' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#64748b', font: { size: 9 }, backdropColor: 'transparent' }, pointLabels: { color: '#94a3b8', font: { size: 11 } } } } }
      });
    }

    // Theta progression chart
    const thetaCtx = document.getElementById('result-theta-chart');
    if (thetaCtx && thetaHistory.length) {
      if (resultCharts.theta) resultCharts.theta.destroy();
      resultCharts.theta = new Chart(thetaCtx, {
        type: 'line',
        data: {
          labels: thetaHistory.map((_, i) => 'Q' + (i + 1)),
          datasets: [{ label: 'θ', data: thetaHistory, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#a855f7' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { min: -3, max: 3, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
      });
    }

    // Breakdown list
    const list = document.getElementById('results-breakdown-list');
    if (list) {
      list.innerHTML = evalResult.results.map((r, i) => `
        <div class="breakdown-item">
          <div class="breakdown-icon ${r.correct ? 'correct' : 'wrong'}">
            <i data-lucide="${r.correct ? 'check' : 'x'}"></i>
          </div>
          <div class="breakdown-body">
            <div class="breakdown-q">Q${i + 1}: ${r.question.text.substring(0, 80)}${r.question.text.length > 80 ? '...' : ''}</div>
            <div class="breakdown-meta">
              <span class="bloom-badge" style="font-size:10px">${r.question.bloom}</span>
              <span class="diff-badge diff-${r.question.difficulty.toLowerCase()}" style="font-size:10px">${r.question.difficulty}</span>
              <span>${r.feedback}</span>
            </div>
          </div>
          <div class="breakdown-score" style="color:${r.correct ? '#22c55e' : '#ef4444'}">${r.score}/${r.maxScore}</div>
        </div>
      `).join('');
      lucide.createIcons();
    }
  }

  function openModal(title, body) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('modal').classList.add('active');
    lucide.createIcons();
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('modal').classList.remove('active');
  }

  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    el.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:16px;height:16px;flex-shrink:0"></i>${message}`;
    container.appendChild(el);
    lucide.createIcons();
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
  }

  return { init, goTo, setLoginRole, handleLogin, startExam, showResults, openModal, closeModal, toast };
})();

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
