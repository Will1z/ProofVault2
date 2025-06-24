import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, X, Shield, Brain, Users, Infinity, Clock, Sparkles, CreditCard, Loader2 } from 'lucide-react';
import { revenueCatService } from '../services/revenueCatService';
import toast from 'react-hot-toast';

interface SubscriptionPanelProps {
  userId?: string;
  onSubscriptionChange?: (isPremium: boolean) => void;
  className?: string;
}

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  userId,
  onSubscriptionChange,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    tier: 'free' | 'premium';
    isActive: boolean;
    expirationDate?: string;
    willRenew?: boolean;
  }>({ tier: 'free', isActive: false });
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      // Configure RevenueCat with user ID if available
      if (userId) {
        await revenueCatService.configure(userId);
      }
      
      // Get subscription status
      const status = revenueCatService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      // Get available products
      const availableProducts = await revenueCatService.getProducts();
      setProducts(availableProducts);
      
      // Notify parent component
      if (onSubscriptionChange) {
        onSubscriptionChange(status.tier === 'premium' && status.isActive);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    setIsPurchasing(true);
    try {
      await revenueCatService.purchaseProduct(productId);
      
      // Refresh subscription status
      const status = revenueCatService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      // Notify parent component
      if (onSubscriptionChange) {
        onSubscriptionChange(status.tier === 'premium' && status.isActive);
      }
      
      toast.success('Subscription activated successfully!');
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Subscription purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      await revenueCatService.restorePurchases();
      
      // Refresh subscription status
      const status = revenueCatService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      // Notify parent component
      if (onSubscriptionChange) {
        onSubscriptionChange(status.tier === 'premium' && status.isActive);
      }
      
      toast.success('Purchases restored successfully');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      toast.error('Failed to restore purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ProofVault Subscription</h3>
              <p className="text-sm text-gray-600">
                {subscriptionStatus.tier === 'premium' && subscriptionStatus.isActive
                  ? 'Premium features activated'
                  : 'Upgrade for premium features'}
              </p>
            </div>
          </div>
          
          {subscriptionStatus.tier === 'premium' && subscriptionStatus.isActive && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Premium Active
            </div>
          )}
        </div>
      </div>

      {/* Current Plan */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-medium text-gray-900">Current Plan</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className={`p-4 rounded-lg ${
          subscriptionStatus.tier === 'premium' && subscriptionStatus.isActive
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className={`font-semibold ${
                subscriptionStatus.tier === 'premium' ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {subscriptionStatus.tier === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </h5>
              <p className="text-sm text-gray-600">
                {subscriptionStatus.tier === 'premium' && subscriptionStatus.isActive
                  ? `Active until ${formatDate(subscriptionStatus.expirationDate)}`
                  : 'Limited features'}
              </p>
            </div>
            
            {subscriptionStatus.tier === 'premium' && subscriptionStatus.isActive && (
              <div className="flex items-center space-x-1 text-xs text-blue-700">
                <Clock className="h-3 w-3" />
                <span>Renews: {subscriptionStatus.willRenew ? 'Yes' : 'No'}</span>
              </div>
            )}
          </div>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Blockchain Logging</span>
                    </div>
                    {revenueCatService.canUseBlockchainLogging() ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">AI Verification</span>
                    </div>
                    {revenueCatService.canUseAIVerification() ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Expert Co-Signatures</span>
                    </div>
                    {revenueCatService.canUseExpertCoSignature() ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Infinity className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Uploads</span>
                    </div>
                    <span className="text-sm text-gray-700">
                      {revenueCatService.getUploadLimit() === Infinity ? 'Unlimited' : `${revenueCatService.getUploadLimit()} per month`}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Subscription Options */}
      {subscriptionStatus.tier !== 'premium' && (
        <div className="p-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Upgrade Options</h4>
          
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-xl font-bold">Premium Plan</h5>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  Most Popular
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-white/80">/month</span>
              </div>
              
              <p className="text-white/90 mb-6">
                Unlock all premium features for enhanced emergency response and evidence verification
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>Blockchain logging for tamper-proof evidence</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>Advanced AI-powered content verification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>Expert co-signature verification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>Unlimited uploads and verifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>Priority emergency response</span>
                </div>
              </div>
              
              <button
                onClick={() => handlePurchase(revenueCatService.SUBSCRIPTION_TIERS.PREMIUM)}
                disabled={isPurchasing}
                className="w-full py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Subscribe Now</span>
                  </>
                )}
              </button>
              
              <p className="text-center text-white/70 text-xs mt-3">
                First month 50% off - $4.99, then $9.99/month. Cancel anytime.
              </p>
            </div>
            
            <div className="bg-white/10 p-4 text-center">
              <button
                onClick={handleRestorePurchases}
                className="text-white/90 text-sm hover:text-white"
              >
                Restore Purchases
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Why Upgrade?</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Premium features enhance your ability to document and verify critical evidence during emergencies. 
              Blockchain logging ensures tamper-proof records, while AI verification provides deeper analysis 
              and expert co-signatures add professional credibility to your evidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPanel;