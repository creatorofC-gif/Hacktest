/**
 * AURON — Dashboard Module
 * Summary cards, mini charts, recent activity
 */

const DashboardModule = (() => {
  let _chartInstance = null;
  let _unsubscribers = [];

  function render() {
    const container = document.createElement('div');
    container.className = 'module-enter';
    container.innerHTML = buildHTML();

    // Subscribe to state changes
    _unsubscribers.push(
      AuronState.on('change:bots', refreshSummaryCards),
      AuronState.on('change:performance', refreshSummaryCards),
      AuronState.on('change:risk', refreshAlerts),
      AuronState.on('change:trades', refreshRecentTrades),
    );

    // Initialize charts after render
    document.addEventListener('routeRendered', onRouteRendered);
    document.addEventListener('routeCleanup', onRouteCleanup);

    return container;
  }

  function onRouteRendered(e) {
    if (e.detail.route !== 'dashboard') return;
    initMiniChart();
    startCountAnimations();
  }

  function onRouteCleanup(e) {
    if (e.detail.route === 'dashboard') {
      cleanup();
    }
  }

  function buildHTML() {
    const bots = AuronState.get('bots');
    const perf = AuronState.get('performance');
    const risk = AuronState.get('risk');

    const activeBots = bots.filter(b => b.status === 'active').length;
    const totalPnl = perf.totalPnl;
    const systemStatus = risk.overallRisk < 60 ? 'Healthy' : risk.overallRisk < 80 ? 'Warning' : 'Critical';
    const statusColor = risk.overallRisk < 60 ? 'accent' : risk.overallRisk < 80 ? 'warning' : 'danger';

    return `
      <!-- Summary Cards -->
      <div class="summary-grid" id="summary-cards">
        <div class="summary-card">
          <div class="card-header">
            <span class="card-label">Active Bots</span>
            <div class="card-icon accent">🤖</div>
          </div>
          <div class="card-value animate-count" id="active-bots-count">${activeBots}</div>
          <div class="card-change positive">
            <span>↑</span> ${bots.length} total registered
          </div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <span class="card-label">Total P&L</span>
            <div class="card-icon ${totalPnl >= 0 ? 'accent' : 'danger'}">💰</div>
          </div>
          <div class="card-value animate-count ${totalPnl >= 0 ? 'text-accent' : 'text-danger'}" id="total-pnl-count">
            ${totalPnl >= 0 ? '+' : '-'}$${formatNumber(totalPnl)}
          </div>
          <div class="card-change ${perf.dailyPnl >= 0 ? 'positive' : 'negative'}">
            <span>${perf.dailyPnl >= 0 ? '↑' : '↓'}</span> $${formatNumber(Math.abs(perf.dailyPnl))} today
          </div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <span class="card-label">Win Rate</span>
            <div class="card-icon info">📊</div>
          </div>
          <div class="card-value animate-count" id="win-rate-count">${perf.winRate}%</div>
          <div class="card-change positive">
            <span>↑</span> ${perf.totalTrades} total trades
          </div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <span class="card-label">System Status</span>
            <div class="card-icon ${statusColor}">${risk.overallRisk < 60 ? '✅' : risk.overallRisk < 80 ? '⚠️' : '🚨'}</div>
          </div>
          <div class="card-value animate-count text-${statusColor}" id="system-status">${systemStatus}</div>
          <div class="card-change ${statusColor === 'accent' ? 'positive' : 'negative'}">
            Risk Score: ${risk.overallRisk}/100
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Equity Curve Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <span class="chart-title">Equity Curve</span>
            <div class="chart-period-selector">
              <button class="period-btn active" data-period="7d">7D</button>
              <button class="period-btn" data-period="14d">14D</button>
              <button class="period-btn" data-period="30d">30D</button>
            </div>
          </div>
          <div class="chart-body" id="dashboard-chart"></div>
        </div>

        <!-- Bot Overview -->
        <div class="glass-card">
          <div class="section-header" style="margin-bottom: var(--space-md);">
            <span class="section-title">
              <span class="title-dot"></span>
              Bot Overview
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
            ${bots.map(bot => `
              <div class="flex items-center justify-between" style="padding: 8px 12px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
                <div class="flex items-center gap-sm">
                  <span class="bot-status-dot" style="width:8px;height:8px;border-radius:50%;background:${
                    bot.status === 'active' ? 'var(--accent)' : bot.status === 'paused' ? 'var(--warning)' : 'var(--danger)'
                  };${bot.status === 'active' ? 'box-shadow: 0 0 6px var(--accent);' : ''}"></span>
                  <span style="font-size:0.8rem; font-weight:600;">${bot.name}</span>
                </div>
                <span class="text-mono" style="font-size:0.8rem; font-weight:700; color: ${bot.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'};">
                  ${bot.pnl >= 0 ? '+' : '-'}$${formatNumber(bot.pnl)}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Trades -->
        <div class="glass-card full-width" id="recent-trades-section">
          <div class="section-header" style="margin-bottom: var(--space-md);">
            <span class="section-title">
              <span class="title-dot"></span>
              Recent Trades
            </span>
            <button class="btn btn-ghost" onclick="AuronRouter.navigate('trading')">View All →</button>
          </div>
          ${buildTradesTable()}
        </div>
      </div>
    `;
  }

  function buildTradesTable() {
    const trades = AuronState.get('trades').slice(0, 6);
    const bots = AuronState.get('bots');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Bot</th>
            <th>Pair</th>
            <th>Side</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>P&L</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${trades.map(t => {
            const bot = bots.find(b => b.id === t.botId);
            return `
              <tr>
                <td style="color: var(--text-primary); font-weight: 600;">${bot ? bot.name : t.botId}</td>
                <td>${t.pair}</td>
                <td>
                  <span class="bot-trade-side ${t.side}" style="font-size:0.65rem;">${t.side.toUpperCase()}</span>
                </td>
                <td>${formatPrice(t.entry)}</td>
                <td>${formatPrice(t.exit)}</td>
                <td style="color: ${t.pnl >= 0 ? 'var(--accent)' : 'var(--danger)'}; font-weight: 700;">
                  ${t.pnl >= 0 ? '+' : '-'}$${formatNumber(t.pnl)}
                </td>
                <td style="color: var(--text-tertiary);">${t.time}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  function initMiniChart() {
    const chartEl = document.getElementById('dashboard-chart');
    if (!chartEl || typeof Chart === 'undefined') return;

    const data = AuronState.get('performance.equityCurve').slice(-7);

    const ctx = document.createElement('canvas');
    chartEl.appendChild(ctx);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(0, 255, 198, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 255, 198, 0)');

    _chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date.slice(5)),
        datasets: [{
          label: 'Portfolio Value',
          data: data.map(d => d.value),
          borderColor: '#00FFC6',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#00FFC6',
          pointHoverBorderColor: '#0B0F17',
          pointHoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#F1F5F9',
            bodyColor: '#94A3B8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => `$${ctx.parsed.y.toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
            ticks: { color: '#64748B', font: { size: 11, family: 'Inter' } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
            ticks: {
              color: '#64748B',
              font: { size: 11, family: 'JetBrains Mono' },
              callback: (v) => '$' + (v / 1000).toFixed(1) + 'k',
            },
          },
        },
      },
    });

    // Period selector
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const period = e.target.dataset.period;
        const days = parseInt(period);
        updateChartPeriod(days);
      });
    });
  }

  function updateChartPeriod(days) {
    if (!_chartInstance) return;
    const data = AuronState.get('performance.equityCurve').slice(-days);
    _chartInstance.data.labels = data.map(d => d.date.slice(5));
    _chartInstance.data.datasets[0].data = data.map(d => d.value);
    _chartInstance.update('default');
  }

  function startCountAnimations() {
    document.querySelectorAll('.animate-count').forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight; // Force reflow
      el.style.animation = 'countUp 0.5s ease-out forwards';
    });
  }

  function refreshSummaryCards() {
    const container = document.getElementById('summary-cards');
    if (!container) return;

    const bots = AuronState.get('bots');
    const perf = AuronState.get('performance');
    const risk = AuronState.get('risk');

    const activeBots = bots.filter(b => b.status === 'active').length;
    const totalPnl = perf.totalPnl;

    const activeEl = document.getElementById('active-bots-count');
    if (activeEl) activeEl.textContent = activeBots;

    const pnlEl = document.getElementById('total-pnl-count');
    if (pnlEl) {
      pnlEl.textContent = `${totalPnl >= 0 ? '+' : '-'}$${formatNumber(totalPnl)}`;
      pnlEl.className = `card-value text-mono ${totalPnl >= 0 ? 'text-accent' : 'text-danger'}`;
    }
  }

  function refreshAlerts() {
    // Could refresh alerts widget if needed
  }

  function refreshRecentTrades() {
    const section = document.getElementById('recent-trades-section');
    if (!section) return;
    const table = section.querySelector('.data-table');
    if (table) {
      const newHTML = buildTradesTable();
      const temp = document.createElement('div');
      temp.innerHTML = newHTML;
      const newTable = temp.querySelector('.data-table');
      if (newTable) {
        table.replaceWith(newTable);
      }
    }
  }

  function cleanup() {
    _unsubscribers.forEach(unsub => unsub && unsub());
    _unsubscribers = [];
    if (_chartInstance) {
      _chartInstance.destroy();
      _chartInstance = null;
    }
  }

  return { render, cleanup };
})();

// ─── Utility Formatters ───
function formatNumber(num) {
  return Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPrice(price) {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}
