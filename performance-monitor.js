class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      apiCalls: [],
      userInteractions: [],
      memoryUsage: [],
      errorCounts: {},
    };
    
    this.observers = new Map();
    this.isMonitoring = false;
    
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    
    this.startPageLoadMonitoring();
    this.startMemoryMonitoring();
    this.startErrorMonitoring();
    this.startPerformanceObserver();
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startApiCallMonitoring();
    this.startUserInteractionMonitoring();
    
    console.log('Performance monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    
    console.log('Performance monitoring stopped');
  }

  startPageLoadMonitoring() {
    if (document.readyState === 'complete') {
      this.recordPageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.recordPageLoadMetrics(), 0);
      });
    }
  }

  recordPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return;

    this.metrics.pageLoad = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: this.getMetric('first-paint'),
      firstContentfulPaint: this.getMetric('first-contentful-paint'),
      largestContentfulPaint: this.getMetric('largest-contentful-paint'),
      firstInputDelay: this.getMetric('first-input'),
      cumulativeLayoutShift: this.getMetric('cumulative-layout-shift'),
      timeToInteractive: this.calculateTimeToInteractive(),
    };

    this.sendMetrics('page-load', this.metrics.pageLoad);
  }

  startMemoryMonitoring() {
    if (!performance.memory) return;

    const measureMemory = () => {
      if (!this.isMonitoring) return;

      const memoryInfo = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };

      this.metrics.memoryUsage.push(memoryInfo);
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }

      // Alert if memory usage is high
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) {
        this.sendAlert('high-memory-usage', {
          usage: memoryUsagePercent.toFixed(2),
          used: memoryInfo.usedJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit,
        });
      }
    };

    // Measure memory every 30 seconds
    setInterval(measureMemory, 30000);
    measureMemory(); // Initial measurement
  }

  startErrorMonitoring() {
    window.addEventListener('error', (event) => {
      this.recordError('javascript', event.error?.message || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('promise-rejection', event.reason?.message || 'Unhandled promise rejection', {
        reason: event.reason,
      });
    });
  }

  recordError(type, message, details = {}) {
    if (!this.metrics.errorCounts[type]) {
      this.metrics.errorCounts[type] = 0;
    }
    this.metrics.errorCounts[type]++;

    this.sendMetrics('error', {
      type,
      message,
      details,
      timestamp: Date.now(),
      totalErrors: Object.values(this.metrics.errorCounts).reduce((a, b) => a + b, 0),
    });
  }

  startPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    try {
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.sendMetrics('long-task', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);

      // Observe layout shift
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            this.sendMetrics('layout-shift', {
              value: entry.value,
              startTime: entry.startTime,
            });
          }
        });
      });
      
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', layoutShiftObserver);

    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }
  }

  startApiCallMonitoring() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordApiCall({
          url,
          method,
          status: response.status,
          duration,
          success: response.ok,
          timestamp: Date.now(),
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordApiCall({
          url,
          method,
          status: 0,
          duration,
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
        
        throw error;
      }
    };
  }

  recordApiCall(apiCall) {
    this.metrics.apiCalls.push(apiCall);
    
    // Keep only last 1000 API calls
    if (this.metrics.apiCalls.length > 1000) {
      this.metrics.apiCalls = this.metrics.apiCalls.slice(-1000);
    }

    this.sendMetrics('api-call', apiCall);

    // Alert for slow API calls
    if (apiCall.duration > 2000) {
      this.sendAlert('slow-api-call', {
        url: apiCall.url,
        method: apiCall.method,
        duration: apiCall.duration,
      });
    }
  }

  startUserInteractionMonitoring() {
    const interactions = ['click', 'keydown', 'scroll'];
    
    interactions.forEach(type => {
      document.addEventListener(type, (event) => {
        this.recordUserInteraction(type, event);
      }, { passive: true });
    });
  }

  recordUserInteraction(type, event) {
    const interaction = {
      type,
      timestamp: Date.now(),
      target: event.target?.tagName || 'unknown',
      elementId: event.target?.id || '',
    };

    this.metrics.userInteractions.push(interaction);
    
    // Keep only last 500 interactions
    if (this.metrics.userInteractions.length > 500) {
      this.metrics.userInteractions = this.metrics.userInteractions.slice(-500);
    }
  }

  getMetric(name) {
    const entries = performance.getEntriesByName(name);
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
  }

  calculateTimeToInteractive() {
    // Simplified TTI calculation
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return 0;
    
    return navigation.loadEventEnd - navigation.fetchStart;
  }

  sendMetrics(type, data) {
    // Send to analytics service
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', type, data);
    }

    // Send to custom endpoint
    this.sendToEndpoint('/api/metrics', { type, data, timestamp: Date.now() });
  }

  sendAlert(type, data) {
    console.warn(`Performance Alert: ${type}`, data);
    
    // Send alert to monitoring service
    this.sendToEndpoint('/api/alerts', { type, data, timestamp: Date.now() });
  }

  async sendToEndpoint(endpoint, data) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Failed to send metrics:', error);
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      summary: this.generateSummary(),
    };
  }

  generateSummary() {
    const apiCalls = this.metrics.apiCalls;
    const recentCalls = apiCalls.slice(-100); // Last 100 calls
    
    return {
      totalApiCalls: apiCalls.length,
      averageApiResponseTime: recentCalls.length > 0 
        ? recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length 
        : 0,
      errorRate: recentCalls.length > 0 
        ? recentCalls.filter(call => !call.success).length / recentCalls.length 
        : 0,
      totalErrors: Object.values(this.metrics.errorCounts).reduce((a, b) => a + b, 0),
      currentMemoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1],
      pageLoadTime: this.metrics.pageLoad.loadComplete || 0,
    };
  }

  exportMetrics() {
    const dataStr = JSON.stringify(this.getMetrics(), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Start monitoring when page is fully loaded
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMonitor.startMonitoring();
  }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
} else if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
  window.performanceMonitor = performanceMonitor;
}
