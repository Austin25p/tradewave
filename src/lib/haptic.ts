class HapticManager {
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_haptic_enabled');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('app_haptic_enabled', String(enabled));
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public trigger(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (!this.isEnabled) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
      }
    }
  }
}

export const hapticSystem = new HapticManager();

export function useHaptic() {
  const trigger = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    hapticSystem.trigger(type);
  };
  return trigger;
}
