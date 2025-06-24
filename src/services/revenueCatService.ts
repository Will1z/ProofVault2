interface RevenueCatConfig {
  apiKey: string;
  appUserId?: string;
}

interface Product {
  identifier: string;
  description: string;
  title: string;
  price: string;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: string;
    priceString: string;
    period: string;
    cycles: number;
  };
}

interface Entitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'normal' | 'intro' | 'trial';
  latestPurchaseDate: string;
  originalPurchaseDate: string;
  expirationDate?: string;
  store: 'app_store' | 'play_store' | 'stripe' | 'promotional';
  productIdentifier: string;
}

interface CustomerInfo {
  originalAppUserId: string;
  originalApplicationVersion?: string;
  requestDate: string;
  firstSeen: string;
  originalPurchaseDate?: string;
  managementURL?: string;
  entitlements: {
    active: Record<string, Entitlement>;
    all: Record<string, Entitlement>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  nonSubscriptionTransactions: any[];
  allExpirationDates: Record<string, string>;
}

interface PurchaseResult {
  customerInfo: CustomerInfo;
  productIdentifier: string;
  transaction: any;
}

class RevenueCatService {
  private config: RevenueCatConfig;
  private isConfigured: boolean = false;
  private customerInfo: CustomerInfo | null = null;
  private products: Product[] = [];

  // Subscription tiers
  public readonly SUBSCRIPTION_TIERS = {
    FREE: 'free',
    PREMIUM: 'premium_monthly'
  } as const;

  // Premium features
  public readonly PREMIUM_FEATURES = {
    BLOCKCHAIN_LOGGING: 'blockchain_logging',
    AI_VERIFICATION: 'ai_verification',
    EXPERT_COSIGNATURE: 'expert_cosignature',
    UNLIMITED_UPLOADS: 'unlimited_uploads',
    PRIORITY_SUPPORT: 'priority_support',
    ADVANCED_ANALYTICS: 'advanced_analytics'
  } as const;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY || '',
      appUserId: undefined
    };

    this.isConfigured = !!this.config.apiKey;

