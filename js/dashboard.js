/**
 * Teacher Dashboard — NeuralExam
 * Manages question bank CRUD, exam builder, analytics charts, and proctoring reports.
 */

const Teacher = (() => {
  let currentTab = 'overview';
  let qPage = 1;
  const qPerPage = 8;
  let filteredQuestions = [];
  let charts = {};

  // ─── Tab Switching ────────────────────────────────────────────────────────────
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#view-teacher .tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#view-teacher .sidebar-item').forEach(el => el.classList.remove('active'));
    const content = document.getElementById('tab-' + tab);
    if (content) content.classList.add('active');
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');

    if (tab === 'overview') renderOverview();
    if (tab === 'questions') renderQuestions();
    if (tab === 'analytics') renderAnalytics();
    if (tab === 'proctoring') renderProctoring();
    if (tab === 'exams') initExamBuilder();
  }

  // ─── Overview ─────────────────────────────────────────────────────────────────
  function renderOverview() {
    renderRecentExams();
    setTimeout(() => {
      renderScoreDistChart();
      renderBloomChart();
    }, 100);
  }

  function renderRecentExams() {
    const exams = [
      { name: 'Midterm — Data Structures', subject: 'CS', students: 42, avg: 74, status: 'Completed' },
      { name: 'Quiz 3 — Algorithms', subject: 'CS', students: 38, avg: 81, status: 'Completed' },
      { name: 'Final — Calculus', subject: 'Math', students: 55, avg: 68, status: 'Active' },
      { name: 'Lab Test — Physics', subject: 'Physics', students: 29, avg: 77, status: 'Scheduled' },
      { name: 'Unit Test — Chemistry', subject: 'Chem', students: 33, avg: 85, status: 'Completed' },
    ];
    const tbody = document.getElementById('recent-exams-body');
    if (!tbody) return;
    tbody.innerHTML = exams.map(e => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td>${e.subject}</td>
        <td>${e.students}</td>
        <td>${e.avg}%</td>
        <td><span class="badge ${e.status === 'Active' ? 'badge-green' : e.status === 'Scheduled' ? 'badge-blue' : 'badge-gray'}">${e.status}</span></td>
        <td><button class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="App.toast('Opening exam report...','info')">View</button></td>
      </tr>
    `).join('');
  }

  function renderScoreDistChart() {
    const ctx = document.getElementById('chart-score-dist');
    if (!ctx) return;
    if (charts.scoreDist) charts.scoreDist.destroy();
    charts.scoreDist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100'],
        datasets: [{
          label: 'Students',
          data: [2, 3, 5, 8, 12, 18, 35, 42, 28, 15],
          backgroundColor: 'rgba(99,102,241,0.6)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true, plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
        }
      }
    });
  }

  function renderBloomChart() {
    const ctx = document.getElementById('chart-bloom');
    if (!ctx) return;
    if (charts.bloom) charts.bloom.destroy();
    charts.bloom = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
        datasets: [{
          data: [18, 22, 25, 18, 10, 7],
          backgroundColor: ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } },
      }
    });
  }

  // ─── Question Bank ────────────────────────────────────────────────────────────
  function renderQuestions() {
    filteredQuestions = QuestionEngine.getAll();
    renderQTable();
  }

  function filterQuestions() {
    const search = document.getElementById('q-search').value.toLowerCase();
    const subject = document.getElementById('q-subject').value;
    const bloom = document.getElementById('q-bloom').value;
    const diff = document.getElementById('q-diff').value;
    filteredQuestions = QuestionEngine.getByFilters({ subject, bloom, difficulty: diff })
      .filter(q => !search || q.text.toLowerCase().includes(search) || q.topic.toLowerCase().includes(search));
    qPage = 1;
    renderQTable();
  }

  function renderQTable() {
    const tbody = document.getElementById('questions-table-body');
    if (!tbody) return;
    const start = (qPage - 1) * qPerPage;
    const page = filteredQuestions.slice(start, start + qPerPage);
    tbody.innerHTML = page.map(q => `
      <tr>
        <td style="max-width:280px"><div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${q.text}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${q.topic}</div></td>
        <td>${q.subject}</td>
        <td><span class="bloom-badge" style="font-size:10px">${q.bloom}</span></td>
        <td><span class="diff-badge diff-${q.difficulty.toLowerCase()}" style="font-size:10px">${q.difficulty}</span></td>
        <td><span class="type-badge" style="font-size:10px">${q.type}</span></td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b">a=${q.irt.a} b=${q.irt.b} c=${q.irt.c}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost" style="padding:4px 8px;font-size:12px" onclick="Teacher.viewQuestion('${q.id}')"><i data-lucide="eye" style="width:12px;height:12px"></i></button>
            <button class="btn btn-ghost" style="padding:4px 8px;font-size:12px" onclick="Teacher.deleteQuestion('${q.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
    renderPagination();
  }

  function renderPagination() {
    const total = Math.ceil(filteredQuestions.length / qPerPage);
    const el = document.getElementById('q-pagination');
    if (!el) return;
    el.innerHTML = Array.from({ length: total }, (_, i) =>
      `<button class="page-btn ${i + 1 === qPage ? 'active' : ''}" onclick="Teacher.goPage(${i + 1})">${i + 1}</button>`
    ).join('');
  }

  function goPage(p) { qPage = p; renderQTable(); }

  function viewQuestion(id) {
    const q = QuestionEngine.getById(id);
    if (!q) return;
    App.openModal('Question Details', `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="bloom-badge">${q.bloom}</span>
          <span class="diff-badge diff-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
          <span class="type-badge">${q.type}</span>
        </div>
        <div style="font-size:15px;font-weight:500;line-height:1.6">${q.text}</div>
        ${q.options ? `<div style="display:flex;flex-direction:column;gap:6px">${q.options.map((o, i) => `<div style="padding:8px 12px;background:${i === q.correct ? 'rgba(34,197,94,0.1)' : 'var(--surface)'};border:1px solid ${i === q.correct ? 'rgba(34,197,94,0.3)' : 'var(--border)'};border-radius:6px;font-size:13px">${['A', 'B', 'C', 'D'][i]}. ${o}</div>`).join('')}</div>` : ''}
        ${q.rubric ? `<div><div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase">Rubric</div>${q.rubric.map(r => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${r.criterion}</span><span style="font-weight:700">${r.maxScore} pts</span></div>`).join('')}</div>` : ''}
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b;padding:8px;background:var(--surface);border-radius:6px">IRT: a=${q.irt.a}, b=${q.irt.b}, c=${q.irt.c}</div>
      </div>
    `);
  }

  function deleteQuestion(id) {
    QuestionEngine.deleteQuestion(id);
    App.toast('Question deleted', 'success');
    filterQuestions();
  }

  function openAddQuestion() {
    App.openModal('Add New Question', `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group"><label>Question Text</label><textarea class="subjective-textarea" id="new-q-text" style="min-height:80px" placeholder="Enter question..."></textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label>Subject</label><select class="form-input" id="new-q-subject">${QuestionEngine.SUBJECTS.map(s => `<option>${s}</option>`).join('')}</select></div>
          <div class="form-group"><label>Type</label><select class="form-input" id="new-q-type"><option>MCQ</option><option>Subjective</option></select></div>
          <div class="form-group"><label>Bloom Level</label><select class="form-input" id="new-q-bloom">${QuestionEngine.BLOOM_LEVELS.map(b => `<option>${b}</option>`).join('')}</select></div>
          <div class="form-group"><label>Difficulty</label><select class="form-input" id="new-q-diff">${QuestionEngine.DIFFICULTIES.map(d => `<option>${d}</option>`).join('')}</select></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="Teacher.saveNewQuestion()"><i data-lucide="plus"></i> Add Question</button>
      </div>
    `);
  }

  function saveNewQuestion() {
    const text = document.getElementById('new-q-text').value.trim();
    if (!text) { App.toast('Please enter question text', 'error'); return; }
    QuestionEngine.addQuestion({
      subject: document.getElementById('new-q-subject').value,
      topic: 'General',
      text,
      type: document.getElementById('new-q-type').value,
      bloom: document.getElementById('new-q-bloom').value,
      difficulty: document.getElementById('new-q-diff').value,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 0,
      tags: [],
    });
    App.closeModal();
    App.toast('Question added to bank!', 'success');
    filterQuestions();
  }

  // ─── Exam Builder ─────────────────────────────────────────────────────────────
  function initExamBuilder() {
    const container = document.getElementById('bloom-weights-container');
    if (!container || container.children.length > 0) return;
    const weights = { Remember: 15, Understand: 20, Apply: 25, Analyze: 20, Evaluate: 12, Create: 8 };
    container.innerHTML = Object.entries(weights).map(([b, w]) => `
      <div class="bloom-weight-row">
        <label>${b}</label>
        <input type="range" class="range-input" min="0" max="50" value="${w}" oninput="this.nextElementSibling.textContent=this.value+'%'" />
        <span class="dist-val">${w}%</span>
      </div>
    `).join('');
  }

  function updateQCount(v) {
    document.getElementById('exam-qcount-display').textContent = v + ' Questions';
  }

  function updateDist() {
    ['easy', 'medium', 'hard'].forEach(d => {
      const val = document.getElementById('dist-' + d).value;
      document.getElementById('dist-' + d + '-val').textContent = val + '%';
    });
  }

  function createExam() {
    const title = document.getElementById('exam-title').value || 'Untitled Exam';
    const subject = document.getElementById('exam-subject').value;
    const count = parseInt(document.getElementById('exam-qcount').value);
    const easy = parseInt(document.getElementById('dist-easy').value);
    const medium = parseInt(document.getElementById('dist-medium').value);
    const hard = parseInt(document.getElementById('dist-hard').value);
    const adaptive = document.getElementById('setting-adaptive').checked;
    const proctor = document.getElementById('setting-proctor').checked;

    const questions = QuestionEngine.selectForExam({ subject, count, easyPct: easy, mediumPct: medium, hardPct: hard });

    const preview = document.getElementById('exam-preview-content');
    preview.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="padding:14px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">${title}</div>
          <div style="font-size:12px;color:#94a3b8">${subject} · ${questions.length} Questions · ${document.getElementById('exam-duration').value} min</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${adaptive ? '<span class="adaptive-badge"><i data-lucide="zap"></i> Adaptive</span>' : ''}
          ${proctor ? '<span class="exam-card-tag proctor">🛡 Proctored</span>' : ''}
        </div>
        <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Questions Preview</div>
        ${questions.slice(0, 5).map((q, i) => `
          <div style="padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
              <span style="font-size:11px;color:#64748b;font-family:'JetBrains Mono',monospace">Q${i + 1}</span>
              <span class="bloom-badge" style="font-size:10px">${q.bloom}</span>
              <span class="diff-badge diff-${q.difficulty.toLowerCase()}" style="font-size:10px">${q.difficulty}</span>
            </div>
            <div style="font-size:13px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${q.text}</div>
          </div>
        `).join('')}
        ${questions.length > 5 ? `<div style="text-align:center;font-size:12px;color:#64748b">+ ${questions.length - 5} more questions</div>` : ''}
        <button class="btn btn-primary btn-full" onclick="Student.startExam(${JSON.stringify({ title, subject, adaptive, proctor, duration: parseInt(document.getElementById('exam-duration').value) }).replace(/"/g, '&quot;')})">
          <i data-lucide="play"></i> Launch Exam
        </button>
      </div>
    `;
    lucide.createIcons();
    App.toast('Exam generated with AI! ' + questions.length + ' questions selected.', 'success');
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────
  function renderAnalytics() {
    setTimeout(() => {
      renderThetaChart();
      renderICCChart();
      renderBloomPerfChart();
      renderTrendChart();
      renderItemAnalysis();
    }, 100);
  }

  function renderThetaChart() {
    const ctx = document.getElementById('chart-theta');
    if (!ctx || charts.theta) return;
    const data = Array.from({ length: 40 }, () => +(Math.random() * 4 - 2).toFixed(2));
    charts.theta = new Chart(ctx, {
      type: 'bar',
      data: { labels: data.map((_, i) => 'S' + (i + 1)), datasets: [{ label: 'θ', data, backgroundColor: data.map(v => v >= 0 ? 'rgba(99,102,241,0.6)' : 'rgba(239,68,68,0.6)'), borderRadius: 3 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } } } }
    });
  }

  function renderICCChart() {
    const ctx = document.getElementById('chart-icc');
    if (!ctx || charts.icc) return;
    const theta = Array.from({ length: 60 }, (_, i) => -3 + i * 0.1);
    const items = [{ a: 0.8, b: -1, c: 0.25, label: 'Easy' }, { a: 1.4, b: 0, c: 0.25, label: 'Medium' }, { a: 2.0, b: 1.5, c: 0.25, label: 'Hard' }];
    const colors = ['#22c55e', '#f59e0b', '#ef4444'];
    charts.icc = new Chart(ctx, {
      type: 'line',
      data: { labels: theta.map(t => t.toFixed(1)), datasets: items.map((it, i) => ({ label: it.label, data: theta.map(t => AdaptiveEngine.irt3PL(t, it.a, it.b, it.c)), borderColor: colors[i], backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.4 })) },
      options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, scales: { x: { ticks: { maxTicksLimit: 7, color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { min: 0, max: 1, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
  }

  function renderBloomPerfChart() {
    const ctx = document.getElementById('chart-bloom-perf');
    if (!ctx || charts.bloomPerf) return;
    charts.bloomPerf = new Chart(ctx, {
      type: 'radar',
      data: { labels: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'], datasets: [{ label: 'Class Avg', data: [82, 75, 68, 61, 55, 48], backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', borderWidth: 2, pointBackgroundColor: '#6366f1' }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#64748b', font: { size: 9 }, backdropColor: 'transparent' }, pointLabels: { color: '#94a3b8', font: { size: 11 } }, min: 0, max: 100 } } }
    });
  }

  function renderTrendChart() {
    const ctx = document.getElementById('chart-trend');
    if (!ctx || charts.trend) return;
    charts.trend = new Chart(ctx, {
      type: 'line',
      data: { labels: ['Exam 1', 'Exam 2', 'Exam 3', 'Exam 4', 'Exam 5', 'Exam 6'], datasets: [{ label: 'Avg Score', data: [68, 72, 70, 75, 74, 81], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 5 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }, y: { min: 50, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } } } }
    });
  }

  function renderItemAnalysis() {
    const tbody = document.getElementById('item-analysis-body');
    if (!tbody) return;
    const questions = QuestionEngine.getAll().slice(0, 10);
    tbody.innerHTML = questions.map(q => {
      const pval = (0.3 + Math.random() * 0.5).toFixed(2);
      const status = q.irt.a > 1.5 ? 'Excellent' : q.irt.a > 1.0 ? 'Good' : 'Review';
      return `<tr>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${q.id}</td>
        <td>${q.irt.b}</td><td>${q.irt.a}</td><td>${q.irt.c}</td><td>${pval}</td>
        <td><span class="badge ${status === 'Excellent' ? 'badge-green' : status === 'Good' ? 'badge-blue' : 'badge-yellow'}">${status}</span></td>
      </tr>`;
    }).join('');
  }

  // ─── Proctoring Report ────────────────────────────────────────────────────────
  function renderProctoring() {
    const tbody = document.getElementById('proctor-table-body');
    if (!tbody) return;
    const incidents = [
      { student: 'Arjun Kumar', exam: 'Midterm DS', risk: 72, incidents: 'Gaze deviation (3x), Audio anomaly', status: 'Flagged' },
      { student: 'Priya Sharma', exam: 'Quiz 3', risk: 15, incidents: 'None', status: 'Clean' },
      { student: 'Rahul Verma', exam: 'Midterm DS', risk: 91, incidents: 'Face absent (2x), Multiple faces', status: 'Terminated' },
      { student: 'Ananya Singh', exam: 'Final Calc', risk: 38, incidents: 'Gaze deviation (1x)', status: 'Warning' },
      { student: 'Karan Patel', exam: 'Quiz 3', risk: 8, incidents: 'None', status: 'Clean' },
      { student: 'Sneha Iyer', exam: 'Midterm DS', risk: 55, incidents: 'Audio anomaly (2x)', status: 'Flagged' },
    ];
    tbody.innerHTML = incidents.map(r => `
      <tr>
        <td><strong>${r.student}</strong></td>
        <td>${r.exam}</td>
        <td><span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${r.risk < 30 ? '#22c55e' : r.risk < 60 ? '#f59e0b' : '#ef4444'}">${r.risk}</span></td>
        <td style="font-size:12px;color:#94a3b8">${r.incidents}</td>
        <td><span class="badge ${r.status === 'Clean' ? 'badge-green' : r.status === 'Warning' ? 'badge-yellow' : r.status === 'Flagged' ? 'badge-red' : 'badge-red'}">${r.status}</span></td>
        <td><button class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="App.toast('Opening session recording...','info')">Review</button></td>
      </tr>
    `).join('');
  }

  return { switchTab, filterQuestions, goPage, viewQuestion, deleteQuestion, openAddQuestion, saveNewQuestion, updateQCount, updateDist, createExam };
})();

// ─── Student Dashboard ────────────────────────────────────────────────────────
const Student = (() => {
  function switchTab(tab) {
    document.querySelectorAll('#view-student .tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#view-student .sidebar-item').forEach(el => el.classList.remove('active'));
    const content = document.getElementById('tab-' + tab);
    if (content) content.classList.add('active');
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
  }

  function renderExamCards() {
    const exams = [
      { id: 'e1', title: 'Midterm Exam — Data Structures', subject: 'Computer Science', duration: 60, questions: 20, adaptive: true, proctor: true, status: 'available', due: 'Feb 20, 2026' },
      { id: 'e2', title: 'Quiz 3 — Algorithms', subject: 'Computer Science', duration: 30, questions: 10, adaptive: true, proctor: false, status: 'available', due: 'Feb 22, 2026' },
      { id: 'e3', title: 'Unit Test — Probability', subject: 'Mathematics', duration: 45, questions: 15, adaptive: false, proctor: true, status: 'scheduled', due: 'Feb 25, 2026' },
      { id: 'e4', title: 'Lab Assessment — Thermodynamics', subject: 'Physics', duration: 90, questions: 25, adaptive: true, proctor: true, status: 'available', due: 'Feb 19, 2026' },
    ];
    const container = document.getElementById('student-exam-cards');
    if (!container) return;
    container.innerHTML = exams.map(e => `
      <div class="exam-card">
        <div class="exam-card-header">
          <div>
            <div class="exam-card-title">${e.title}</div>
            <div class="exam-card-subject">${e.subject}</div>
          </div>
          <span class="badge ${e.status === 'available' ? 'badge-green' : 'badge-blue'}">${e.status === 'available' ? 'Available' : 'Scheduled'}</span>
        </div>
        <div class="exam-card-meta">
          <span><i data-lucide="clock"></i>${e.duration} min</span>
          <span><i data-lucide="file-text"></i>${e.questions} Qs</span>
          <span><i data-lucide="calendar"></i>${e.due}</span>
        </div>
        <div class="exam-card-tags">
          ${e.adaptive ? '<span class="exam-card-tag adaptive"><i data-lucide="zap" style="width:10px;height:10px"></i> Adaptive</span>' : ''}
          ${e.proctor ? '<span class="exam-card-tag proctor">🛡 Proctored</span>' : ''}
        </div>
        ${e.status === 'available' ? `<button class="btn btn-primary btn-full" onclick="Student.startExam({title:'${e.title}',subject:'${e.subject}',adaptive:${e.adaptive},proctor:${e.proctor},duration:${e.duration}})"><i data-lucide="play"></i> Start Exam</button>` : `<button class="btn btn-outline btn-full" disabled>Scheduled</button>`}
      </div>
    `).join('');
    lucide.createIcons();
  }

  function startExam(config) {
    App.startExam(config);
  }

  return { switchTab, renderExamCards, startExam };
})();
