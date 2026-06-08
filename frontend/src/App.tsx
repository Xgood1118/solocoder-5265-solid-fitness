import { A, useLocation } from '@solidjs/router';
import { Component, type JSX } from 'solid-js';
import type { RouteSectionProps } from '@solidjs/router';
import RestTimer from './components/RestTimer';

const App: Component<RouteSectionProps> = (props) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.5 6.5 3 10l3.5 3.5" />
            <path d="M17.5 6.5 21 10l-3.5 3.5" />
            <path d="M6 10h12" />
            <path d="M9 4v16" />
            <path d="M15 4v16" />
          </svg>
          <span>Solid Fitness</span>
        </div>
        <nav class="sidebar-nav">
          <A href="/" class={`sidebar-link ${isActive('/') && !isActive('/exercises') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span>训练日历</span>
          </A>
          <A href="/exercises" class={`sidebar-link ${isActive('/exercises') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6.5 6.5 3 10l3.5 3.5" />
              <path d="M17.5 6.5 21 10l-3.5 3.5" />
              <path d="M6 10h12" />
            </svg>
            <span>动作库</span>
          </A>
          <A href="/plans" class={`sidebar-link ${isActive('/plans') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>训练计划</span>
          </A>
          <A href="/workout/new" class={`sidebar-link ${isActive('/workout') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>开始训练</span>
          </A>
          <A href="/stats" class={`sidebar-link ${isActive('/stats') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            <span>数据统计</span>
          </A>
          <A href="/measurements" class={`sidebar-link ${isActive('/measurements') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9" />
              <path d="M21 3v6h-6" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>体测记录</span>
          </A>
        </nav>
      </aside>

      <main class="main-content">
        {props.children}
      </main>

      <RestTimer />
    </div>
  );
};

export default App;
