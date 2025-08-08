type NetworkStatusListener = (isOnline: boolean) => void;

class NetworkStatusService {
  private listeners: Set<NetworkStatusListener> = new Set();
  private _isOnline: boolean = navigator.onLine;
  private pingInterval: number | null = null;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly PING_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.init();
  }

  private init(): void {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start periodic connectivity checks
    this.startPingCheck();
  }

  private handleOnline = (): void => {
    this.updateStatus(true);
  };

  private handleOffline = (): void => {
    this.updateStatus(false);
  };

  private updateStatus(isOnline: boolean): void {
    if (this._isOnline !== isOnline) {
      this._isOnline = isOnline;
      this.notifyListeners(isOnline);
    }
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  private startPingCheck(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = window.setInterval(() => {
      this.checkConnectivity();
    }, this.PING_INTERVAL);
  }

  private async checkConnectivity(): Promise<void> {
    try {
      // Try to fetch a small resource from our API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.PING_TIMEOUT);

      await fetch('/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      // Consider online if we get any response (even error responses)
      this.updateStatus(true);
    } catch (error) {
      // Network error or timeout - consider offline
      this.updateStatus(false);
    }
  }

  // Public API
  get isOnline(): boolean {
    return this._isOnline;
  }

  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  removeListener(listener: NetworkStatusListener): void {
    this.listeners.delete(listener);
  }

  // Force a connectivity check
  async checkNow(): Promise<boolean> {
    await this.checkConnectivity();
    return this._isOnline;
  }

  // Clean up resources
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.listeners.clear();
  }
}

export const networkStatus = new NetworkStatusService();
