import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const SubscriptionPanel = () => {
  const [plans, setPlans] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();

  // Enhanced plan data with modern features
  const defaultPlans = [
    {
      _id: 'basic',
      name: 'Basic Care',
      description: 'Perfect for pet owners with basic veterinary needs',
      price: 299,
      originalPrice: 399,
      type: 'pets',
      duration: 'yearly',
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500',
      gradient: 'from-blue-100 to-cyan-100',
      features: [
        { text: 'Book Appointments', included: true, icon: '📅' },
        { text: 'View Doctor Profiles', included: true, icon: '👨‍⚕️' },
        { text: 'Basic Pet Records', included: true, icon: '📋' },
        { text: 'Email Support', included: true, icon: '📧' },
        { text: '24/7 Emergency Support', included: false, icon: '🚨' },
        { text: 'Priority Booking', included: false, icon: '⚡' },
        { text: 'Advanced Analytics', included: false, icon: '📊' }
      ]
    },
    {
      _id: 'farmer',
      name: 'Farm Pro',
      description: 'Comprehensive care for livestock and farm animals',
      price: 999,
      originalPrice: 1299,
      type: 'farmer',
      duration: 'yearly',
      badge: 'Best Value',
      badgeColor: 'bg-green-500',
      gradient: 'from-green-100 to-emerald-100',
      features: [
        { text: 'All Basic Features', included: true, icon: '✅' },
        { text: 'Livestock Management', included: true, icon: '🐄' },
        { text: 'Bulk Appointment Booking', included: true, icon: '📅' },
        { text: '24/7 Emergency Support', included: true, icon: '🚨' },
        { text: 'Priority Booking', included: true, icon: '⚡' },
        { text: 'Health Reports', included: true, icon: '📈' },
        { text: 'Advanced Analytics', included: false, icon: '📊' }
      ]
    },
    {
      _id: 'dairy',
      name: 'Enterprise Plus',
      description: 'Complete solution for large-scale operations and dairies',
      price: 2999,
      originalPrice: 3999,
      type: 'dairy',
      duration: 'yearly',
      badge: 'Premium',
      badgeColor: 'bg-purple-500',
      gradient: 'from-purple-100 to-pink-100',
      features: [
        { text: 'All Farm Pro Features', included: true, icon: '✅' },
        { text: 'Unlimited Animals', included: true, icon: '🐾' },
        { text: 'Advanced Analytics', included: true, icon: '📊' },
        { text: 'Custom Reports', included: true, icon: '📋' },
        { text: 'API Access', included: true, icon: '🔗' },
        { text: 'Dedicated Support', included: true, icon: '🎯' },
        { text: 'On-site Consultation', included: true, icon: '🏠' }
      ]
    }
  ];

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError('');
      try {
        const plansRes = await api.get('/subscriptions/plans');
        setPlans(plansRes.data?.length > 0 ? plansRes.data : defaultPlans);
        
        try {
          const myRes = await api.get('/subscriptions/my');
          setMySub(myRes.data);
        } catch (subError) {
          // User might not have a subscription yet
          setMySub(null);
        }
      } catch (err) {
        console.warn('API not available, using default plans');
        setPlans(defaultPlans);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    setError('');
    setSuccess('');
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        setError('Please log in to subscribe');
        return;
      }

      // Show confirmation
      if (!window.confirm(`Subscribe to ${plan.name} for ₹${plan.price}/year?`)) {
        return;
      }

      await api.post('/subscriptions/subscribe', { 
        userId: user._id, 
        planType: plan.type 
      });
      
      setSuccess(`Successfully subscribed to ${plan.name}!`);
      setMySub({ plan: plan.name, status: 'active', type: plan.type });
      setSelectedPlan(null);
    } catch (err) {
      setError('Subscription failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <section className="pt-28 pb-20 px-4 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading subscription plans...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-20 sm:pt-28 pb-12 sm:pb-20 px-2 sm:px-4 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 max-w-4xl mx-auto gap-3 sm:gap-0">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-white/50 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 hover:bg-white/70 border border-white/30 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-800 drop-shadow-sm">Subscription Plans</h1>
            <div className="hidden sm:block w-32"></div> {/* Spacer for centering - hidden on mobile */}
          </div>
          
          <p className="text-sm sm:text-lg text-gray-700 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Choose the perfect plan for your veterinary care needs. All plans include our core features with varying levels of support and advanced capabilities.
          </p>

          {/* Current Subscription Status - Responsive */}
          {mySub && (
            <div className="bg-green-100/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 sm:p-4 max-w-md mx-auto mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 text-green-800 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">✅</span>
                <span className="font-semibold">Active: {mySub.plan}</span>
                <span className="text-xs sm:text-sm">({mySub.status})</span>
              </div>
            </div>
          )}

          {/* Messages - Responsive */}
          {error && (
            <div className="bg-red-100/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-3 sm:p-4 max-w-md mx-auto mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 text-red-800 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 sm:p-4 max-w-md mx-auto mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 text-green-800 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">🎉</span>
                <span>{success}</span>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Plans - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto px-2 sm:px-0">
          {plans.map((plan, index) => {
            const isCurrentPlan = mySub && mySub.type === plan.type;
            const isPopular = index === 1; // Middle plan is popular
            
            return (
              <div
                key={plan._id}
                className={`relative bg-gradient-to-br ${plan.gradient || 'from-white to-gray-50'} backdrop-blur-md border border-white/30 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isPopular ? 'ring-2 ring-blue-500/50 md:scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500/50' : ''}`}
              >
                {/* Badge - Responsive */}
                {(plan.badge || isCurrentPlan) && (
                  <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 ${plan.badgeColor || 'bg-blue-500'} text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full`}>
                    {isCurrentPlan ? 'Current Plan' : plan.badge}
                  </div>
                )}

                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Plan Header - Responsive */}
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{plan.description}</p>
                    
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">₹{plan.price}</span>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm text-gray-500">/{plan.duration || 'yearly'}</div>
                          {plan.originalPrice && (
                            <div className="text-xs text-gray-400 line-through">₹{plan.originalPrice}</div>
                          )}
                        </div>
                      </div>
                      {plan.originalPrice && (
                        <div className="text-green-600 text-xs sm:text-sm font-semibold mt-1">
                          Save ₹{plan.originalPrice - plan.price}!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List - Responsive */}
                  <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {(plan.features || []).map((feature, idx) => (
                      <div key={idx} className={`flex items-center gap-2 sm:gap-3 ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        <span className="text-base sm:text-lg">{feature.icon}</span>
                        <span className={`text-xs sm:text-sm ${feature.included ? 'font-medium' : 'line-through'}`}>
                          {feature.text}
                        </span>
                        {feature.included && <span className="ml-auto text-green-500 text-xs sm:text-sm">✓</span>}
                      </div>
                    ))}
                  </div>

                  {/* Subscribe Button - Responsive */}
                  <button
                    onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                    disabled={isCurrentPlan || loading}
                    className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-white transition-all duration-200 text-sm sm:text-base ${
                      isCurrentPlan
                        ? 'bg-green-500/80 cursor-not-allowed'
                        : 'bg-blue-600/90 hover:bg-blue-700/90 hover:shadow-lg backdrop-blur-sm border border-blue-500/30'
                    }`}
                  >
                    {isCurrentPlan ? '✓ Current Plan' : `Subscribe to ${plan.name}`}
                  </button>

                  {/* Additional Info - Responsive */}
                  <div className="mt-3 sm:mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      {plan.duration === 'yearly' ? 'Billed annually' : 'Billed monthly'} • Cancel anytime
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Features Section - Responsive */}
        <div className="mt-12 sm:mt-16 bg-white/30 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Why Choose VetCare?</h2>
            <p className="text-gray-600 text-sm sm:text-base">All plans include our core veterinary care features</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">🏥</div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Expert Veterinarians</h4>
              <p className="text-xs sm:text-sm text-gray-600">Certified professionals with years of experience</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Quick Response</h4>
              <p className="text-xs sm:text-sm text-gray-600">Fast appointment booking and emergency support</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">📱</div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Digital Records</h4>
              <p className="text-xs sm:text-sm text-gray-600">Secure, accessible pet health records</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">🔒</div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Secure & Private</h4>
              <p className="text-xs sm:text-sm text-gray-600">Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </div>

        {/* FAQ Section - Responsive */}
        <div className="mt-12 sm:mt-16 bg-white/30 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center mb-6 sm:mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Can I upgrade my plan anytime?</h4>
              <p className="text-xs sm:text-sm text-gray-600">Yes, you can upgrade your subscription plan at any time. The price difference will be prorated.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">What payment methods do you accept?</h4>
              <p className="text-xs sm:text-sm text-gray-600">We accept all major credit cards, debit cards, UPI, and net banking.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Is there a free trial?</h4>
              <p className="text-xs sm:text-sm text-gray-600">New users get 7 days of Basic Care features for free. No credit card required.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Can I cancel anytime?</h4>
              <p className="text-xs sm:text-sm text-gray-600">Yes, you can cancel your subscription at any time. Your plan will remain active until the end of the billing period.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPanel;