    if (this.isConfigured) {
      this.initializeRevenueCat();
    } else {
      console.warn('RevenueCat not configured - using mock subscription system');
      this.initializeMockData();
    }
  }

  private async initializeRevenueCat() {
    try {
      // In a real implementation, you would use the RevenueCat Web SDK
      // For now, we'll simulate the initialization
      console.log('RevenueCat initialized (mock mode)');
      
      // Set up mock customer info
      this.initializeMockData();
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      this.isConfigured = false;
      this.initializeMockData();
    }
  }

  private initializeMockData() {
    // Mock products for sandbox testing
    this.products = [
      {
        identifier: this.SUBSCRIPTION_TIERS.PREMIUM,
        description: 'Premium ProofVault features including blockchain logging, AI verification, and expert co-signatures',
        title: 'ProofVault Premium',
        price: '9.99',
        priceString: '$9.99',
        currencyCode: 'USD',
        introPrice: {
          price: '4.99',
          priceString: '$4.99',
          period: 'P1M',
          cycles: 1
        }
      }
    ];

    // Mock customer info (free tier by default)
    this.customerInfo = {
      originalAppUserId: `user_${Date.now()}`,
      requestDate: new Date().toISOString(),
      firstSeen: new Date().toISOString(),
      entitlements: {
        active: {},
        all: {}
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      nonSubscriptionTransactions: [],
      allExpirationDates: {}
    };
  }

  async configure(appUserId: string): Promise<void> {
    this.config.appUserId = appUserId;
    
    if (!this.isConfigured) {
      console.log('RevenueCat not configured, using mock user setup');
      return;
    }

    try {
      // In a real implementation, configure RevenueCat with the user ID
      console.log(`RevenueCat configured for user: ${appUserId}`);
      
      // Fetch customer info
      await this.getCustomerInfo();
    } catch (error) {
      console.error('RevenueCat configuration failed:', error);
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isConfigured) {
      return this.customerInfo!;
    }

    try {
      // In a real implementation, fetch from RevenueCat API
      // For now, return mock data
      return this.customerInfo!;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return this.customerInfo!;
    }
  }

  async getProducts(): Promise<Product[]> {
    if (!this.isConfigured) {
      return this.products;
    }

    try {
      // In a real implementation, fetch from RevenueCat API
      return this.products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return this.products;
    }
  }

  async purchaseProduct(productIdentifier: string): Promise<PurchaseResult> {
    if (!this.isConfigured) {
      return this.mockPurchase(productIdentifier);
    }

    try {
      // In a real implementation, use RevenueCat purchase flow
      console.log(`Purchasing product: ${productIdentifier}`);
      
      // For now, simulate successful purchase
      return this.mockPurchase(productIdentifier);
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  private mockPurchase(productIdentifier: string): PurchaseResult {
    const now = new Date().toISOString();
    const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const entitlement: Entitlement = {
      identifier: 'premium',
      isActive: true,
      willRenew: true,
      periodType: 'normal',
      latestPurchaseDate: now,
      originalPurchaseDate: now,
      expirationDate,
      store: 'promotional',
      productIdentifier
    };

    // Update customer info
    this.customerInfo!.entitlements.active['premium'] = entitlement;
    this.customerInfo!.entitlements.all['premium'] = entitlement;
    this.customerInfo!.activeSubscriptions = [productIdentifier];
    this.customerInfo!.allPurchasedProductIdentifiers = [productIdentifier];
    this.customerInfo!.allExpirationDates[productIdentifier] = expirationDate;

    return {
      customerInfo: this.customerInfo!,
      productIdentifier,
      transaction: {
        transactionIdentifier: `txn_${Date.now()}`,
        productIdentifier,
        purchaseDate: now
      }
    };
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isConfigured) {
      console.log('Restoring purchases (mock)');
      return this.customerInfo!;
    }

    try {
      // In a real implementation, restore from RevenueCat
      return await this.getCustomerInfo();
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return this.customerInfo!;
    }
  }

  // Feature access checks
  hasActiveSubscription(): boolean {
    return this.customerInfo?.activeSubscriptions.length > 0 || false;
  }

  hasFeatureAccess(feature: string): boolean {
    // Free tier features (always available)
    const freeTierFeatures = [
      'basic_upload',
      'basic_verification',
      'emergency_reporting',
      'offline_mode'
    ];

    if (freeTierFeatures.includes(feature)) {
      return true;
    }

    // Premium features require active subscription
    const premiumFeatures = Object.values(this.PREMIUM_FEATURES);
    if (premiumFeatures.includes(feature)) {
      return this.hasActiveSubscription();
    }

    return false;
  }

  getSubscriptionStatus(): {
    tier: 'free' | 'premium';
    isActive: boolean;
    expirationDate?: string;
    willRenew?: boolean;
  } {
    const hasActive = this.hasActiveSubscription();
    const premiumEntitlement = this.customerInfo?.entitlements.active['premium'];

    return {
      tier: hasActive ? 'premium' : 'free',
      isActive: hasActive,
      expirationDate: premiumEntitlement?.expirationDate,
      willRenew: premiumEntitlement?.willRenew
    };
  }

  // Feature-specific access checks
  canUseBlockchainLogging(): boolean {
    return this.hasFeatureAccess(this.PREMIUM_FEATURES.BLOCKCHAIN_LOGGING);
  }

  canUseAIVerification(): boolean {
    return this.hasFeatureAccess(this.PREMIUM_FEATURES.AI_VERIFICATION);
  }

  canUseExpertCoSignature(): boolean {
    return this.hasFeatureAccess(this.PREMIUM_FEATURES.EXPERT_COSIGNATURE);
  }

  canUseUnlimitedUploads(): boolean {
    return this.hasFeatureAccess(this.PREMIUM_FEATURES.UNLIMITED_UPLOADS);
  }

  // Usage limits for free tier
  getUploadLimit(): number {
    return this.hasActiveSubscription() ? Infinity : 5;
  }

  getVerificationLimit(): number {
    return this.hasActiveSubscription() ? Infinity : 3;
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      hasApiKey: !!this.config.apiKey,
      hasUser: !!this.config.appUserId,
      subscriptionActive: this.hasActiveSubscription(),
      tier: this.getSubscriptionStatus().tier
    };
  }
}

export const revenueCatService = new RevenueCatService();
export type { Product, CustomerInfo, Entitlement };