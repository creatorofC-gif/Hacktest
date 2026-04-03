/**
 * AURON — Risk Monitor Module
 */
const RiskModule = (() => {
  let _unsubscribers = [];
  let _gaugeCanvas = null;

  function render() {
    const container = document.createElement('div');
    container.className = 'module-enter';
    container.innerHTML = buildHTML();
    _unsubscribers.push(
      AuronState.on('change:risk', refreshRisk)
    );
    document.addEventListener('routeRendered', onRouteRendered);
    document.addEventListener('routeCleanup', onRouteCleanup);
    return container;
  }

  function onRouteRendered(e) {
    if (e.detail.route !== 'risk') return;
    drawGauge();
  }

  function onRouteCleanup(e) {
    if (e.detail.route === 'risk') cleanup();
  }

  function buildHTML() {
    const risk = AuronState.get('risk');
    return `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-header"><span class="card-label">Risk Score</span><div class="card-icon ${risk.overallRisk<60?'accent':risk.overallRisk<80?'warning':'danger'}">🎯</div></div>
          <div class="card-value ${risk.overallRisk<60?'text-accent':risk.overallRisk<80?'text-warning':'text-danger'}" id="risk-score-val">${risk.overallRisk}/100</div>
          <div class="card-change ${risk.overallRisk<60?'positive':'negative'}">${risk.riskLevel.toUpperCase()}</div>
        </div>
        <div class="summary-card">
          <div class="card-header"><span class="card-label">Total Exposure</span><div class="card-icon info">💼</div></div>
          <div class="card-value" id="exposure-val">$${(risk.totalExposure/1000).toFixed(1)}k</div>
          <div class="card-change">of $${(risk.maxExposure/1000).toFixed(0)}k limit</div>
        </div>
        <div class="summary-card">
          <div class="card-header"><span class="card-label">Open Positions</span><div class="card-icon accent">📊</div></div>
          <div class="card-value">${risk.openPositions}/${risk.maxPositions}</div>
          <div class="card-change positive">${risk.maxPositions - risk.openPositions} slots available</div>
        </div>
        <div class="summary-card">
          <div class="card-header"><span class="card-label">Daily Loss Used</span><div class="card-icon ${risk.dailyLossUsed/risk.dailyLossLimit>0.7?'danger':'warning'}">⚡</div></div>
          <div class="card-value">$${formatNumber(risk.dailyLossUsed)}</div>
          <div class="card-change">${((risk.dailyLossUsed/risk.dailyLossLimit)*100).toFixed(1)}% of $${formatNumber(risk.dailyLossLimit)} limit</div>
        </div>
      </div>

      <div class="dashboard-grid" style="margin-bottom:var(--space-lg);">
        <div class="glass-card">
          <div class="section-header" style="margin-bottom:var(--space-md);"><span class="section-title"><span class="title-dot"></span>Risk Gauge</span></div>
          <div class="risk-gauge-container"><canvas id="risk-gauge" width="280" height="180"></canvas></div>
          <div style="text-align:center;margin-top:var(--space-sm);">
            <span style="font-size:2rem;font-weight:800;font-family:var(--font-mono);color:${riskColor(risk.overallRisk)};" id="gauge-label">${risk.overallRisk}</span>
            <span style="font-size:0.8rem;color:var(--text-tertiary);display:block;margin-top:4px;">Overall Risk Score</span>
          </div>
        </div>

        <div class="glass-card">
          <div class="section-header" style="margin-bottom:var(--space-md);"><span class="section-title"><span class="title-dot"></span>Limits</span></div>
          ${risk.limits.map(l => {
            const pct = (l.current / l.max) * 100;
            const cls = pct > 80 ? 'danger' : pct > 50 ? 'warning' : 'accent';
            return `<div class="limit-item"><div class="limit-header"><span class="limit-name">${l.name}</span><span class="limit-values">${l.unit}${typeof l.current==='number'&&l.current>=1000?(l.current/1000).toFixed(1)+'k':l.current} / ${l.unit}${typeof l.max==='number'&&l.max>=1000?(l.max/1000).toFixed(0)+'k':l.max}</span></div><div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div></div>`;
          }).join('')}
        </div>
      </div>

      <div class="glass-card">
        <div class="section-header" style="margin-bottom:var(--space-md);">
          <span class="section-title"><span class="title-dot"></span>Risk Alerts</span>
          <span style="font-size:0.75rem;color:var(--text-tertiary);">${risk.alerts.length} alerts</span>
        </div>
        <div class="risk-alerts" id="risk-alerts-list">
          ${risk.alerts.map(a => `
            <div class="risk-alert-item level-${a.level}">
              <span class="alert-severity ${a.level}">${a.level}</span>
              <span class="alert-message">${a.message}</span>
              <span class="alert-time">${a.time}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function riskColor(score) {
    if (score < 40) return 'var(--accent)';
    if (score < 60) return 'var(--warning)';
    return 'var(--danger)';
  }

  function drawGauge() {
    const canvas = document.getElementById('risk-gauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const risk = AuronState.get('risk');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h - 10;
    const r = 110;

    ctx.clearRect(0, 0, w, h);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0, false);
    ctx.lineWidth = 18;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    const angle = Math.PI + (risk.overallRisk / 100) * Math.PI;
    const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    gradient.addColorStop(0, '#00FFC6');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF4D4D');

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, angle, false);
    ctx.lineWidth = 18;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle dot
    const nx = cx + r * Math.cos(angle);
    const ny = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(nx, ny, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function refreshRisk() {
    const risk = AuronState.get('risk');
    const scoreEl = document.getElementById('risk-score-val');
    if (scoreEl) scoreEl.textContent = risk.overallRisk + '/100';
    const expEl = document.getElementById('exposure-val');
    if (expEl) expEl.textContent = '$' + (risk.totalExposure / 1000).toFixed(1) + 'k';
    const gaugeLabel = document.getElementById('gauge-label');
    if (gaugeLabel) {
      gaugeLabel.textContent = risk.overallRisk;
      gaugeLabel.style.color = riskColor(risk.overallRisk);
    }
    drawGauge();
  }

  function cleanup() {
    _unsubscribers.forEach(u => u && u());
    _unsubscribers = [];
  }

  return { render, cleanup };
})();
