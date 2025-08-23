/**
 * Performance optimization utilities for Iwate Event Navigator
 * Implements caching, lazy loading, and performance monitoring
 */

// Cache utilities
export class AppCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static instance: AppCache;

  static getInstance(): AppCache {
    if (!AppCache.instance) {
      AppCache.instance = new AppCache();
    }
    return AppCache.instance;
  }

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utilities
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

export const lazyLoad = (
  element: HTMLElement,
  loadFn: () => Promise<void>
): void => {
  const observer = createIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadFn().finally(() => {
            observer.unobserve(element);
          });
        }
      });
    },
    { rootMargin: '100px' }
  );

  observer.observe(element);
};

// Image optimization utilities
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const createWebPSource = (src: string): string => {
  if (src.includes('.webp')) return src;
  return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
};

export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number[]>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label: string): number {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label, 'measure')[0] as PerformanceMeasure;
      const duration = measure.duration;
      
      // Store metric
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      // Clean up
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
      
      return duration;
    }
    return 0;
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((times, label) => {
      if (times.length > 0) {
        result[label] = {
          average: times.reduce((sum, time) => sum + time, 0) / times.length,
          count: times.length,
          min: Math.min(...times),
          max: Math.max(...times)
        };
      }
    });
    
    return result;
  }

  measurePageLoad(): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            domComplete: navigation.domComplete - navigation.startTime,
            loadComplete: navigation.loadEventEnd - navigation.startTime,
            firstPaint: 0,
            firstContentfulPaint: 0,
          };

          // Get paint metrics if available
          const paintEntries = performance.getEntriesByType('paint');
          paintEntries.forEach((entry) => {
            if (entry.name === 'first-paint') {
              metrics.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime;
            }
          });

          console.log('Page Load Metrics:', metrics);
        }, 0);
      });
    }
  }
}

// Memory management utilities
export const cleanupEventListeners = (element: HTMLElement): void => {
  const clone = element.cloneNode(true);
  element.parentNode?.replaceChild(clone, element);
};

export const getMemoryUsage = (): any => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    return {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Resource loading utilities
export const preloadCriticalResources = (urls: string[]): Promise<void[]> => {
  return Promise.all(urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      
      document.head.appendChild(link);
    });
  }));
};

export const prefetchResource = (url: string): void => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
};

// Bundle splitting utilities
export const loadChunk = async (chunkName: string): Promise<any> => {
  try {
    switch (chunkName) {
      case 'maps':
        return await import('leaflet');
      case 'ai':
        return await import('@google/genai');
      default:
        throw new Error(`Unknown chunk: ${chunkName}`);
    }
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    throw error;
  }
};

// Viewport utilities
export const isInViewport = (element: HTMLElement, threshold = 0): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= windowHeight + threshold &&
    rect.right <= windowWidth + threshold
  );
};

export const getViewportSize = (): { width: number; height: number } => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
};

// Critical rendering path optimization
export const deferNonCriticalCSS = (href: string): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = function() {
    (this as any).rel = 'stylesheet';
  };
  document.head.appendChild(link);
};

export const loadNonCriticalJS = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): void => {
  const monitor = PerformanceMonitor.getInstance();
  monitor.measurePageLoad();

  // Monitor memory usage periodically
  if (getMemoryUsage()) {
    setInterval(() => {
      const memory = getMemoryUsage();
      if (memory && memory.used > memory.limit * 0.9) {
        console.warn('High memory usage detected:', memory);
      }
    }, 30000); // Check every 30 seconds
  }

  // Monitor slow operations
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const label = `fetch-${args[0]}`;
    monitor.startTiming(label);
    
    try {
      const response = await originalFetch(...args);
      monitor.endTiming(label);
      return response;
    } catch (error) {
      monitor.endTiming(label);
      throw error;
    }
  };
};