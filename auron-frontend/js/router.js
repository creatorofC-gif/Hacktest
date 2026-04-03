/**
 * AURON — Client-Side Router
 * Hash-based routing with smooth transitions
 */

const AuronRouter = (() => {
  const _routes = {};
  let _currentRoute = null;
  let _contentArea = null;

  const ROUTE_TITLES = {
    dashboard: 'Dashboard',
    trading: 'Live Trading',
    performance: 'Performance',
    risk: 'Risk Monitor',
    settings: 'Settings',
  };

  function register(name, renderFn) {
    _routes[name] = renderFn;
  }

  function init(contentSelector) {
    _contentArea = document.querySelector(contentSelector);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const route = getRouteFromHash();
      navigate(route, false);
    });

    // Listen for state-driven navigation
    AuronState.on('change:currentRoute', ({ value }) => {
      navigate(value, false);
    });

    // Initial route
    const initialRoute = getRouteFromHash() || 'dashboard';
    navigate(initialRoute);
  }

  function getRouteFromHash() {
    const hash = window.location.hash.slice(1);
    return hash || 'dashboard';
  }

  function navigate(routeName, updateHash = true) {
    if (!_routes[routeName]) {
      console.warn(`[Router] Route "${routeName}" not registered`);
      routeName = 'dashboard';
    }

    if (_currentRoute === routeName) return;

    const prevRoute = _currentRoute;
    _currentRoute = routeName;

    // Update hash
    if (updateHash) {
      window.location.hash = routeName;
    }

    // Update state
    AuronState.set('currentRoute', routeName);

    // Update navbar title
    const navTitle = document.getElementById('navbar-title');
    if (navTitle) {
      navTitle.textContent = ROUTE_TITLES[routeName] || routeName;
    }

    // Update sidebar active state
    updateSidebarActive(routeName);

    // Call cleanup on previous module
    if (prevRoute && _routes[prevRoute]) {
       // Since _routes stores render functions, wait, we don't have access to the module instance directly.
       // Let's fire a 'routeCleanup' event!
       const event = new CustomEvent('routeCleanup', { detail: { route: prevRoute } });
       document.dispatchEvent(event);
    }

    // Render with transition
    renderRoute(routeName, prevRoute);
  }

  function renderRoute(routeName, prevRoute) {
    if (!_contentArea) return;

    // Fade out current content
    _contentArea.style.opacity = '0';
    _contentArea.style.transform = 'translateY(8px)';

    setTimeout(() => {
      // Clear and render new content
      _contentArea.innerHTML = '';
      const renderFn = _routes[routeName];
      if (renderFn) {
        const content = renderFn();
        if (typeof content === 'string') {
          _contentArea.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          _contentArea.appendChild(content);
        }
      }

      // Execute any post-render hooks (for chart initialization, etc.)
      requestAnimationFrame(() => {
        _contentArea.style.opacity = '1';
        _contentArea.style.transform = 'translateY(0)';

        // Dispatch custom event for module initialization
        const event = new CustomEvent('routeRendered', { detail: { route: routeName, prev: prevRoute } });
        document.dispatchEvent(event);
      });
    }, 200);
  }

  function updateSidebarActive(routeName) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.route === routeName) {
        item.classList.add('active');
      }
    });
  }

  function getCurrentRoute() {
    return _currentRoute;
  }

  return {
    register,
    init,
    navigate,
    getCurrentRoute,
    ROUTE_TITLES,
  };
})();
