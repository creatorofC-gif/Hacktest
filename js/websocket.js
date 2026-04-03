/**
 * AURON — WebSocket Communication Layer
 * Handles real-time data with graceful fallback simulation
 */

const AuronWS = (() => {
  let _ws = null;
  let _reconnectAttempts = 0;
  let _maxReconnectAttempts = 0; // Disable reconnection for local preview to avoid UI bouncing
  let _reconnectTimer = null;
  let _simulationTimer = null;
  let _isSimulating = false;

  const WS_URL = 'ws://localhost:8080';

  function connect() {
    if (_maxReconnectAttempts === 0) {
      console.log('[WS] Local preview mode — skipping real connection, starting simulation');
      startSimulation();
      return;
    }
    AuronState.set('connectionStatus', 'connecting');

    try {
      _ws = new WebSocket(WS_URL);

      _ws.onopen = () => {
        console.log('[WS] Connected to', WS_URL);
        _reconnectAttempts = 0;
        AuronState.set('connectionStatus', 'connected');
        stopSimulation();
      };

      _ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      _ws.onclose = (event) => {
        console.log('[WS] Connection closed, code:', event.code);
        handleDisconnect();
      };

      _ws.onerror = (error) => {
        console.warn('[WS] Connection error — falling back to simulation mode');
        handleDisconnect();
      };
    } catch (err) {
      console.warn('[WS] Cannot connect — starting simulation mode');
      handleDisconnect();
    }
  }

  function handleDisconnect() {
    AuronState.set('connectionStatus', 'disconnected');
    _ws = null;

    if (_reconnectAttempts < _maxReconnectAttempts) {
      _reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, _reconnectAttempts), 10000);
      console.log(`[WS] Reconnecting in ${delay / 1000}s (attempt ${_reconnectAttempts}/${_maxReconnectAttempts})`);
      _reconnectTimer = setTimeout(connect, delay);
    } else {
      console.log('[WS] Max reconnect attempts reached — running in simulation mode');
      startSimulation();
    }
  }

  function handleMessage(data) {
    switch (data.type) {
      case 'bot_update':
        if (data.botId && data.updates) {
          AuronState.updateBot(data.botId, data.updates);
        }
        break;
      case 'trade':
        if (data.trade) {
          AuronState.addTrade(data.trade);
        }
        break;
      case 'risk_alert':
        if (data.alert) {
          AuronState.addAlert(data.alert);
        }
        break;
      case 'performance_update':
        if (data.performance) {
          const current = AuronState.get('performance');
          AuronState.set('performance', { ...current, ...data.performance });
        }
        break;
      case 'connection_status':
        AuronState.set('connectionStatus', data.status);
        break;
      default:
        console.log('[WS] Unknown message type:', data.type);
    }
  }

  // ─── Simulation Mode ───
  // Provides realistic data updates when no WebSocket server is available

  function startSimulation() {
    if (_isSimulating) return;
    _isSimulating = true;
    AuronState.set('connectionStatus', 'connected');
    console.log('[WS] Simulation mode active — generating live data');

    _simulationTimer = setInterval(() => {
      simulateTick();
    }, 2500);
  }

  function stopSimulation() {
    if (_simulationTimer) {
      clearInterval(_simulationTimer);
      _simulationTimer = null;
    }
    _isSimulating = false;
  }

  function simulateTick() {
    const bots = AuronState.get('bots');

    bots.forEach(bot => {
      if (bot.status !== 'active') return;

      // Simulate price fluctuation
      const priceChange = (Math.random() - 0.48) * (bot.currentPrice * 0.002);
      const newPrice = +(bot.currentPrice + priceChange).toFixed(
        bot.currentPrice > 100 ? 2 : bot.currentPrice > 1 ? 4 : 6
      );

      // Recalculate PnL
      const direction = bot.side === 'long' ? 1 : -1;
      const priceDiff = (newPrice - bot.entryPrice) * direction;
      const basePnl = bot.pnl + (priceChange * direction * (Math.random() * 5 + 1));
      const newPnl = +(basePnl).toFixed(2);
      const newPnlPercent = +(((newPrice - bot.entryPrice) / bot.entryPrice) * 100 * direction).toFixed(2);

      AuronState.updateBot(bot.id, {
        currentPrice: newPrice,
        pnl: newPnl,
        pnlPercent: newPnlPercent,
      });
    });

    // Occasionally add a simulated trade
    if (Math.random() < 0.12) {
      const activeBots = bots.filter(b => b.status === 'active');
      if (activeBots.length > 0) {
        const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
        const pnl = +((Math.random() - 0.4) * 500).toFixed(2);
        const time = new Date();
        AuronState.addTrade({
          id: `t-${Date.now()}`,
          botId: bot.id,
          pair: bot.pair,
          side: Math.random() > 0.5 ? 'long' : 'short',
          entry: bot.entryPrice,
          exit: bot.currentPrice,
          pnl,
          time: time.toTimeString().split(' ')[0],
          date: time.toISOString().split('T')[0],
        });

        // Update trade count
        AuronState.updateBot(bot.id, {
          trades: bot.trades + 1,
        });
      }
    }

    // Occasionally update risk metrics
    if (Math.random() < 0.08) {
      const risk = AuronState.get('risk');
      const newExposure = Math.max(50000, Math.min(280000, risk.totalExposure + (Math.random() - 0.5) * 5000));
      AuronState.set('risk', {
        ...risk,
        totalExposure: Math.round(newExposure),
        overallRisk: Math.min(100, Math.max(10, risk.overallRisk + Math.round((Math.random() - 0.5) * 4))),
      });
    }

    // Update performance
    if (Math.random() < 0.15) {
      const perf = AuronState.get('performance');
      const pnlDelta = (Math.random() - 0.4) * 100;
      AuronState.set('performance', {
        ...perf,
        totalPnl: +(perf.totalPnl + pnlDelta).toFixed(2),
        dailyPnl: +(perf.dailyPnl + pnlDelta * 0.3).toFixed(2),
      });
    }
  }

  function send(data) {
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Not connected — message queued for simulation');
      // In simulation mode, handle commands locally
      handleMessage(data);
    }
  }

  function disconnect() {
    stopSimulation();
    if (_reconnectTimer) clearTimeout(_reconnectTimer);
    if (_ws) {
      _ws.close();
      _ws = null;
    }
    AuronState.set('connectionStatus', 'disconnected');
  }

  function getStatus() {
    return AuronState.get('connectionStatus');
  }

  // ─── Public API ───
  return {
    connect,
    disconnect,
    send,
    getStatus,
    startSimulation,
    stopSimulation,
  };
})();
