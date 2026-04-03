/**
 * AURON — Live Trading Module (CRITICAL)
 * Bot grid with real-time status, controls, and create-bot flow
 */

const TradingModule = (() => {
  let _unsubscribers = [];
  let _confirmModal = null;

  function render() {
    const container = document.createElement('div');
    container.className = 'module-enter';
    container.innerHTML = buildHTML();

    _unsubscribers.push(
      AuronState.on('change:bots', refreshBotGrid)
    );

    document.addEventListener('routeRendered', onRouteRendered);
    document.addEventListener('routeCleanup', onRouteCleanup);
    return container;
  }

  function onRouteRendered(e) {
    if (e.detail.route !== 'trading') return;
    attachEventListeners();
  }

  function onRouteCleanup(e) {
    if (e.detail.route === 'trading') cleanup();
  }

  function buildHTML() {
    const bots = AuronState.get('bots');

    return `
      <!-- Controls Bar -->
      <div class="section-header">
        <span class="section-title">
          <span class="title-dot"></span>
          Active Trading Bots
        </span>
        <div class="section-actions">
          <button class="btn btn-secondary" id="filter-all-btn" data-filter="all">All (${bots.length})</button>
          <button class="btn btn-ghost" id="filter-active-btn" data-filter="active">Active (${bots.filter(b => b.status === 'active').length})</button>
          <button class="btn btn-ghost" id="filter-paused-btn" data-filter="paused">Paused (${bots.filter(b => b.status === 'paused').length})</button>
          <button class="btn btn-primary" id="create-bot-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Bot
          </button>
        </div>
      </div>

      <!-- Bot Grid -->
      <div class="bot-grid" id="bot-grid">
        ${bots.map(bot => buildBotCard(bot)).join('')}
      </div>

      <!-- Create Bot Modal -->
      <div class="modal-backdrop" id="create-bot-modal">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-icon" style="background: var(--accent-dim); color: var(--accent); box-shadow: 0 0 30px rgba(0, 255, 198, 0.2);">🤖</div>
          <h3 class="modal-title">Create New Bot Instance</h3>
          <p class="modal-desc">Configure and deploy a new trading agent</p>
          <form class="create-bot-form" id="create-bot-form">
            <div class="form-group">
              <label class="form-label">Bot Name</label>
              <input class="form-input" type="text" id="new-bot-name" placeholder="e.g., Theta Scalper" required />
            </div>
            <div class="form-group">
              <label class="form-label">Strategy Type</label>
              <select class="form-select" id="new-bot-type">
                <option value="scalper">Scalper</option>
                <option value="swing">Swing Trader</option>
                <option value="arb">Arbitrage</option>
                <option value="dca">DCA</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trading Pair</label>
              <select class="form-select" id="new-bot-pair">
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="SOL/USDT">SOL/USDT</option>
                <option value="ADA/USDT">ADA/USDT</option>
                <option value="AVAX/USDT">AVAX/USDT</option>
                <option value="DOGE/USDT">DOGE/USDT</option>
                <option value="LINK/USDT">LINK/USDT</option>
                <option value="DOT/USDT">DOT/USDT</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Initial Position Side</label>
              <select class="form-select" id="new-bot-side">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div class="modal-actions" style="margin-top: var(--space-md);">
              <button type="button" class="btn btn-secondary" id="cancel-create-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Deploy Bot</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Halt Confirmation Modal -->
      <div class="modal-backdrop" id="halt-confirm-modal">
        <div class="modal-content">
          <div class="modal-icon danger">⚠️</div>
          <h3 class="modal-title">Confirm Emergency Halt</h3>
          <p class="modal-desc" id="halt-confirm-desc">
            This will immediately stop all trading activity for this bot. Open positions will remain as-is. This action requires manual restart.
          </p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="cancel-halt-btn">Cancel</button>
            <button class="btn btn-danger" id="confirm-halt-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Halt Bot
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function buildBotCard(bot) {
    const pnlClass = bot.pnl >= 0 ? 'positive' : 'negative';
    const pnlSign = bot.pnl >= 0 ? '+' : '-';

    return `
      <div class="bot-card status-${bot.status}" id="bot-card-${bot.id}" data-bot-id="${bot.id}">
        <div class="bot-card-header">
          <div class="bot-identity">
            <div class="bot-avatar type-${bot.type}">
              ${bot.type === 'scalper' ? '⚡' : bot.type === 'swing' ? '📈' : bot.type === 'arb' ? '🔄' : '📉'}
            </div>
            <div>
              <div class="bot-name">${bot.name}</div>
              <div class="bot-type">${bot.type} strategy</div>
            </div>
          </div>
          <span class="bot-status-badge ${bot.status}">
            <span class="bot-status-dot"></span>
            ${bot.status}
          </span>
        </div>

        <div class="bot-metrics">
          <div class="bot-metric">
            <span class="bot-metric-label">P&L</span>
            <span class="bot-metric-value ${pnlClass}">${pnlSign}$${formatNumber(bot.pnl)}</span>
          </div>
          <div class="bot-metric">
            <span class="bot-metric-label">Return</span>
            <span class="bot-metric-value ${pnlClass}">${pnlSign}${bot.pnlPercent}%</span>
          </div>
          <div class="bot-metric">
            <span class="bot-metric-label">Trades</span>
            <span class="bot-metric-value">${bot.trades}</span>
          </div>
          <div class="bot-metric">
            <span class="bot-metric-label">Win Rate</span>
            <span class="bot-metric-value">${bot.winRate}%</span>
          </div>
        </div>

        ${bot.status !== 'halted' ? `
          <div class="bot-trade-info">
            <span class="bot-trade-pair">${bot.pair}</span>
            <span class="bot-trade-side ${bot.side}">${bot.side}</span>
            <span class="text-mono" style="font-size:0.8rem; color: var(--text-secondary);">
              $${formatPrice(bot.currentPrice)}
            </span>
          </div>
        ` : `
          <div class="bot-trade-info" style="border-left: 2px solid var(--danger);">
            <span style="color: var(--danger); font-weight: 600; font-size: 0.8rem;">⛔ BOT HALTED</span>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted);">Manual restart required</span>
          </div>
        `}

        <div class="bot-controls">
          ${bot.status === 'active' ? `
            <button class="bot-btn btn-pause" onclick="TradingModule.pauseBot('${bot.id}')" title="Pause bot">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              Pause
            </button>
          ` : bot.status === 'paused' ? `
            <button class="bot-btn btn-resume" onclick="TradingModule.resumeBot('${bot.id}')" title="Resume bot">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5,3 19,12 5,21"/></svg>
              Resume
            </button>
          ` : `
            <button class="bot-btn btn-resume" onclick="TradingModule.resumeBot('${bot.id}')" title="Restart bot">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5,3 19,12 5,21"/></svg>
              Restart
            </button>
          `}
          <button class="bot-btn btn-halt" onclick="TradingModule.requestHalt('${bot.id}')" title="Emergency halt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
            Halt
          </button>
        </div>
      </div>
    `;
  }

  function attachEventListeners() {
    // Create bot button
    const createBtn = document.getElementById('create-bot-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => showModal('create-bot-modal'));
    }

    // Cancel create
    const cancelCreate = document.getElementById('cancel-create-btn');
    if (cancelCreate) {
      cancelCreate.addEventListener('click', () => hideModal('create-bot-modal'));
    }

    // Create bot form
    const form = document.getElementById('create-bot-form');
    if (form) {
      form.addEventListener('submit', handleCreateBot);
    }

    // Cancel halt
    const cancelHalt = document.getElementById('cancel-halt-btn');
    if (cancelHalt) {
      cancelHalt.addEventListener('click', () => hideModal('halt-confirm-modal'));
    }

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        filterBots(filter);
        document.querySelectorAll('[data-filter]').forEach(b => {
          b.className = b.dataset.filter === filter ? 'btn btn-secondary' : 'btn btn-ghost';
        });
      });
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal.id);
      });
    });
  }

  function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
    }
  }

  function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function filterBots(filter) {
    const cards = document.querySelectorAll('.bot-card');
    cards.forEach(card => {
      const botId = card.dataset.botId;
      const bot = AuronState.get('bots').find(b => b.id === botId);
      if (!bot) return;
      if (filter === 'all' || bot.status === filter) {
        card.style.display = '';
        card.style.animation = 'moduleEnter 0.3s ease-out forwards';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function handleCreateBot(e) {
    e.preventDefault();
    const name = document.getElementById('new-bot-name').value.trim();
    const type = document.getElementById('new-bot-type').value;
    const pair = document.getElementById('new-bot-pair').value;
    const side = document.getElementById('new-bot-side').value;

    if (!name) return;

    // Get a reasonable starting price based on pair
    const basePrices = {
      'BTC/USDT': 67500, 'ETH/USDT': 3400, 'SOL/USDT': 175,
      'ADA/USDT': 0.65, 'AVAX/USDT': 42, 'DOGE/USDT': 0.18,
      'LINK/USDT': 18.5, 'DOT/USDT': 8.2,
    };

    const newBot = AuronState.addBot({
      name,
      type,
      pair,
      side,
      entryPrice: basePrices[pair] || 100,
      currentPrice: basePrices[pair] || 100,
    });

    hideModal('create-bot-modal');
    document.getElementById('create-bot-form').reset();

    showToast('success', 'Bot Deployed', `${name} is now active and trading ${pair}`);
  }

  // ─── Bot Control Actions ───
  function pauseBot(botId) {
    const bot = AuronState.get('bots').find(b => b.id === botId);
    AuronState.pauseBot(botId);
    showToast('warning', 'Bot Paused', `${bot?.name || botId} has been paused`);
  }

  function resumeBot(botId) {
    const bot = AuronState.get('bots').find(b => b.id === botId);
    AuronState.resumeBot(botId);
    showToast('success', 'Bot Resumed', `${bot?.name || botId} is now active`);
  }

  function requestHalt(botId) {
    _confirmModal = botId;
    const bot = AuronState.get('bots').find(b => b.id === botId);
    const desc = document.getElementById('halt-confirm-desc');
    if (desc) {
      desc.innerHTML = `This will immediately stop <strong>${bot?.name || botId}</strong> and all its trading activity. Open positions will remain as-is. <strong>This action requires manual restart.</strong>`;
    }

    const confirmBtn = document.getElementById('confirm-halt-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => confirmHalt();
    }

    showModal('halt-confirm-modal');
  }

  function confirmHalt() {
    if (!_confirmModal) return;
    const bot = AuronState.get('bots').find(b => b.id === _confirmModal);
    AuronState.haltBot(_confirmModal);
    hideModal('halt-confirm-modal');
    showToast('error', 'Bot Halted', `${bot?.name || _confirmModal} has been emergency halted`);
    _confirmModal = null;
  }

  function refreshBotGrid() {
    const grid = document.getElementById('bot-grid');
    if (!grid) return;

    const bots = AuronState.get('bots');
    // Update each bot card in-place to avoid flickering
    bots.forEach(bot => {
      const card = document.getElementById(`bot-card-${bot.id}`);
      if (card) {
        // Update PnL values
        const metrics = card.querySelectorAll('.bot-metric-value');
        if (metrics[0]) {
          const pnlClass = bot.pnl >= 0 ? 'positive' : 'negative';
          const pnlSign = bot.pnl >= 0 ? '+' : '-';
          metrics[0].textContent = `${pnlSign}$${formatNumber(bot.pnl)}`;
          metrics[0].className = `bot-metric-value ${pnlClass}`;
        }
        if (metrics[1]) {
          const pnlClass = bot.pnlPercent >= 0 ? 'positive' : 'negative';
          const pnlSign = bot.pnlPercent >= 0 ? '+' : '-';
          metrics[1].textContent = `${pnlSign}${bot.pnlPercent}%`;
          metrics[1].className = `bot-metric-value ${pnlClass}`;
        }
        if (metrics[2]) metrics[2].textContent = bot.trades;
        if (metrics[3]) metrics[3].textContent = `${bot.winRate}%`;

        // Update price
        const priceEl = card.querySelector('.bot-trade-info .text-mono');
        if (priceEl) priceEl.textContent = `$${formatPrice(bot.currentPrice)}`;

        // Update status badge
        const badge = card.querySelector('.bot-status-badge');
        if (badge) {
          badge.className = `bot-status-badge ${bot.status}`;
          const badgeText = badge.childNodes[badge.childNodes.length - 1];
          if (badgeText) badgeText.textContent = `\n            ${bot.status}\n          `;
        }

        // Update trade info if halted
        const tradeInfo = card.querySelector('.bot-trade-info');
        if (tradeInfo) {
          if (bot.status === 'halted') {
            tradeInfo.style.borderLeft = '2px solid var(--danger)';
            tradeInfo.innerHTML = `
              <span style="color: var(--danger); font-weight: 600; font-size: 0.8rem;">⛔ BOT HALTED</span>
              <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted);">Manual restart required</span>
            `;
          } else {
            tradeInfo.style.borderLeft = '';
            tradeInfo.innerHTML = `
              <span class="bot-trade-pair">${bot.pair}</span>
              <span class="bot-trade-side ${bot.side}">${bot.side}</span>
              <span class="text-mono" style="font-size:0.8rem; color: var(--text-secondary);">
                $${formatPrice(bot.currentPrice)}
              </span>
            `;
          }
        }

        // Update card status class
        card.className = `bot-card status-${bot.status}`;

        // Update buttons container
        const controls = card.querySelector('.bot-controls');
        if (controls) {
          controls.innerHTML = `
            ${bot.status === 'active' ? `
              <button class="bot-btn btn-pause" onclick="TradingModule.pauseBot('${bot.id}')" title="Pause bot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                Pause
              </button>
            ` : bot.status === 'paused' ? `
              <button class="bot-btn btn-resume" onclick="TradingModule.resumeBot('${bot.id}')" title="Resume bot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5,3 19,12 5,21"/></svg>
                Resume
              </button>
            ` : `
              <button class="bot-btn btn-resume" onclick="TradingModule.resumeBot('${bot.id}')" title="Restart bot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5,3 19,12 5,21"/></svg>
                Restart
              </button>
            `}
            <button class="bot-btn btn-halt" onclick="TradingModule.requestHalt('${bot.id}')" title="Emergency halt" ${bot.status === 'halted' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Halt
            </button>
          `;
        }

      } else {
        // New bot — append card
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = buildBotCard(bot);
        const newCard = tempDiv.firstElementChild;
        newCard.style.animation = 'moduleEnter 0.4s ease-out forwards';
        grid.appendChild(newCard);
      }
    });
  }

  function cleanup() {
    _unsubscribers.forEach(unsub => unsub && unsub());
    _unsubscribers = [];
  }

  return { render, cleanup, pauseBot, resumeBot, requestHalt, confirmHalt };
})();
