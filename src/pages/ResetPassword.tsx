'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { AppwriteException } from 'appwrite';
import { account } from '@/lib/appwrite';

type ResetPasswordSearchParams = {
  userId?: string | string[];
  secret?: string | string[];
  expire?: string | string[];
};

interface ResetPasswordPageProps {
  searchParams?: ResetPasswordSearchParams;
}

function normalizeQueryValue(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

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
  icon: ReactNode;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all duration-200 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-blue-400 dark:focus-within:bg-slate-950">
        <span className="absolute left-3.5 text-slate-400 transition-colors duration-200 focus-within:text-blue-500 dark:text-slate-500">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          autoComplete={id}
        />
      </div>
      {hint && <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [clientQuery, setClientQuery] = useState({
    userId: '',
    secret: '',
    expire: '',
  });

  const serverQuery = useMemo(() => ({
    userId: normalizeQueryValue(searchParams?.userId),
    secret: normalizeQueryValue(searchParams?.secret),
    expire: normalizeQueryValue(searchParams?.expire),
  }), [searchParams?.expire, searchParams?.secret, searchParams?.userId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    setClientQuery({
      userId: urlParams.get('userId') ?? '',
      secret: urlParams.get('secret') ?? '',
      expire: urlParams.get('expire') ?? '',
    });
  }, []);

  const userId = serverQuery.userId || clientQuery.userId;
  const secret = serverQuery.secret || clientQuery.secret;
  const expire = serverQuery.expire || clientQuery.expire;

  const hasRecoveryLink = Boolean(userId && secret);
  const expiresAt = useMemo(() => (expire ? new Date(expire) : null), [expire]);
  const isExpired = Boolean(expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now());
  const expirationLabel = useMemo(() => {
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(expiresAt);
  }, [expiresAt]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const clearSensitiveUrl = () => {
    window.history.replaceState({}, document.title, '/reset-password');
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!hasRecoveryLink) {
      setError('This reset page is missing the recovery link parameters. Please open the email link again.');
      return;
    }

    if (isExpired) {
      setError('This reset link has expired. Please request a new password reset email.');
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await account.updateRecovery(userId, secret, password);
      setSuccess(true);
      clearSensitiveUrl();
    } catch (err) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to reset your password right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!hasRecoveryLink) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <motion.section
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-10"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white shadow-lg shadow-blue-300/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">EpiLanka</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Password reset</p>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Reset your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              This page opens from the recovery link in your email. If you got here directly, please request a new reset email from the login page.
            </p>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              The link must include <span className="font-semibold">userId</span> and <span className="font-semibold">secret</span> parameters.
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#0EA5A4] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/30 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Back to login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.section>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <motion.section
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-10 text-center"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Password updated
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#0EA5A4] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/30 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Back to login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,58,138,0.14),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <motion.section
          className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 lg:grid-cols-[1.05fr_0.95fr]"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hidden flex-col justify-between bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] p-10 text-white lg:flex">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">EpiLanka</p>
                  <p className="text-xs text-blue-100/90">Secure password recovery</p>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Set a new password.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-blue-100">
                Use the secure recovery link from your email to finish the password reset and continue back to the dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur-sm">
              If the link was opened from email, your recovery details are already loaded from the URL.
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white shadow-lg shadow-blue-300/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">EpiLanka</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Password reset</p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create a new password
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {expirationLabel
                ? `This recovery link expires on ${expirationLabel}.`
                : 'Enter a strong new password to secure your account.'}
            </p>

            {isExpired && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  This recovery link has expired. Please request a new reset email from the login page.
                </p>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <InputField
                id="password"
                label="New password"
                type="password"
                value={password}
                placeholder="Create a strong password"
                icon={<Lock className="h-4 w-4" />}
                onChange={setPassword}
                hint="Use at least 8 characters with numbers or symbols."
              />

              <InputField
                id="confirm-password"
                label="Confirm password"
                type="password"
                value={confirmPassword}
                placeholder="Re-enter your password"
                icon={<Lock className="h-4 w-4" />}
                onChange={setConfirmPassword}
              />

              <motion.button
                type="submit"
                disabled={loading || isExpired}
                className="group relative mt-2 w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/30 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c7bb3 100%)',
                }}
                whileHover={loading || isExpired ? undefined : { scale: 1.01, y: -1 }}
                whileTap={loading || isExpired ? undefined : { scale: 0.99 }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating password…
                    </>
                  ) : (
                    <>
                      Reset password
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Remembered your password?{' '}
              <Link href="/login" className="font-semibold text-[#1E3A8A] hover:underline dark:text-blue-400">
                Back to login
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}




