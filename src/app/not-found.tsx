'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    document.body.classList.add('not-found-page');

    return () => {
      document.body.classList.remove('not-found-page');
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-teal-50 px-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#1E3A8A]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#0EA5A4]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Number */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative inline-block">
              <h1 className="text-[150px] md:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#1E3A8A] via-[#0EA5A4] to-[#1e40af] leading-none">
                404
              </h1>
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-[#0EA5A4]/20 rounded-full"></div>
              </motion.div>
            </div>
          </motion.div>

          {/* Error Icon */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#0EA5A4] rounded-full p-4 shadow-xl">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto mb-2">
              Oops! The page you&#39;re looking for seems to have wandered off into the digital wilderness.
            </p>
            <p className="text-sm text-gray-500">
              Don&#39;t worry, even the best explorers get lost sometimes.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link href="/">
              <motion.button
                className="group flex items-center gap-2 bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1E3A8A] text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </motion.button>
            </Link>

            <Link href="/dashboard">
              <motion.button
                className="group flex items-center gap-2 bg-white hover:bg-gray-50 text-[#1E3A8A] border-2 border-[#1E3A8A] font-semibold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Go to Dashboard</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Suggested Links */}
          <motion.div
            className="mt-12 pt-8 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-sm text-gray-600 mb-4 flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              <span>Looking for something specific?</span>
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/dashboard/map">
                <span className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer">
                  Disease Map
                </span>
              </Link>
              <Link href="/dashboard/report">
                <span className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-[#0EA5A4] rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer">
                  Report Incident
                </span>
              </Link>
              <Link href="/dashboard/settings">
                <span className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer">
                  Settings
                </span>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-[#1E3A8A]/10 to-[#0EA5A4]/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-[#0EA5A4]/10 to-[#1E3A8A]/10 rounded-full blur-xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
    </main>
  );
}

