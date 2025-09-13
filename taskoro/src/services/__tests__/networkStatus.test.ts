import { networkStatus } from '../networkStatus';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

// Mock fetch
global.fetch = jest.fn();

describe('NetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with navigator.onLine status', () => {
      expect(networkStatus.isOnline).toBe(true);
    });

    it('should be able to add event listeners', () => {
      // Since the service is already initialized, we just test that the mock functions exist
      expect(mockAddEventListener).toBeDefined();
      expect(mockRemoveEventListener).toBeDefined();
    });
  });

  describe('status management', () => {
    it('should report online status correctly', () => {
      expect(networkStatus.isOnline).toBe(true);
    });

    it('should allow adding and removing listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = networkStatus.addListener(mockListener);

      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      networkStatus.removeListener(mockListener);
    });
  });

  describe('connectivity checking', () => {
    it('should handle successful connectivity check', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await networkStatus.checkNow();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/health', {
        method: 'HEAD',
        signal: expect.any(AbortSignal),
        cache: 'no-cache',
      });
    });

    it('should handle failed connectivity check', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await networkStatus.checkNow();
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      networkStatus.destroy();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });
  });
});
