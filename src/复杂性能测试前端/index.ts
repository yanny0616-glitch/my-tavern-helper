import './index.scss';

$(() => {
  const app = document.getElementById('app');
  if (!app) return;

  const raw = String((window as any).__TH_RAW__ ?? '');
  const header = document.createElement('div');
  header.className = 'perf-header';
  header.textContent = raw ? raw.slice(0, 80) : '复杂性能测试前端';

  const grid = document.createElement('div');
  grid.className = 'perf-grid';

  for (let i = 0; i < 120; i++) {
    const card = document.createElement('div');
    card.className = 'perf-card';
    card.innerHTML = `
      <div class="perf-card__title">CARD ${i + 1}</div>
      <div class="perf-card__meta">${new Date().toLocaleTimeString()}</div>
      <div class="perf-card__body">${raw.slice(0, 120) || 'placeholder text'}</div>
    `;
    grid.appendChild(card);
  }

  app.appendChild(header);
  app.appendChild(grid);
});
