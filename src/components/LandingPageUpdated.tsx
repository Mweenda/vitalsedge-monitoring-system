/**
 * Enhanced LandingPage Component
 * 
 * Professional landing page for unauthenticated users
 * Fully responsive (mobile-first design)
 * Accessibility first approach
 */

import React from 'react';
import {
  Activity, Heart, Shield, BarChart3, Users, Zap, ChevronRight,
  ArrowRight, CheckCircle2, Lock, Cloud, Smartphone, Tablet, Monitor,
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const features = [
    {
      icon: Heart,
      title: 'Real-time Monitoring',
      description: 'Continuous vital sign tracking with instant anomaly detection',
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade encryption and data protection standards',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'AI-powered insights and predictive health analytics',
    },
    {
      icon: Users,
      title: 'Multi-role System',
      description: 'Designed for clinicians, patients, and administrators',
    },
    {
      icon: Cloud,
      title: 'Cloud Synced',
      description: 'Seamless data synchronization across all devices',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance for critical care scenarios',
    },
  ];

  const testimonials = [
    {
      initials: 'CK',
      name: 'Christopher Kawanga',
      role: 'Cardiologist',
      feedback: 'VitalsEdge transformed how we monitor CHF patients. Early detection has improved outcomes.',
      bgColor: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    },
    {
      initials: 'ML',
      name: 'Mweenda Lubi',
      role: 'Patient',
      feedback: 'Easy to use, and I feel confident about my health. My clinician checks on me regularly.',
      bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    },
    {
      initials: 'SJ',
      name: 'Sarah Muwonge',
      role: 'Emergency Medicine Specialist',
      feedback: 'Fast access to critical alerts. This system saves lives in the ER.',
      bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    },
  ];

  const stats = [
    { label: 'Active Patients', value: '2,500+' },
    { label: 'Data Points/Day', value: '500K+' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Clinicians', value: '400+' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-emerald-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              VitalsEdge
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              AI-Powered{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Patient Monitoring
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Real-time vital sign monitoring with advanced analytics and AI-powered insights.
              Secure, HIPAA-compliant, and designed for modern healthcare.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all inline-flex items-center gap-2 justify-center"
              >
                Start Monitoring
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-3 border border-gray-600 hover:border-gray-400 rounded-lg font-medium transition-colors inline-flex items-center gap-2 justify-center"
              >
                Sign In
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          {/* Hero Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 backdrop-blur-sm p-8 sm:p-12"
          >
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden">
              <img 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-60" 
                referrerPolicy="no-referrer" 
                src="https://picsum.photos/seed/dashboard/1920/1080" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 cursor-pointer hover:scale-110 transition-transform">
                  <Zap className="text-slate-950 w-10 h-10 fill-current" aria-hidden="true" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Comprehensive Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                >
                  <Icon className="h-12 w-12 text-emerald-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Trusted by Healthcare Professionals
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white ${testimonial.bgColor}`}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.feedback}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Support Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Works Everywhere
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: 'iPhone & Android', desc: 'Responsive mobile app' },
              { icon: Tablet, title: 'Tablets', desc: 'Optimized tablet experience' },
              { icon: Monitor, title: 'Desktops', desc: 'Full-featured web dashboard' },
            ].map((device, i) => {
              const Icon = device.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <Icon className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-lg font-semibold mb-2">{device.title}</h3>
                  <p className="text-gray-400">{device.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Enterprise-Grade Security
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Lock, title: 'End-to-End Encryption', desc: 'Military-grade SSL/TLS' },
              {
                icon: Shield,
                title: 'HIPAA Compliant',
                desc: 'Full compliance with healthcare standards',
              },
              { icon: Cloud, title: 'Secure Cloud', desc: 'Multi-region redundancy' },
              { icon: CheckCircle2, title: 'Regular Audits', desc: 'Third-party security reviews' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <Icon className="h-6 w-6 flex-shrink-0 text-blue-400 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">{feature.title}</p>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Patient Care?</h2>
            <p className="text-lg text-gray-400 mb-8">
              Join thousands of healthcare professionals using VitalsEdge for better patient outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg font-medium text-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Get Started Free
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 border border-gray-600 hover:border-gray-400 rounded-lg font-medium text-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-200 transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 VitalsEdge. All rights reserved. | HIPAA Compliant | Enterprise Grade</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
