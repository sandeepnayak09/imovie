import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import { loadRazorpayScript } from '../utils/razorpay';
import { useAuth } from '../context/AuthContext';

const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sublabel: 'Visa, Mastercard, RuPay',
    icon: CreditCard,
    badge: 'Recommended',
    color: '#00a8e1',
  },
  {
    id: 'upi',
    label: 'UPI / QR Code',
    sublabel: 'GPay, PhonePe, Paytm, BHIM',
    icon: QrCode,
    badge: 'Instant',
    color: '#06b6d4',
  },
  {
    id: 'wallet',
    label: 'Digital Wallets',
    sublabel: 'Mobikwik, Airtel, Ola Money',
    icon: Wallet,
    badge: 'Verified',
    color: '#10b981',
  },
  {
    id: 'netbanking',
    label: 'Netbanking',
    sublabel: 'Canara, HDFC, SBI, ICICI (50+ Banks)',
    icon: Building,
    badge: '50+ Banks',
    color: '#f59e0b',
  },
  {
    id: 'all',
    label: 'All Payment Options',
    sublabel: 'View all Razorpay instruments',
    icon: Sparkles,
    badge: 'Standard',
    color: '#a855f7',
  },
];

const PaymentModal = ({
  isOpen,
  onClose,
  show,
  selectedSeats = [],
  seatDetails = [],
  totalAmount,
  convenienceFee,
  taxes,
  onConfirmPayment,
  isProcessing,
  onPaymentSuccess,
}) => {
  const { user } = useAuth();
  // Default to card for reliable sandbox simulation
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showTestGuide, setShowTestGuide] = useState(true);
  const [copiedItem, setCopiedItem] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text, itemKey) => {
    navigator.clipboard?.writeText(text);
    setCopiedItem(itemKey);
    toast.success(`Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedItem(''), 2500);
  };

  // Trigger Razorpay Checkout
  const handleRazorpayPayment = async () => {
    try {
      setPaymentError(null);
      setIsRazorpayLoading(true);

      // 1. Ensure Razorpay checkout.js script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to connect to Razorpay secure checkout CDN. Please check your network connection.');
      }

      // 2. Request fresh order_id from Backend /api/payment/create-order
      const orderPayload = {
        amount: totalAmount,
        showId: String(show?.showId || show?._id),
        selectedSeats,
        userEmail: user?.email || 'customer@imovies.com',
      };

      const orderRes = await api.post('/payment/create-order', orderPayload);

      if (!orderRes.data?.success || !orderRes.data.order_id) {
        throw new Error(orderRes.data?.message || 'Failed to initialize Razorpay payment order on the server.');
      }

      const { order_id, amount, currency, key_id } = orderRes.data;

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: key_id,
        amount: amount, // in paise
        currency: currency || 'INR',
        name: 'iMovies Tickets',
        description: `${show?.movieName || 'Movie Booking'} • ${selectedSeats.join(', ')}`,
        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=128&q=80',
        order_id: order_id,
        prefill: {
          name: user?.username || 'Cinephile',
          email: user?.email || 'customer@imovies.com',
          contact: user?.phone && user.phone.length === 10 ? user.phone : '9876543210',
          ...(selectedMethod !== 'all' ? { method: selectedMethod } : {}),
        },
        notes: {
          showId: String(show?.showId || show?._id),
          theatre: String(show?.theatreName || 'iMovies Multiplex'),
          seats: selectedSeats.join(', '),
          city: show?.city || 'National',
        },
        theme: {
          color: '#00a8e1', // Sleek Amazon Prime Blue accent
        },
        // Configure display blocks to prioritize reliable test instruments
        config: {
          display: {
            blocks: {
              cards: {
                name: 'Cards (Visa / Mastercard)',
                instruments: [{ method: 'card' }],
              },
              upi: {
                name: 'UPI / QR Code',
                instruments: [{ method: 'upi' }],
              },
              wallets: {
                name: 'Digital Wallets (Mobikwik / Airtel)',
                instruments: [{ method: 'wallet' }],
              },
              banks: {
                name: 'Netbanking (Canara, HDFC, SBI, ICICI)',
                instruments: [
                  {
                    method: 'netbanking',
                    banks: ['CNRB', 'HDFC', 'SBIN', 'ICIC'],
                  },
                ],
              },
            },
            sequence: ['block.cards', 'block.upi', 'block.wallets', 'block.banks'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        modal: {
          backdropclose: false,
          escape: true,
          ondismiss: function () {
            setIsRazorpayLoading(false);
            toast.info('Payment checkout dismissed. You can retry before your seat lock timer expires.');
          },
        },
        // 4. Verification Handler Callback
        handler: async function (response) {
          try {
            setIsRazorpayLoading(true);
            setPaymentError(null);

            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingDetails: {
                showId: show?.showId || show?._id,
                selectedSeats,
                seatDetails,
                totalAmount,
                convenienceFee,
                taxes,
                userEmail: user?.email,
                paymentMethod: `Razorpay (${selectedMethod.toUpperCase()})`,
              },
            });

            if (verifyRes.data?.success) {
              try {
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#00a8e1', '#E50914', '#ffffff', '#f59e0b'],
                });
              } catch {}

              toast.success('Payment verified successfully! Your Prime tickets have been confirmed.');

              if (onPaymentSuccess) {
                onPaymentSuccess(verifyRes.data.booking);
              } else if (onConfirmPayment) {
                onConfirmPayment({
                  paymentMethod: 'Razorpay Gateway',
                  transactionId: response.razorpay_payment_id,
                  booking: verifyRes.data.booking,
                });
              }
            } else {
              throw new Error(verifyRes.data?.message || 'Payment signature verification failed.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            const errMsg = err.response?.data?.message || err.message || 'Payment verification failed.';
            setPaymentError({
              title: 'Verification Failed',
              description: errMsg,
              reason: 'signature_mismatch',
              advice: 'The payment was processed but verification failed. If your account was charged, please contact support.',
            });
            toast.error(errMsg);
          } finally {
            setIsRazorpayLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Capture and display real payment failures from Razorpay
      razorpayInstance.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);

        const errorInfo = {
          title: response.error?.description || 'Payment Declined',
          code: response.error?.code || 'BAD_REQUEST_ERROR',
          reason: response.error?.reason || 'declined',
          source: response.error?.source || 'gateway',
          step: response.error?.step || 'payment_authorization',
          order_id: response.error?.metadata?.order_id || order_id,
          payment_id: response.error?.metadata?.payment_id,
        };

        let advice = 'You can retry with another payment instrument or card.';
        if (response.error?.description?.includes('domestic') || response.error?.description?.includes('Indian')) {
          advice = 'Your Razorpay account only accepts Domestic (Indian) cards. Please use test card 4100 2800 0000 1007 (Visa) or 5555 5100 0008 1006 (Mastercard).';
        } else if (response.error?.reason === 'payment_cancelled') {
          advice = 'Transaction was cancelled on the authorization screen. If using Netbanking/Wallet simulator, remember to click the green "Success" button.';
        } else if (response.error?.step === 'payment_authentication') {
          advice = 'Authentication failed at your bank. In Test Mode, please select Domestic Test Card (4100 2800 0000 1007) or Wallets (Mobikwik/Airtel).';
        }

        setPaymentError({
          ...errorInfo,
          advice,
        });

        toast.error(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        setIsRazorpayLoading(false);

        // Notify backend of failure
        api.post('/payment/cancel-or-fail', {
          showId: show?.showId || show?._id,
          selectedSeats,
          errorDetails: errorInfo,
          userEmail: user?.email,
        }).catch(() => {});
      });

      razorpayInstance.open();
    } catch (error) {
      console.error('Razorpay launch error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Error launching Razorpay payment gateway.';
      setPaymentError({
        title: 'Gateway Initialization Error',
        description: errMsg,
        advice: 'Please ensure your network is connected and your seat reservation is active.',
      });
      toast.error(errMsg);
      setIsRazorpayLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#2a3b4c]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0f171e]">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#00a8e1] px-2 py-0.5 rounded">
              Razorpay Secured
            </span>
            <h3 className="text-base font-bold text-white">Order Summary & Payment</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing || isRazorpayLoading}
            className="text-[#8197a4] hover:text-white p-1 rounded-full hover:bg-[#253342] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Booking Details Summary */}
          <div className="bg-[#0f171e]/70 p-4 rounded-xl border border-[#2a3b4c]/60">
            <h4 className="font-bold text-white text-base truncate">{show?.movieName}</h4>
            <p className="text-xs text-[#8197a4] mt-0.5 truncate">
              {show?.theatreName} • {show?.theatreLocation}
            </p>
            <div className="flex items-center space-x-3 text-xs text-[#00a8e1] font-semibold mt-2">
              <span>
                {show?.showDate
                  ? new Date(show.showDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Today'}
              </span>
              <span>•</span>
              <span>{show?.showTime}</span>
              <span>•</span>
              <span className="text-white">{show?.screenFormat || 'IMAX 4K'}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2a3b4c]/60 flex items-center justify-between text-xs">
              <span className="text-[#8197a4]">Reserved Seats ({selectedSeats.length}):</span>
              <span className="font-bold text-white tracking-wide">
                {selectedSeats.join(', ')}
              </span>
            </div>
          </div>

          {/* Real Payment Error Banner (if error occurred) */}
          {paymentError && (
            <div className="bg-red-950/60 border border-red-500/80 rounded-xl p-4 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center space-x-2 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm">{paymentError.title}</span>
              </div>
              <p className="text-gray-300 leading-relaxed">{paymentError.description}</p>
              {paymentError.advice && (
                <div className="bg-black/40 p-2.5 rounded-lg border border-red-500/30 text-[11px] text-red-200">
                  <span className="font-semibold text-white">How to resolve: </span>
                  {paymentError.advice}
                </div>
              )}
              {paymentError.payment_id && (
                <p className="text-[10px] font-mono text-[#8197a4]">
                  Payment ID: {paymentError.payment_id}
                </p>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8197a4]">
                Choose Payment Method
              </label>
              <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-bold uppercase">
                Razorpay Test Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setPaymentError(null);
                    }}
                    className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#00a8e1]/15 border-[#00a8e1] shadow-sm ring-1 ring-[#00a8e1]'
                        : 'bg-[#0f171e] border-[#2a3b4c] hover:border-[#8197a4] text-[#8197a4]'
                    }`}
                  >
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{
                        backgroundColor: isSelected ? `${method.color}25` : '#1a242f',
                        color: isSelected ? method.color : '#8197a4',
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {method.label}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            method.badge === 'Recommended'
                              ? 'bg-[#00a8e1]/20 text-[#00a8e1] border border-[#00a8e1]/40'
                              : 'bg-[#1a242f] text-[#8197a4]'
                          }`}
                        >
                          {method.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8197a4] truncate mt-0.5">
                        {method.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Razorpay Test Mode Guide */}
          <div className="bg-[#0f171e]/80 border border-[#2a3b4c] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTestGuide(!showTestGuide)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-white hover:bg-[#1a242f]/50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#00a8e1]" />
                <span>Test Mode Simulation Guide (How to Authorize)</span>
              </div>
              {showTestGuide ? <ChevronUp className="w-4 h-4 text-[#8197a4]" /> : <ChevronDown className="w-4 h-4 text-[#8197a4]" />}
            </button>

            {showTestGuide && (
              <div className="p-3 pt-0 space-y-2.5 text-[11px] border-t border-[#2a3b4c]/60">
                <p className="text-[#8197a4] leading-relaxed">
                  Use the following verified Razorpay test credentials to authorize payments instantly:
                </p>

                {/* Cards Guide - Domestic Indian Cards */}
                <div className="bg-[#1a242f] p-3 rounded-lg border border-[#00a8e1]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#00a8e1] font-bold block">
                        💳 Domestic Test Card (Visa Debit)
                      </span>
                      <span className="font-mono text-white text-xs tracking-wider">4100 2800 0000 1007</span>
                      <span className="text-[#8197a4] text-[10px] ml-2">Exp: 12/30 • CVV: 123</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('4100280000001007', 'card-visa')}
                      className="p-1.5 rounded-lg bg-[#0f171e] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors shrink-0 ml-2"
                      title="Copy Visa Test Card Number"
                    >
                      {copiedItem === 'card-visa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2a3b4c]/60">
                    <div>
                      <span className="text-purple-400 font-bold block">
                        💳 Domestic Test Card (Mastercard)
                      </span>
                      <span className="font-mono text-white text-xs tracking-wider">5555 5100 0008 1006</span>
                      <span className="text-[#8197a4] text-[10px] ml-2">Exp: 12/30 • CVV: 123</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('5555510000081006', 'card-mc')}
                      className="p-1.5 rounded-lg bg-[#0f171e] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors shrink-0 ml-2"
                      title="Copy Mastercard Test Card Number"
                    >
                      {copiedItem === 'card-mc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[10px] text-emerald-400 pt-1">
                    ✓ Mock OTP Simulation: Enter <strong>1234</strong> or click green <strong>"Success"</strong> button
                  </p>
                  <p className="text-[10px] text-amber-400/90">
                    ⚠️ Note: Do not use international test cards (4111 1111 1111 1111) as this account only accepts domestic Indian cards.
                  </p>
                </div>

                {/* Wallets Guide */}
                <div className="bg-[#1a242f] p-2.5 rounded-lg border border-[#2a3b4c]">
                  <span className="text-emerald-400 font-semibold block">👛 Wallets (Verified Working):</span>
                  <p className="text-gray-300 text-[10px] mt-0.5">
                    Select <strong>Mobikwik</strong> or <strong>Airtel Money</strong>. On the test screen, enter any OTP and click <strong>"Success"</strong>.
                  </p>
                </div>

                {/* UPI Guide */}
                <div className="bg-[#1a242f] p-2.5 rounded-lg border border-[#2a3b4c] flex items-center justify-between">
                  <div>
                    <span className="text-cyan-400 font-semibold block">📱 Test UPI ID:</span>
                    <span className="font-mono text-white text-xs">success@razorpay</span>
                    <span className="text-[#8197a4] text-[10px] ml-2">Instant Approval</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('success@razorpay', 'upi')}
                    className="p-1.5 rounded-lg bg-[#0f171e] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors shrink-0 ml-2"
                    title="Copy Test UPI ID"
                  >
                    {copiedItem === 'upi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Netbanking Note */}
                <div className="bg-[#1a242f] p-2.5 rounded-lg border border-amber-500/30 space-y-1">
                  <span className="text-amber-400 font-semibold block">🏦 Netbanking in Sandbox:</span>
                  <p className="text-gray-300 text-[10px] leading-relaxed">
                    Select <strong>Canara Bank (CNRB)</strong>, <strong>HDFC</strong>, or <strong>SBI</strong>. Click the green <strong className="text-emerald-400">"Success"</strong> button on the simulator page.
                  </p>
                  <p className="text-[10px] text-amber-300/80">
                    ⚠️ <em>Avoid Bank of Baroda in Test Mode</em>: Razorpay's sandbox mock for Bank of Baroda is currently unresponsive. Use <strong>Cards</strong>, <strong>Wallets</strong>, or <strong>Canara Bank</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-1.5 text-xs pt-2">
            <div className="flex justify-between text-[#8197a4]">
              <span>Base Seat Price:</span>
              <span className="text-white font-medium">₹{totalAmount - convenienceFee - taxes}</span>
            </div>
            <div className="flex justify-between text-[#8197a4]">
              <span>Convenience Fee (5%):</span>
              <span className="text-white font-medium">₹{convenienceFee}</span>
            </div>
            <div className="flex justify-between text-[#8197a4]">
              <span>Integrated Taxes (3%):</span>
              <span className="text-white font-medium">₹{taxes}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-[#2a3b4c]">
              <span>Total Payable:</span>
              <span className="text-[#00a8e1] text-base font-black">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer / Trigger Button */}
        <div className="p-6 bg-[#0f171e] flex flex-col space-y-3">
          <button
            type="button"
            onClick={handleRazorpayPayment}
            disabled={isRazorpayLoading || isProcessing}
            className="w-full flex items-center justify-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3.5 rounded-xl font-bold text-sm shadow-xl hover:shadow-cyanGlow transition-all duration-200 disabled:opacity-50"
          >
            {isRazorpayLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting to Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Pay ₹{totalAmount} with Razorpay ({PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label || 'Card'})
                </span>
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-[#8197a4] flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit SSL Encrypted • Real-time HMAC SHA-256 Signature Verification</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
