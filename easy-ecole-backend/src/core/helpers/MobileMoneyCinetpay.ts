// Temporary stub to fix TypeScript compile error when running src/app.ts.
// If MobileMoney Cinetpay integration already exists elsewhere, replace this file
// with the real implementation.

export class MobileMoneyCinetpay {
  private static instance: MobileMoneyCinetpay | null = null;

  static getInstance(): MobileMoneyCinetpay {
    if (!MobileMoneyCinetpay.instance) {
      MobileMoneyCinetpay.instance = new MobileMoneyCinetpay();
    }
    return MobileMoneyCinetpay.instance;
  }

  // Keeping the same API expected by app.ts (commented out right now)
  init(): void {
    // no-op
  }
}

