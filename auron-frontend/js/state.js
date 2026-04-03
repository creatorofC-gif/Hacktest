/**
 * AURON — Global State Management
 * Event-driven centralized store with selective re-rendering
 */

const AuronState = (() => {
  // ─── Internal State ───
  const _state = {
    bots: [
      {
        id: 'bot-001',
        name: 'Alpha Scalper',
        type: 'scalper',
        status: 'active',
        pair: 'BTC/USDT',
        side: 'long',
        entryPrice: 67842.50,
        currentPrice: 68125.30,
        pnl: 1284.55,
        pnlPercent: 1.89,
        trades: 47,
        winRate: 72.3,
        uptime: '23h 14m',
        riskScore: 35,
      },
      {
        id: 'bot-002',
        name: 'Beta Swing',
        type: 'swing',
        status: 'active',
        pair: 'ETH/USDT',
        side: 'long',
        entryPrice: 3421.80,
        currentPrice: 3489.20,
        pnl: 892.30,
        pnlPercent: 1.97,
        trades: 12,
        winRate: 66.7,
        uptime: '3d 7h',
        riskScore: 42,
      },
      {
        id: 'bot-003',
        name: 'Gamma Arb',
        type: 'arb',
        status: 'paused',
        pair: 'SOL/USDT',
        side: 'short',
        entryPrice: 178.45,
        currentPrice: 175.80,
        pnl: 312.10,
        pnlPercent: 1.49,
        trades: 89,
        winRate: 81.5,
        uptime: '1d 12h',
        riskScore: 28,
      },
      {
        id: 'bot-004',
        name: 'Delta DCA',
        type: 'dca',
        status: 'active',
        pair: 'ADA/USDT',
        side: 'long',
        entryPrice: 0.645,
        currentPrice: 0.632,
        pnl: -87.40,
        pnlPercent: -2.02,
        trades: 34,
        winRate: 52.9,
        uptime: '5d 2h',
        riskScore: 55,
      },
      {
        id: 'bot-005',
        name: 'Epsilon Grid',
        type: 'scalper',
        status: 'halted',
        pair: 'DOGE/USDT',
        side: 'long',
        entryPrice: 0.185,
        currentPrice: 0.172,
        pnl: -431.20,
        pnlPercent: -7.03,
        trades: 156,
        winRate: 48.1,
        uptime: '0h 0m',
        riskScore: 85,
      },
      {
        id: 'bot-006',
        name: 'Zeta Momentum',
        type: 'swing',
        status: 'active',
        pair: 'AVAX/USDT',
        side: 'short',
        entryPrice: 42.30,
        currentPrice: 40.85,
        pnl: 567.80,
        pnlPercent: 3.43,
        trades: 23,
        winRate: 69.6,
        uptime: '12h 45m',
        riskScore: 38,
      },
    ],
    trades: [
      { id: 't1', botId: 'bot-001', pair: 'BTC/USDT', side: 'long', entry: 67250.00, exit: 67842.50, pnl: 592.50, time: '14:23:05', date: '2026-04-03' },
      { id: 't2', botId: 'bot-002', pair: 'ETH/USDT', side: 'long', entry: 3380.20, exit: 3421.80, pnl: 415.60, time: '13:47:12', date: '2026-04-03' },
      { id: 't3', botId: 'bot-003', pair: 'SOL/USDT', side: 'short', entry: 182.30, exit: 178.45, pnl: 385.00, time: '12:15:30', date: '2026-04-03' },
      { id: 't4', botId: 'bot-001', pair: 'BTC/USDT', side: 'long', entry: 66980.00, exit: 67250.00, pnl: 270.00, time: '11:02:44', date: '2026-04-03' },
      { id: 't5', botId: 'bot-004', pair: 'ADA/USDT', side: 'long', entry: 0.658, exit: 0.645, pnl: -130.00, time: '10:38:19', date: '2026-04-03' },
      { id: 't6', botId: 'bot-006', pair: 'AVAX/USDT', side: 'short', entry: 43.10, exit: 42.30, pnl: 320.00, time: '09:55:01', date: '2026-04-03' },
      { id: 't7', botId: 'bot-005', pair: 'DOGE/USDT', side: 'long', entry: 0.190, exit: 0.185, pnl: -250.00, time: '08:12:33', date: '2026-04-03' },
      { id: 't8', botId: 'bot-002', pair: 'ETH/USDT', side: 'long', entry: 3350.00, exit: 3380.20, pnl: 302.00, time: '07:44:50', date: '2026-04-02' },
    ],
    performance: {
      totalPnl: 2538.15,
      dailyPnl: 1284.55,
      weeklyPnl: 4892.30,
      monthlyPnl: 18450.00,
      totalTrades: 361,
      winRate: 67.3,
      sharpeRatio: 2.14,
      maxDrawdown: -3.8,
      avgTradeTime: '2h 34m',
      bestTrade: 2450.00,
      worstTrade: -890.00,
      profitFactor: 2.45,
      // Time-series data (last 30 days)
      equityCurve: [],
      dailyPnlSeries: [],
    },
    risk: {
      overallRisk: 42,
      riskLevel: 'moderate',
      totalExposure: 125000,
      maxExposure: 300000,
      marginUsed: 45200,
      availableMargin: 154800,
      openPositions: 5,
      maxPositions: 10,
      dailyLossLimit: 5000,
      dailyLossUsed: 518.60,
      alerts: [
        { id: 'a1', level: 'critical', message: 'Bot Epsilon Grid halted — max drawdown exceeded (-7.03%)', time: '2m ago', bot: 'bot-005' },
        { id: 'a2', level: 'warning', message: 'Delta DCA approaching risk threshold (score: 55/100)', time: '15m ago', bot: 'bot-004' },
        { id: 'a3', level: 'warning', message: 'BTC volatility spike detected — 24h vol at 4.2%', time: '28m ago', bot: null },
        { id: 'a4', level: 'info', message: 'Daily PnL target of $1,000 reached', time: '1h ago', bot: null },
        { id: 'a5', level: 'info', message: 'Alpha Scalper win rate above 70% threshold', time: '2h ago', bot: 'bot-001' },
      ],
      limits: [
        { name: 'Total Exposure', current: 125000, max: 300000, unit: '$' },
        { name: 'Daily Loss', current: 518.60, max: 5000, unit: '$' },
        { name: 'Open Positions', current: 5, max: 10, unit: '' },
        { name: 'Single Position Size', current: 35000, max: 50000, unit: '$' },
        { name: 'Leverage Usage', current: 3.2, max: 10, unit: 'x' },
      ],
    },
    connectionStatus: 'connected', // 'connected' | 'disconnected' | 'connecting'
    currentRoute: 'dashboard',
    notifications: 3,
    sidebarCollapsed: false,
  };

  // ─── Event System ───
  const _listeners = {};

  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return () => off(event, callback); // Return unsubscribe function
  }

  function off(event, callback) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(cb => cb !== callback);
  }

  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[State] Error in listener for "${event}":`, err);
      }
    });
  }

  // ─── State Access ───
  function get(path) {
    if (!path) return { ..._state };
    return path.split('.').reduce((obj, key) => obj?.[key], _state);
  }

  function set(path, value) {
    const keys = path.split('.');
    let obj = _state;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    const oldValue = obj[keys[keys.length - 1]];
    obj[keys[keys.length - 1]] = value;

    // Emit specific and general events
    emit(`change:${path}`, { path, value, oldValue });
    emit('stateChange', { path, value, oldValue });
  }

  // ─── Bot Actions ───
  function updateBot(botId, updates) {
    const index = _state.bots.findIndex(b => b.id === botId);
    if (index === -1) return;
    const oldBot = { ..._state.bots[index] };
    _state.bots[index] = { ..._state.bots[index], ...updates };
    emit('change:bots', { bots: _state.bots });
    emit(`bot:${botId}`, { bot: _state.bots[index], oldBot });
  }

  function pauseBot(botId) {
    updateBot(botId, { status: 'paused' });
    emit('bot:action', { action: 'pause', botId });
  }

  function resumeBot(botId) {
    updateBot(botId, { status: 'active' });
    emit('bot:action', { action: 'resume', botId });
  }

  function haltBot(botId) {
    updateBot(botId, { status: 'halted', uptime: '0h 0m' });
    emit('bot:action', { action: 'halt', botId });
  }

  function addBot(bot) {
    const newBot = {
      id: `bot-${String(_state.bots.length + 1).padStart(3, '0')}`,
      status: 'active',
      pnl: 0,
      pnlPercent: 0,
      trades: 0,
      winRate: 0,
      uptime: '0h 0m',
      riskScore: 0,
      ...bot,
    };
    _state.bots.push(newBot);
    emit('change:bots', { bots: _state.bots });
    emit('bot:created', { bot: newBot });
    return newBot;
  }

  // ─── Trade Updates ───
  function addTrade(trade) {
    _state.trades.unshift(trade);
    if (_state.trades.length > 100) _state.trades.pop();
    emit('change:trades', { trades: _state.trades });
  }

  // ─── Risk Updates ───
  function addAlert(alert) {
    _state.risk.alerts.unshift(alert);
    if (_state.risk.alerts.length > 20) _state.risk.alerts.pop();
    _state.notifications++;
    emit('change:risk', { risk: _state.risk });
    emit('change:notifications', { count: _state.notifications });
  }

  // ─── Initialize Performance Data ───
  function _initPerformanceData() {
    // Generate equity curve (30 days)
    let equity = 50000;
    const curve = [];
    const dailyPnls = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const change = (Math.random() - 0.35) * 800;
      equity += change;
      curve.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(equity * 100) / 100,
      });
      dailyPnls.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(change * 100) / 100,
      });
    }
    _state.performance.equityCurve = curve;
    _state.performance.dailyPnlSeries = dailyPnls;
  }

  _initPerformanceData();

  // ─── Public API ───
  return {
    get,
    set,
    on,
    off,
    emit,
    updateBot,
    pauseBot,
    resumeBot,
    haltBot,
    addBot,
    addTrade,
    addAlert,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuronState;
}
