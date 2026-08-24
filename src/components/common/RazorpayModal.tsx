import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Lock,
  ArrowRight,
  Sparkles,
  Landmark,
  Copy,
  Check
} from 'lucide-react';
import { IAppointment, IBusinessSettings } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: IAppointment;
  onSuccess: (paymentData: any) => void;
}

type PaymentMethodType = 'upi' | 'direct_upi' | 'card' | 'netbanking' | 'wallet';

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { showToast } = useNotifications();
  const [activeMethod, setActiveMethod] = useState<PaymentMethodType>('upi');
  const [upiId, setUpiId] = useState('patient@oksbi');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('qr');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('923');
  const [cardHolder, setCardHolder] = useState(appointment.patientName || 'Patient');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Business settings state
  const [bizSettings, setBizSettings] = useState<IBusinessSettings | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getBusinessSettings().then((res) => {
        if (res.success && res.settings) {
          setBizSettings(res.settings);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('Copied', `${label} copied to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setPaymentError('Please enter a valid 12-digit UTR or Transaction reference number.');
      return;
    }

    setIsSubmittingUtr(true);
    setPaymentError(null);
    try {
      const res = await api.submitUpiProof({
        appointmentId: appointment._id,
        utrNumber: utrNumber.trim(),
        payerUpiId: payerUpiId.trim() || 'UPI-APP',
      });

      if (res.success) {
        showToast('UTR Submitted Successfully! 📋', 'Admin will verify the transaction and confirm your slot.', 'success');
        onSuccess(res);
        onClose();
      } else {
        setPaymentError(res.message || 'Failed to submit proof.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Error submitting UTR reference.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleProcessPayment = async (forceFailure = false) => {
    setIsProcessing(true);
    setPaymentError(null);

    // Simulate gateway latency
    await new Promise((res) => setTimeout(res, 1200));

    if (forceFailure) {
      setIsProcessing(false);
      setPaymentError('Payment was declined by issuing bank (Simulated Test Failure). Please try again.');
      showToast('Payment Failed', 'Transaction could not be completed.', 'error');
      return;
    }

    try {
      const paymentId = 'pay_rzp_' + Math.random().toString(36).substr(2, 9);
      const signature = 'sig_' + Math.random().toString(36).substr(2, 16);

      let methodLabel = 'UPI';
      if (activeMethod === 'upi') methodLabel = `UPI (${upiApp === 'qr' ? 'QR Code Scan' : upiApp.toUpperCase() + ' - ' + upiId})`;
      else if (activeMethod === 'card') methodLabel = `Card (Visa ending in ${cardNumber.slice(-4)})`;
      else if (activeMethod === 'netbanking') methodLabel = `Net Banking (${selectedBank})`;
      else if (activeMethod === 'wallet') methodLabel = `Wallet (${selectedWallet})`;

      const res = await api.verifyPayment({
        appointmentId: appointment._id,
        orderId: appointment.orderId || `order_MC${Date.now()}`,
        paymentId,
        signature,
        method: methodLabel,
        isTestMode: true,
      });

      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#0284c7', '#10b981', '#6366f1'],
        });

        showToast('Payment Successful', `₹${appointment.amount} received. Appointment confirmed!`, 'success');
        onSuccess(res);
        onClose();
      } else {
        setPaymentError(res.message || 'Payment verification failed.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const effectiveUpi = bizSettings?.businessUpiId || 'medicare.billing@okhdfcbank';
  const hospitalTitle = bizSettings?.hospitalName || 'MediCare Hospital';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight">Direct Hospital Payment Gateway</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Direct Settlement
                  </span>
                </div>
                <p className="text-xs text-blue-100/90">{hospitalTitle} Official Billing System</p>
              </div>
            </div>
            <button
              id="razorpay-modal-close"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close payment modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount & Summary Bar */}
          <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-blue-100/90 font-medium">Consultation with {appointment.doctorName}</p>
              <p className="text-xs text-blue-200/80">{appointment.hospitalName} • {appointment.appointmentDate} at {appointment.appointmentTime}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-200 uppercase tracking-wider block">Total Payable</span>
              <span className="text-2xl font-black tracking-tight text-white">₹{appointment.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment Error Alert */}
        {paymentError && (
          <div className="m-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p className="font-bold">Transaction Notice</p>
              <p className="text-[11px] mt-0.5">{paymentError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
          {/* Method Selection Sidebar */}
          <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950/50 p-4 border-r border-slate-200 dark:border-slate-800 flex flex-row md:flex-col gap-1.5 overflow-x-auto">
            <button
              id="pay-method-direct-upi"
              onClick={() => setActiveMethod('direct_upi')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                activeMethod === 'direct_upi'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-4 h-4 flex-shrink-0" />
              <span>Direct Hospital UPI / Bank</span>
            </button>

            <button
              id="pay-method-upi"
              onClick={() => setActiveMethod('upi')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                activeMethod === 'upi'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-4 h-4 flex-shrink-0" />
              <span>Instant Online UPI</span>
            </button>

            <button
              id="pay-method-card"
              onClick={() => setActiveMethod('card')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                activeMethod === 'card'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span>Cards (Debit/Credit)</span>
            </button>

            <button
              id="pay-method-netbanking"
              onClick={() => setActiveMethod('netbanking')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                activeMethod === 'netbanking'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>Net Banking</span>
            </button>

            <button
              id="pay-method-wallet"
              onClick={() => setActiveMethod('wallet')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                activeMethod === 'wallet'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Wallet className="w-4 h-4 flex-shrink-0" />
              <span>Wallets</span>
            </button>

            <div className="mt-auto hidden md:block pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                <Lock className="w-3 h-3" /> Direct Hospital Settlement
              </div>
              <p>Funds credit directly to hospital bank account.</p>
            </div>
          </div>

          {/* Payment Method Details Area */}
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between">
            {/* DIRECT HOSPITAL UPI & BANK TRANSFER WITH UTR */}
            {activeMethod === 'direct_upi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Scan Hospital QR & Enter 12-Digit UTR
                    </h4>
                    <p className="text-[11px] text-slate-500">Pay directly from any UPI App to hospital account</p>
                  </div>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    0% Commission
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Official UPI ID</span>
                      <p className="text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200 select-all">
                        {effectiveUpi}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(effectiveUpi, 'UPI ID')}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold text-indigo-600 flex items-center gap-1 shadow-sm"
                    >
                      {copiedField === 'UPI ID' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'UPI ID' ? 'Copied' : 'Copy UPI'}</span>
                    </button>
                  </div>

                  {bizSettings?.accountNumber && (
                    <div className="pt-2 border-t border-indigo-200/40 dark:border-indigo-900/40 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400">Bank & Branch:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{bizSettings.bankName}, {bizSettings.branch}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">A/C & IFSC:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{bizSettings.accountNumber} ({bizSettings.ifscCode})</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitUtr} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      12-Digit UTR / Transaction Reference Number *
                    </label>
                    <input
                      id="utr-number-input"
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 423589123456"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Found on your Google Pay / PhonePe / Paytm payment receipt.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Your UPI ID / Phone (Optional)
                    </label>
                    <input
                      id="payer-upi-input"
                      type="text"
                      value={payerUpiId}
                      onChange={(e) => setPayerUpiId(e.target.value)}
                      placeholder="e.g. 9876543210@paytm"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <button
                    id="submit-utr-btn"
                    type="submit"
                    disabled={isSubmittingUtr}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmittingUtr ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit UTR & Confirm Slot Booking</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Instant UPI Option */}
            {activeMethod === 'upi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Instant Online UPI Payment</span>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Instant Token Dispatch</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'qr', label: 'Scan QR', icon: QrCode },
                    { id: 'gpay', label: 'Google Pay', icon: Smartphone },
                    { id: 'phonepe', label: 'PhonePe', icon: Smartphone },
                    { id: 'paytm', label: 'Paytm UPI', icon: Smartphone },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUpiApp(item.id as any)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all text-[11px] font-semibold ${
                        upiApp === item.id
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {upiApp === 'qr' ? (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-4">
                    <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-slate-900" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Direct Hospital UPI QR</p>
                      <p className="text-[11px]">{effectiveUpi}</p>
                      <p className="text-[10px] text-slate-400">Scan using any UPI App for instant automated checkout.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Virtual Payment Address (UPI ID)
                    </label>
                    <div className="relative">
                      <input
                        id="upi-id-input"
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi or name@oksbi"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card Option */}
            {activeMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card Number
                  </label>
                  <input
                    id="card-number-input"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 0000 0000 0000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      id="card-expiry-input"
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      CVV / CVC
                    </label>
                    <input
                      id="card-cvv-input"
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    id="card-holder-input"
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Name as on Card"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>
              </div>
            )}

            {/* Net Banking */}
            {activeMethod === 'netbanking' && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Popular Indian Banks</span>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        selectedBank === bank
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallets */}
            {activeMethod === 'wallet' && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Digital Wallet</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map((wallet) => (
                    <button
                      key={wallet}
                      type="button"
                      onClick={() => setSelectedWallet(wallet)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        selectedWallet === wallet
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar for non-direct UPI */}
            {activeMethod !== 'direct_upi' && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    id="pay-fail-test-btn"
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleProcessPayment(true)}
                    className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-colors rounded-xl border border-slate-200 dark:border-slate-800"
                    title="Simulate bank gateway decline"
                  >
                    Test Decline
                  </button>
                </div>

                <button
                  id="razorpay-confirm-pay-btn"
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessPayment(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying with Bank...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Pay ₹{appointment.amount.toLocaleString('en-IN')} Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
