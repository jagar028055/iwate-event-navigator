/**
 * Accessibility utilities for the Iwate Event Navigator
 * Implements WCAG 2.1 AA compliance features
 */

// Announce to screen readers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const existingElement = document.getElementById('sr-live-region');
  let liveRegion = existingElement;

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  // Clear previous message and add new one
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
};

// Focus management utilities
export const focusElement = (selector: string | HTMLElement, delay: number = 0): boolean => {
  const element = typeof selector === 'string' 
    ? document.querySelector(selector) as HTMLElement 
    : selector;
  
  if (!element) return false;

  if (delay > 0) {
    setTimeout(() => {
      element.focus();
    }, delay);
  } else {
    element.focus();
  }
  
  return true;
};

export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
};

export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

// High contrast and theme utilities
export const detectHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

export const detectReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const detectDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Keyboard navigation helpers
export const handleArrowNavigation = (
  event: KeyboardEvent, 
  elements: HTMLElement[], 
  currentIndex: number,
  onNavigate: (newIndex: number) => void
): void => {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      break;
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault();
      newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = elements.length - 1;
      break;
    default:
      return;
  }

  elements[newIndex]?.focus();
  onNavigate(newIndex);
};

// Text and content utilities
export const getReadableText = (element: HTMLElement): string => {
  // Get text that would be read by screen readers
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  return element.textContent || element.innerText || '';
};

export const setAriaExpanded = (element: HTMLElement, expanded: boolean): void => {
  element.setAttribute('aria-expanded', expanded.toString());
};

export const setAriaSelected = (element: HTMLElement, selected: boolean): void => {
  element.setAttribute('aria-selected', selected.toString());
};

export const setAriaPressed = (element: HTMLElement, pressed: boolean): void => {
  element.setAttribute('aria-pressed', pressed.toString());
};

// Skip link utilities
export const createSkipLink = (targetId: string, text: string): HTMLAnchorElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.setAttribute('aria-label', `${text}にスキップ`);
  
  return skipLink;
};

// Region and landmark utilities
export const setRegionLabel = (element: HTMLElement, label: string): void => {
  element.setAttribute('aria-label', label);
};

export const announcePageChange = (pageName: string): void => {
  announceToScreenReader(`${pageName}ページが読み込まれました`, 'assertive');
};

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (lightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGAAContrast = (color1: string, color2: string): boolean => {
  return getContrastRatio(color1, color2) >= 4.5;
};

export const meetsWCAGAAAContrast = (color1: string, color2: string): boolean => {
  return getContrastRatio(color1, color2) >= 7;
};

// Loading and progress utilities
export const announceLoading = (message: string = 'データを読み込んでいます'): void => {
  announceToScreenReader(message, 'assertive');
};

export const announceLoadingComplete = (message: string = '読み込みが完了しました'): void => {
  announceToScreenReader(message, 'polite');
};

export const setLoadingState = (element: HTMLElement, loading: boolean, loadingText?: string): void => {
  if (loading) {
    element.setAttribute('aria-busy', 'true');
    if (loadingText) {
      element.setAttribute('aria-label', loadingText);
    }
  } else {
    element.removeAttribute('aria-busy');
    if (loadingText) {
      element.removeAttribute('aria-label');
    }
  }
};

// Error handling utilities
export const announceError = (error: string): void => {
  announceToScreenReader(`エラー: ${error}`, 'assertive');
};

export const setErrorState = (element: HTMLElement, hasError: boolean, errorMessage?: string): void => {
  if (hasError) {
    element.setAttribute('aria-invalid', 'true');
    if (errorMessage) {
      const errorId = `error-${Math.random().toString(36).substr(2, 9)}`;
      element.setAttribute('aria-describedby', errorId);
      
      const errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.textContent = errorMessage;
      errorElement.className = 'sr-only';
      document.body.appendChild(errorElement);
    }
  } else {
    element.removeAttribute('aria-invalid');
    const errorId = element.getAttribute('aria-describedby');
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
      element.removeAttribute('aria-describedby');
    }
  }
};

// Touch and gesture utilities
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isLargeTouch = (): boolean => {
  return isTouchDevice() && window.screen.width >= 768;
};

// Initialize accessibility features
export const initializeAccessibility = (): void => {
  // Add live region for screen reader announcements
  if (!document.getElementById('sr-live-region')) {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  // Set document language
  if (!document.documentElement.lang) {
    document.documentElement.lang = 'ja';
  }

  // Add reduced motion class if user prefers reduced motion
  if (detectReducedMotion()) {
    document.documentElement.classList.add('reduce-motion');
  }

  // Add high contrast class if user prefers high contrast
  if (detectHighContrast()) {
    document.documentElement.classList.add('high-contrast');
  }
};