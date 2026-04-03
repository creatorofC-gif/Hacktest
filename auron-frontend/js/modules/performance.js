/**
 * AURON — Performance Module
 */
const PerformanceModule = (() => {
  let _equityChart = null;
  let _dailyPnlChart = null;
  let _unsubscribers = [];

  function render() {
    const container = document.createElement('div');
    container.className = 'module-enter';
    container.innerHTML = buildHTML();
    _unsubscribers.push(
      AuronState.on('change:performance', refreshMetrics),
      AuronState.on('change:trades', refreshTradeHistory),
    );
    document.addEventListener('routeRendered', onRouteRendered);
    document.addEventListener('routeCleanup', onRouteCleanup);
    return container;
  }

  function onRouteRendered(e) {
    if (e.detail.route !== 'performance') return;
    initCharts();
  }

  function onRouteCleanup(e) {
    if (e.detail.route === 'performance') {
      cleanup();
    }
  }

  function buildHTML() {
    const perf = AuronState.get('performance');
    const trades = AuronState.get('trades');
    const bots = [...AuronState.get('bots')].sort((a, b) => b.pnl - a.pnl);

    return `
      <div class="metrics-grid" id="perf-metrics">
        ${metricCard('Total P&L', (perf.totalPnl >= 0 ? '+$' : '-$') + formatNumber(perf.totalPnl), perf.totalPnl >= 0)}
        ${metricCard('Daily P&L', (perf.dailyPnl >= 0 ? '+$' : '-$') + formatNumber(perf.dailyPnl), perf.dailyPnl >= 0)}
        ${metricCard('Weekly P&L', (perf.weeklyPnl >= 0 ? '+$' : '-$') + formatNumber(perf.weeklyPnl), perf.weeklyPnl >= 0)}
        ${metricCard('Monthly P&L', (perf.monthlyPnl >= 0 ? '+$' : '-$') + formatNumber(perf.monthlyPnl), perf.monthlyPnl >= 0)}
        ${metricCard('Win Rate', perf.winRate + '%', perf.winRate >= 50)}
        ${metricCard('Sharpe Ratio', perf.sharpeRatio.toFixed(2), perf.sharpeRatio >= 1)}
        ${metricCard('Max Drawdown', perf.maxDrawdown + '%', false)}
        ${metricCard('Profit Factor', perf.profitFactor.toFixed(2), perf.profitFactor >= 1)}
      </div>
      <div class="dashboard-grid" style="margin-bottom:var(--space-lg);">
        <div class="chart-container">
          <div class="chart-header">
            <span class="chart-title">Portfolio Equity Curve</span>
            <div class="chart-period-selector">
              <button class="period-btn" onclick="PerformanceModule.changePeriod(7,this)">7D</button>
              <button class="period-btn" onclick="PerformanceModule.changePeriod(14,this)">14D</button>
              <button class="period-btn active" onclick="PerformanceModule.changePeriod(30,this)">30D</button>
            </div>
          </div>
          <div class="chart-body" id="equity-curve-chart"></div>
        </div>
        <div class="chart-container">
          <div class="chart-header"><span class="chart-title">Daily P&L</span></div>
          <div class="chart-body" id="daily-pnl-chart"></div>
        </div>
      </div>
      <div class="dashboard-grid" style="margin-bottom:var(--space-lg);">
        <div class="glass-card">
          <div class="section-header" style="margin-bottom:var(--space-md);">
            <span class="section-title"><span class="title-dot"></span>Performance Breakdown</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-md);">
            ${statRow('Total Trades', perf.totalTrades)}
            ${statRow('Best Trade', '+$' + formatNumber(perf.bestTrade), 'text-accent')}
            ${statRow('Worst Trade', '-$' + formatNumber(Math.abs(perf.worstTrade)), 'text-danger')}
            ${statRow('Avg Duration', perf.avgTradeTime)}
            ${statRow('Profit Factor', perf.profitFactor + 'x', 'text-accent')}
          </div>
        </div>
        <div class="glass-card">
          <div class="section-header" style="margin-bottom:var(--space-md);">
            <span class="section-title"><span class="title-dot"></span>Bot Rankings</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
            ${bots.map((b, i) => `
              <div class="flex items-center justify-between" style="padding:8px 12px;background:rgba(0,0,0,0.2);border-radius:var(--radius-md);">
                <div class="flex items-center gap-sm">
                  <span style="font-size:0.75rem;font-weight:800;color:${i < 3 ? 'var(--accent)' : 'var(--text-muted)'};width:20px;">#${i+1}</span>
                  <span style="font-size:0.8rem;font-weight:600;">${b.name}</span>
                </div>
                <span class="text-mono font-bold" style="font-size:0.85rem;color:${b.pnl>=0?'var(--accent)':'var(--danger)'};">${b.pnl>=0?'+':'-'}$${formatNumber(b.pnl)}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="glass-card">
        <div class="section-header" style="margin-bottom:var(--space-md);">
          <span class="section-title"><span class="title-dot"></span>Trade History</span>
        </div>
        <div id="trade-history-table">${buildTradeTable(trades)}</div>
      </div>`;
  }

  function metricCard(label, value, positive) {
    const cls = label.includes('Drawdown') ? 'text-danger' : (positive ? 'text-accent' : 'text-danger');
    return `<div class="metric-card"><div class="metric-label">${label}</div><div class="metric-value ${cls}">${value}</div></div>`;
  }

  function statRow(label, value, cls='') {
    return `<div class="flex items-center justify-between" style="padding-bottom:var(--space-sm);border-bottom:1px solid var(--border-subtle);"><span style="font-size:0.8rem;color:var(--text-secondary);">${label}</span><span class="text-mono font-bold ${cls}" style="font-size:0.9rem;">${value}</span></div>`;
  }

  function buildTradeTable(trades) {
    const bots = AuronState.get('bots');
    return `<table class="data-table"><thead><tr><th>Date</th><th>Bot</th><th>Pair</th><th>Side</th><th>Entry</th><th>Exit</th><th>P&L</th></tr></thead><tbody>${trades.map(t => {
      const bot = bots.find(b => b.id === t.botId);
      return `<tr><td style="color:var(--text-tertiary);">${t.date}</td><td style="color:var(--text-primary);font-weight:600;">${bot?bot.name:t.botId}</td><td>${t.pair}</td><td><span class="bot-trade-side ${t.side}" style="font-size:0.65rem;">${t.side.toUpperCase()}</span></td><td>${formatPrice(t.entry)}</td><td>${formatPrice(t.exit)}</td><td style="color:${t.pnl>=0?'var(--accent)':'var(--danger)'};font-weight:700;">${t.pnl>=0?'+':'-'}$${formatNumber(t.pnl)}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  function initCharts() { initEquityCurve(30); initDailyPnl(); }

  function initEquityCurve(days) {
    const el = document.getElementById('equity-curve-chart');
    if (!el || typeof Chart === 'undefined') return;
    if (_equityChart) _equityChart.destroy();
    const data = AuronState.get('performance.equityCurve').slice(-days);
    const ctx = document.createElement('canvas'); el.innerHTML=''; el.appendChild(ctx);
    const gr = ctx.getContext('2d').createLinearGradient(0,0,0,280);
    gr.addColorStop(0,'rgba(0,255,198,0.12)'); gr.addColorStop(1,'rgba(0,255,198,0)');
    _equityChart = new Chart(ctx, {type:'line',data:{labels:data.map(d=>d.date.slice(5)),datasets:[{data:data.map(d=>d.value),borderColor:'#00FFC6',backgroundColor:gr,borderWidth:2,fill:true,tension:0.4,pointRadius:0,pointHoverRadius:5,pointHoverBackgroundColor:'#00FFC6'}]},options:chartOpts()});
  }

  function initDailyPnl() {
    const el = document.getElementById('daily-pnl-chart');
    if (!el || typeof Chart === 'undefined') return;
    if (_dailyPnlChart) _dailyPnlChart.destroy();
    const data = AuronState.get('performance.dailyPnlSeries').slice(-14);
    const ctx = document.createElement('canvas'); el.innerHTML=''; el.appendChild(ctx);
    _dailyPnlChart = new Chart(ctx, {type:'bar',data:{labels:data.map(d=>d.date.slice(5)),datasets:[{data:data.map(d=>d.value),backgroundColor:data.map(d=>d.value>=0?'rgba(0,255,198,0.5)':'rgba(255,77,77,0.5)'),borderColor:data.map(d=>d.value>=0?'#00FFC6':'#FF4D4D'),borderWidth:1,borderRadius:4}]},options:chartOpts()});
  }

  function chartOpts() {
    return {responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#1f2937',titleColor:'#F1F5F9',bodyColor:'#94A3B8',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,padding:12,cornerRadius:8}},scales:{x:{grid:{color:'rgba(255,255,255,0.03)',drawBorder:false},ticks:{color:'#64748B',font:{size:10}}},y:{grid:{color:'rgba(255,255,255,0.03)',drawBorder:false},ticks:{color:'#64748B',font:{size:10,family:'JetBrains Mono'}}}}};
  }

  function changePeriod(days, btn) {
    document.querySelectorAll('.chart-period-selector .period-btn').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    initEquityCurve(days);
  }

  function refreshMetrics() {
    const perf = AuronState.get('performance');
    const vals = document.querySelectorAll('#perf-metrics .metric-value');
    if(vals[0]) vals[0].textContent = (perf.totalPnl >= 0 ? '+$' : '-$') + formatNumber(perf.totalPnl);
    if(vals[1]) vals[1].textContent = (perf.dailyPnl >= 0 ? '+$' : '-$') + formatNumber(perf.dailyPnl);
  }

  function refreshTradeHistory() {
    const c = document.getElementById('trade-history-table');
    if(c) c.innerHTML = buildTradeTable(AuronState.get('trades'));
  }

  function cleanup() {
    _unsubscribers.forEach(u=>u&&u()); _unsubscribers=[];
    if(_equityChart){_equityChart.destroy();_equityChart=null;}
    if(_dailyPnlChart){_dailyPnlChart.destroy();_dailyPnlChart=null;}
  }

  return { render, cleanup, changePeriod };
})();
