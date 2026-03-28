import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes: Theme[] = ['light', 'dark'];
  private themeSubject = new BehaviorSubject<Theme>('light');
  theme$ = this.themeSubject.asObservable();

  initTheme() {
    const saved = localStorage.getItem('theme') as Theme | null;

    const theme = (saved && this.themes.includes(saved))
      ? saved
      : 'light';

    this.setTheme(theme);
  }

  toggleTheme() {
    const current = this.themeSubject.value;
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  getTheme(): Theme {
    return this.themeSubject.value;
  }

  setTheme(theme: Theme) {
    if (!this.themes.includes(theme)) return;

    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
}