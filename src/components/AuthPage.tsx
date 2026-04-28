'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { account, ID } from '@/lib/appwrite';
import { AppwriteException, OAuthProvider } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  initialMode?: AuthMode;
}

const features = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Verified Access',
    description: 'Secure sessions with cryptographically signed tokens',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Insight Engine',
    description: 'AI-assisted forecasting to stay ahead of outbreaks',
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Map Intelligence',
    description: 'District-level heatmaps & real-time signals',
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Proactive Alerts',
    description: 'Instant notices for high-risk zones',
  },
];

function Orb({ className }: { className: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-30 ${className}`}
    />
  );
}

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  onChange: (v: string) => void;
  hint?: string;
  showToggle?: boolean;
}

function InputField({
  id,
  label,
  type,
  value,
  placeholder,
  icon,
  required,
  onChange,
  hint,
  showToggle,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const active = focused || value.length > 0;
  const inputType = showToggle ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 transition-colors duration-200"
        style={{ color: focused ? '#1e40af' : undefined }}
      >
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl border bg-slate-50 transition-all duration-200"
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
          type={inputType}
          value={value}
          required={required}
          placeholder={active ? placeholder : ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent py-2.5 pl-10 pr-4 text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
          style={{ paddingRight: showToggle ? '3rem' : undefined }}
          autoComplete={id === 'password' ? 'current-password' : id === 'email' ? 'email' : 'username'}
        />
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors duration-150"
          >
            {!show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && (
        <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpUserId, setOtpUserId] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const isLogin = mode === 'login';

  useEffect(() => {
    setOtpCode('');
    setOtpUserId('');
    setOtpStep(false);
    setNotice('');
    setError('');
    setLoading(false);
  }, [mode]);

  // Auto-redirect if already authenticated; clean up stale SDK sessions
  useEffect(() => {
    // If URL has ?error, display it
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError(params.get('error') || 'Authentication failed');
    }

    account.get()
      .then(() => {
        // If there's an error from oauth callback we shouldn't redirect to dashboard if the cookie part failed
        if (!params.get('error')) {
           router.replace('/dashboard');
        }
      })
      .catch(async () => {
        // Session may be stored locally in the SDK but expired/invalid on server.
        // Delete it so createEmailPasswordSession doesn't throw on next login.
        try { await account.deleteSession('current'); } catch { /* nothing to delete */ }
      });
  }, [router]);

  async function handleOAuthLogin(provider: OAuthProvider, providerLabel: string) {
    try {
      // Clear out old sessions if any to prevent issues
      try { await account.deleteSession('current'); } catch { /* no session */ }

      // We redirect back to a special oauth page that will generate JWT and set HttpOnly cookies
      const successURL = `${window.location.origin}/auth/oauth?provider=${provider}`;
      const failureURL = `${window.location.origin}/login?error=${encodeURIComponent(`${providerLabel} login cancelled or failed`)}`;
      
      account.createOAuth2Session(provider, successURL, failureURL);
    } catch {
      setError(`Failed to initialize ${providerLabel} login`);
    }
  }

  async function handleGoogleLogin() {
    await handleOAuthLogin(OAuthProvider.Google, 'Google');
  }

  async function handleMicrosoftLogin() {
    await handleOAuthLogin(OAuthProvider.Microsoft, 'Microsoft');
  }

  async function sendSignupOtp(targetEmail: string, userId: string) {
    const token = await account.createEmailToken({
      userId,
      email: targetEmail,
    });

    setOtpUserId(token.userId);
    setOtpStep(true);
    setNotice(`We sent a one-time code to ${targetEmail}. Enter it below to verify your email.`);
  }

  async function handleResendOtp() {
    if (!email || !otpUserId) {
      setError('Missing email or user context. Please restart signup.');
      return;
    }

    setError('');
    setNotice('');
    setLoading(true);

    try {
      await sendSignupOtp(email, otpUserId);
    } catch (err) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (isLogin) {
        // Always delete any stale session first — prevents
        // "Creation of a session is prohibited when a session is active"
        try { await account.deleteSession('current'); } catch { /* no session */ }

        // 1. Create fresh Appwrite session
        await account.createEmailPasswordSession(email, password);

        // 2. Get a short-lived JWT for the backend
        const jwtObj = await account.createJWT();

        // 3. Store JWT in HttpOnly cookie & sync profile with FastAPI
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt: jwtObj.jwt }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message || 'Session creation failed');
          return;
        }

        // Refresh AuthContext so the dashboard immediately has the user
        await refreshUser();
        router.push('/dashboard');
      } else {
        if (!otpStep) {
          // 1. Create Appwrite account with password
          const newUserId = ID.unique();
          await account.create(newUserId, email, password, username);

          // 2. Send email OTP for verification
          await sendSignupOtp(email, newUserId);
        } else {
          if (!otpUserId) {
            setError('Missing OTP session. Please restart signup.');
            return;
          }

          if (!otpCode.trim()) {
            setError('Enter the verification code sent to your email.');
            return;
          }

          // 3. Verify OTP by creating a session with token userId + secret code
          try { await account.deleteSession('current'); } catch { /* no session */ }
          await account.createSession(otpUserId, otpCode.trim());

          // 4. Get JWT & store session
          const jwtObj = await account.createJWT();
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jwt: jwtObj.jwt }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.message || 'Session creation failed');
            return;
          }

          await refreshUser();
          router.push('/success');
        }
      }
    } catch (err) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isLogin ? 'Login failed. Check your credentials.' : 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f4ff] flex items-center justify-center p-4 sm:p-6">
      {/* Decorative background orbs */}
      <Orb className="h-96 w-96 bg-blue-400 -top-24 -left-24" />
      <Orb className="h-80 w-80 bg-indigo-400 top-1/2 -right-16" />
      <Orb className="h-64 w-64 bg-cyan-300 bottom-0 left-1/3" />

      <div className="relative z-10 w-full max-w-220">
        <motion.div
          className="grid grid-cols-1 overflow-hidden rounded-3xl shadow-2xl shadow-blue-200/50 lg:grid-cols-[1.1fr_1fr]"
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── LEFT PANEL ── */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#0c7bb3] p-7 text-white lg:flex">
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute top-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">EpiLanka</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="text-[1.75rem] font-extrabold leading-tight xl:text-[2.15rem]">
                    {isLogin ? 'Welcome back.' : 'Join the network.'}
                  </h1>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-blue-100">
                    {isLogin
                      ? 'Stay ahead of every signal and protect communities across Sri Lanka.'
                      : 'Get insight, respond faster, and collaborate to keep people safe.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 mt-auto space-y-2.5 pt-8">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-blue-200">{f.description}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-white/40" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL (form) ── */}
          <div className="flex flex-col justify-center bg-white px-7 py-9 sm:px-7">
            {/* Mobile logo */}
            <div className="mb-7 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e3a8a]">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">EpiLanka</span>
            </div>

            {/* Tab switcher */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              {(['login', 'signup'] as AuthMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className="cursor-pointer relative flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors duration-200"
                  style={{ color: mode === item ? '#1e3a8a' : '#64748b' }}
                >
                  {mode === item && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">
                    {item === 'login' ? 'Sign in' : 'Create account'}
                  </span>
                </button>
              ))}
            </div>

            {/* Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode + '-header'}
                className="mb-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {isLogin ? 'Access your workspace' : 'Create your account'}
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  {isLogin
                    ? 'Enter your credentials to continue.'
                    : 'Fill in the details below to get started.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-[13px] font-medium text-red-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {notice && (
                <motion.div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                  <p className="text-[13px] font-medium text-blue-700">{notice}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatePresence mode="popLayout">
                  {!isLogin && !otpStep && (
                    <motion.div
                      key="username-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <InputField
                        id="username"
                        label="Full Name"
                        type="text"
                        placeholder="Your display name"
                        icon={<User className="h-4 w-4" />}
                        value={username}
                        onChange={setUsername}
                        required={!isLogin}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {(!otpStep || isLogin) ? (
                  <>
                    <InputField
                      id="email"
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      icon={<Mail className="h-4 w-4" />}
                      value={email}
                      onChange={setEmail}
                      required
                    />

                    <InputField
                      id="password"
                      label="Password"
                      type="password"
                      placeholder={isLogin ? '••••••••' : 'Create a strong password'}
                      icon={<Lock className="h-4 w-4" />}
                      value={password}
                      onChange={setPassword}
                      required
                      hint={
                        isLogin
                          ? 'Sessions are secured by Appwrite.'
                          : 'Use 8+ characters with numbers and symbols.'
                      }
                      showToggle
                    />
                  </>
                ) : (
                  <>
                    <InputField
                      id="otp"
                      label="Email verification code"
                      type="text"
                      placeholder="Enter code from your email"
                      icon={<Mail className="h-4 w-4" />}
                      value={otpCode}
                      onChange={setOtpCode}
                      required
                      hint="Code expires in about 15 minutes."
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="cursor-pointer text-xs font-semibold text-[#1e40af] hover:text-[#1e3a8a] transition-colors duration-150 disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    </div>
                  </>
                )}

                {isLogin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="cursor-pointer text-xs font-semibold text-[#1e40af] hover:text-[#1e3a8a] transition-colors duration-150"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer group relative mt-2 w-full overflow-hidden rounded-xl py-2.5 text-[13px] font-bold text-white shadow-lg shadow-blue-300/30 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c7bb3 100%)',
                  }}
                  whileHover={loading ? undefined : { scale: 1.01, y: -1 }}
                  whileTap={loading ? undefined : { scale: 0.99 }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isLogin ? 'Signing in…' : otpStep ? 'Verifying code…' : 'Sending verification code…'}
                      </>
                    ) : (
                      <>
                        {isLogin ? 'Sign in' : otpStep ? 'Verify email' : 'Send verification code'}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </motion.button>

                <div className="relative mt-6 flex items-center justify-center">
                  <span className="absolute inset-x-0 h-px bg-slate-200" />
                  <span className="relative bg-white px-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Or continue with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    disabled={loading}
                    className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 2h9.5v9.5H2z" fill="#F25022" />
                      <path d="M12.5 2H22v9.5h-9.5z" fill="#7FBA00" />
                      <path d="M2 12.5h9.5V22H2z" fill="#00A4EF" />
                      <path d="M12.5 12.5H22V22h-9.5z" fill="#FFB900" />
                    </svg>
                    Microsoft
                  </button>
                </div>

                <p className="pt-2 text-center text-[13px] text-slate-500">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(isLogin ? 'signup' : 'login')}
                    className="cursor-pointer font-semibold text-[#1e3a8a] underline-offset-2 hover:underline transition-colors duration-150"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </motion.form>
            </AnimatePresence>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
              By continuing, you agree to EpiLanka&apos;s{' '}
              <span className="cursor-pointer font-medium text-slate-500 hover:text-slate-700 transition-colors">
                Terms of Service
              </span>{' '}
              &amp;{' '}
              <span className="cursor-pointer font-medium text-slate-500 hover:text-slate-700 transition-colors">
                Privacy Policy
              </span>
              .
            </p>
          </div>
           </motion.div>
       </div>

       {/* Forgot Password Modal */}
       <ForgotPasswordModal 
         isOpen={forgotPasswordOpen} 
         onClose={() => setForgotPasswordOpen(false)}
       />
     </div>
   );
}
