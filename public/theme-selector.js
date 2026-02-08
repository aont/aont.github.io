(function () {
  const STORAGE_KEY = "preferredThemeMode"; // auto | light | dark

  function getThemeRoot() {
    return document.querySelector('.theme-root') || document.body;
  }

  function applyTheme(mode) {
    const root = getThemeRoot();
    if (!root) return;

    if (mode === 'dark' || mode === 'light') {
      root.setAttribute('data-theme', mode);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function createControl(initialMode) {
    const wrapper = document.createElement('div');
    wrapper.className = 'theme-mode-control';

    const label = document.createElement('label');
    label.setAttribute('for', 'globalThemeMode');
    label.textContent = 'Theme';

    const select = document.createElement('select');
    select.id = 'globalThemeMode';
    select.setAttribute('aria-label', 'Theme Select');
    select.innerHTML = [
      '<option value="auto">Auto</option>',
      '<option value="light">Light</option>',
      '<option value="dark">Dark</option>'
    ].join('');
    select.value = initialMode;

    select.addEventListener('change', () => {
      const mode = select.value;
      localStorage.setItem(STORAGE_KEY, mode);
      applyTheme(mode);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    return wrapper;
  }

  window.addEventListener('DOMContentLoaded', function () {
    const pageMain = document.querySelector('.page-main');
    if (!pageMain) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const initialMode = saved === 'light' || saved === 'dark' ? saved : 'auto';
    applyTheme(initialMode);

    const control = createControl(initialMode);
    pageMain.appendChild(control);
  });
})();
