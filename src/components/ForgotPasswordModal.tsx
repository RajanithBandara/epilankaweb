'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import { account } from '@/lib/appwrite';
import { AppwriteException } from 'appwrite';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ForgotStep = 'email' | 'reset' | 'success';

function InputField({
  id,
  label,
  type,
  value,
  placeholder,
  icon,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-widest transition-colors duration-200"
        style={{ color: focused ? '#1e40af' : '#64748b' }}
      >
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl border transition-all duration-200"
        style={{
          borderColor: focused ? '#3b82f6' : '#e2e8f0',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
          backgroundColor: focused ? '#fff' : '#f8fafc',
        }}
      >
        <span
          className="absolute left-3.5 transition-colors duration-200"
          style={{ color: focused ? '#3b82f6' : '#94a3b8' }}
        >
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={focused || value ? placeholder : ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      {hint && (
        <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>
      )}
    </div>
  );
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  preFilledUserId?: string;
  preFilledCode?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  preFilledUserId = '',
  preFilledCode = '',
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ForgotStep>(preFilledCode ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState(preFilledCode);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(preFilledUserId);

  const handleResetEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      // Create a password recovery token that sends users to the dedicated reset page
      const recoveryUrl = `${window.location.origin}/reset-password`;
      const token = await account.createRecovery(email, recoveryUrl);

      setUserId(token.userId);
      setStep('success');
      setNotice(`We sent a password reset link to ${email}. Open the email to set a new password.`);
    } catch (err) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send recovery email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (!resetCode.trim()) {
        setError('Please enter the recovery code from your email.');
        return;
      }

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      // Use the recovery token to update password
      // The updateRecovery method takes: userId, secret (code), password, passwordAgain
      await account.updateRecovery(userId, resetCode.trim(), newPassword);

      setStep('success');
      setEmail('');
      setNewPassword('');
      setResetCode('');
    } catch (err) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. Please check your code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(preFilledCode ? 'reset' : 'email');
    setEmail('');
    setNewPassword('');
    setResetCode(preFilledCode);
    setError('');
    setNotice('');
    setUserId(preFilledUserId);
    // Clear URL params if they were in the URL
    if (preFilledCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    onClose();
  };

  const handleStartOver = () => {
    setStep(preFilledCode ? 'reset' : 'email');
    setEmail('');
    setNewPassword('');
    setResetCode(preFilledCode);
    setError('');
    setNotice('');
    setUserId(preFilledUserId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                      Reset your password
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Enter your email to receive a password reset code.
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleResetEmail} className="space-y-5">
                    <InputField
                      id="email"
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      icon={<Mail className="h-4 w-4" />}
                      value={email}
                      onChange={setEmail}
                      hint="We'll send a recovery code to this email."
                    />

                    <motion.button
                      type="submit"
                      disabled={loading || !email}
                      className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/30 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c7bb3 100%)',
                      }}
                      whileHover={loading || !email ? undefined : { scale: 1.01, y: -1 }}
                      whileTap={loading || !email ? undefined : { scale: 0.99 }}
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending code…
                          </>
                        ) : (
                          <>
                            Send reset code
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {step === 'reset' && (
                <motion.div
                  key="reset-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                      Create new password
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {preFilledCode
                        ? 'Enter your new password to complete the reset.'
                        : 'Enter the code from your email and your new password.'}
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {notice && (
                    <motion.div
                      className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <p className="text-sm font-medium text-blue-700">{notice}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {!preFilledCode && (
                      <InputField
                        id="code"
                        label="Recovery code"
                        type="text"
                        placeholder="Enter code from your email"
                        icon={<Mail className="h-4 w-4" />}
                        value={resetCode}
                        onChange={setResetCode}
                        hint="Code expires in 1 hour."
                      />
                    )}

                    <InputField
                      id="new-password"
                      label="New password"
                      type="password"
                      placeholder="Create a strong password"
                      icon={<Lock className="h-4 w-4" />}
                      value={newPassword}
                      onChange={setNewPassword}
                      hint="Use 8+ characters with numbers and symbols."
                    />

                    <motion.button
                      type="submit"
                      disabled={loading || !newPassword}
                      className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/30 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c7bb3 100%)',
                      }}
                      whileHover={loading || !newPassword ? undefined : { scale: 1.01, y: -1 }}
                      whileTap={loading || !newPassword ? undefined : { scale: 0.99 }}
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Resetting…
                          </>
                        ) : (
                          <>
                            Reset password
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="w-full py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Start over
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <motion.div
                    className="mb-4 flex justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                  >
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </motion.div>

                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Check your email
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    We sent a reset link to your inbox. Open it to continue changing your password.
                  </p>

                  <motion.button
                    type="button"
                    onClick={handleClose}
                    className="group relative mt-6 w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/30 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c7bb3 100%)',
                    }}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center justify-center gap-2">
                      Back to sign in
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}







