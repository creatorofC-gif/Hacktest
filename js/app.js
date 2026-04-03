/**
 * AURON — Main Application Entry Point
 * Initializes all systems, renders shell, starts real-time data
 */

// ─── Toast Notification System ───
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

// ─── Application Shell ───
function renderAppShell() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="sidebar-brand">
          <h1>Auron</h1>
          <span>AI Trading Control</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section-label">Main</span>

        <div class="nav-item active" data-route="dashboard" onclick="AuronRouter.navigate('dashboard')">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </div>

        <div class="nav-item" data-route="trading" onclick="AuronRouter.navigate('trading')">
          <span class="nav-icon">⚡</span>
          <span class="nav-label">Live Trading</span>
        </div>

        <div class="nav-item" data-route="performance" onclick="AuronRouter.navigate('performance')">
          <span class="nav-icon">📈</span>
          <span class="nav-label">Performance</span>
        </div>

        <div class="nav-item" data-route="risk" onclick="AuronRouter.navigate('risk')">
          <span class="nav-icon">🛡️</span>
          <span class="nav-label">Risk Monitor</span>
        </div>

        <span class="nav-section-label" style="margin-top: var(--space-md);">System</span>

        <div class="nav-item" data-route="settings" onclick="AuronRouter.navigate('settings')">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Settings</span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="sidebar-toggle" id="sidebar-toggle" onclick="toggleSidebar()" title="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper" id="main-wrapper">
      <!-- Navbar -->
      <header class="navbar">
        <div class="navbar-left">
          <h2 class="navbar-title" id="navbar-title">Dashboard</h2>
        </div>
        <div class="navbar-right">
          <div class="connection-status connected" id="connection-status">
            <span class="status-dot"></span>
            <span id="connection-label">Connected</span>
          </div>

          <button class="nav-icon-btn" id="notifications-btn" title="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notification-badge" id="notification-count">3</span>
          </button>

          <div class="user-profile">
            <div class="user-avatar">AU</div>
            <div class="user-info">
              <span class="user-name">Auron Admin</span>
              <span class="user-role">System Operator</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Dynamic Content Area -->
      <main class="content-area" id="content-area" style="transition: opacity 0.2s ease, transform 0.2s ease;"></main>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toast-container"></div>
  `;
}

// ─── Sidebar Toggle ───
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const wrapper = document.getElementById('main-wrapper');
  const isCollapsed = sidebar.classList.toggle('collapsed');
  wrapper.classList.toggle('sidebar-collapsed', isCollapsed);
  AuronState.set('sidebarCollapsed', isCollapsed);

  const toggle = document.getElementById('sidebar-toggle');
  if (toggle) {
    toggle.querySelector('svg').style.transform = isCollapsed ? 'rotate(180deg)' : '';
  }
}

// ─── Connection Status Listener ───
function initConnectionStatus() {
  AuronState.on('change:connectionStatus', ({ value }) => {
    const el = document.getElementById('connection-status');
    const label = document.getElementById('connection-label');
    if (!el || !label) return;

    el.className = `connection-status ${value}`;
    const labels = {
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
    };
    label.textContent = labels[value] || value;
  });
}

// ─── Notification Badge Listener ───
function initNotificationBadge() {
  AuronState.on('change:notifications', ({ count }) => {
    const badge = document.getElementById('notification-count');
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  });
}

// ─── Settings Module (simple placeholder) ───
function renderSettings() {
  const container = document.createElement('div');
  container.className = 'module-enter';
  container.innerHTML = `
    <div class="section-header">
      <span class="section-title"><span class="title-dot"></span>Settings</span>
    </div>
    <div class="dashboard-grid">
      <div class="glass-card">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:var(--space-md);">WebSocket Configuration</h3>
        <div class="create-bot-form">
          <div class="form-group">
            <label class="form-label">Server URL</label>
            <input class="form-input" type="text" value="ws://localhost:8080" id="ws-url-input"/>
          </div>
          <div class="form-group">
            <label class="form-label">Reconnect Attempts</label>
            <input class="form-input" type="number" value="5" min="1" max="20"/>
          </div>
          <button class="btn btn-primary" onclick="showToast('success','Settings Saved','WebSocket configuration updated')">Save Settings</button>
        </div>
      </div>
      <div class="glass-card">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:var(--space-md);">Display Preferences</h3>
        <div class="create-bot-form">
          <div class="form-group">
            <label class="form-label">Theme</label>
            <select class="form-select"><option>Dark (Default)</option><option>Midnight</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Chart Animation</label>
            <select class="form-select"><option>Enabled</option><option>Disabled</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Data Refresh Rate</label>
            <select class="form-select"><option>2.5s (Default)</option><option>1s</option><option>5s</option></select>
          </div>
        </div>
      </div>
    </div>
  `;
  return container;
}

// ─── Boot Sequence ───
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c⚡ AURON Trading Control Interface', 'color:#00FFC6;font-size:16px;font-weight:bold;');
  console.log('%c   Initializing systems...', 'color:#94A3B8;font-size:11px;');

  // 1. Render shell
  renderAppShell();

  // 2. Register routes
  AuronRouter.register('dashboard', () => DashboardModule.render());
  AuronRouter.register('trading', () => TradingModule.render());
  AuronRouter.register('performance', () => PerformanceModule.render());
  AuronRouter.register('risk', () => RiskModule.render());
  AuronRouter.register('settings', () => renderSettings());

  // 3. Init router
  AuronRouter.init('#content-area');

  // 4. Init listeners
  initConnectionStatus();
  initNotificationBadge();

  // 5. Connect WebSocket (falls back to simulation)
  AuronWS.connect();

  console.log('%c   ✓ All systems nominal', 'color:#00FFC6;font-size:11px;');
});
