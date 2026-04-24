import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, Heart, Shield, BarChart3, Users, Zap, ChevronRight,
  ArrowRight, CheckCircle2, Lock, Cloud, Smartphone, Tablet, Monitor,
  Brain, AlertTriangle, TrendingUp, Wifi, Bell, Radio,
} from 'lucide-react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const FloatingOrb: React.FC<{ delay: number; x: number; y: number; size: number; color: string }> = ({
  delay, x, y, size, color
}) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-30 ${color}`}
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
    animate={{
      y: [0, -30, 0],
      scale: [1, 1.1, 1],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 8 + delay,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const PulseRing: React.FC<{ delay: number; x: number; y: number }> = ({ delay, x, y }) => (
  <motion.div
    className="absolute rounded-full border border-emerald-500/20"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      scale: [0.5, 2],
      opacity: [0.6, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

const AnimatedCounter: React.FC<{ value: string; duration?: number }> = ({ value, duration = 2 }) => {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = numericValue / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start).toLocaleString() + (value.includes('+') ? '+' : ''));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, value, numericValue, duration]);

  return <div ref={ref}>{display}</div>;
};

const VitalSignMini: React.FC<{ icon: React.ElementType; value: string; unit: string; trend: 'up' | 'down' | 'stable' }> = ({
  icon: Icon, value, unit, trend
}) => (
  <motion.div
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-4"
    whileHover={{ scale: 1.02, borderColor: 'rgba(16, 185, 129, 0.5)' }}
    transition={{ duration: 0.2 }}
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
      <Icon className="w-6 h-6 text-emerald-400" />
    </div>
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-sm text-gray-400">{unit}</span>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
        {trend === 'down' && <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />}
      </div>
    </div>
  </motion.div>
);

const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  index: number;
}> = ({ icon: Icon, title, description, delay, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Icon className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const features = [
    {
      icon: Heart,
      title: 'Real-time Monitoring',
      description: 'Continuous vital sign tracking with instant anomaly detection powered by edge computing.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Predictive analytics and intelligent alerts help prevent adverse events before they occur.',
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade encryption and comprehensive audit logging ensure patient data security.',
    },
{
        icon: Radio,
        title: 'Edge Computing',
        description: 'Local signal processing on ESP32/STM32 devices reduces latency and ensures reliability.',
      },
    {
      icon: Wifi,
      title: 'Seamless Sync',
      description: 'Real-time data synchronization across all devices with offline-first architecture.',
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Configurable thresholds with intelligent escalation and multi-channel notifications.',
    },
  ];

  const stats = [
    { label: 'Active Patients', value: '2,500+', suffix: '' },
    { label: 'Data Points/Day', value: '500K+', suffix: '' },
    { label: 'Uptime', value: '99.9', suffix: '%' },
    { label: 'Clinicians', value: '400', suffix: '+' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb delay={0} x={10} y={20} size={400} color="bg-emerald-500" />
        <FloatingOrb delay={2} x={80} y={60} size={350} color="bg-blue-500" />
        <FloatingOrb delay={4} x={50} y={80} size={300} color="bg-purple-500" />
        <PulseRing delay={0} x={15} y={30} />
        <PulseRing delay={1.5} x={75} y={70} />
        <PulseRing delay={3} x={50} y={50} />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <Activity className="h-8 w-8 text-emerald-500" />
              <motion.div
                className="absolute inset-0 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              VitalsEdge
            </span>
          </motion.div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={onLogin}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-full border border-white/10 hover:border-white/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={onGetStarted}
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section className="relative pt-40 pb-32 px-6">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Patient Monitoring
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-8"
          >
            Next-Gen Healthcare
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            AI-powered vital sign monitoring with edge computing technology.
            Monitor patients in real-time, detect anomalies instantly, and act before critical events occur.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full font-semibold text-lg flex items-center gap-3 justify-center hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Monitoring
              <motion.span
                className="inline-flex"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.span>
            </motion.button>
            <motion.button
              onClick={onLogin}
              className="px-8 py-4 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/5 transition-colors flex items-center gap-2 justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Dashboard Preview */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            style={{ scale: dashboardScale }}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-slate-700/50 text-xs text-gray-400">
                    vitalsedge-monitoring.app/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold">Patient Overview</h3>
                    <p className="text-gray-400">John Doe • Room 204</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm text-emerald-400 font-medium">Live Monitoring</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <VitalSignMini icon={Heart} value="82" unit="BPM" trend="stable" />
                  <VitalSignMini icon={Activity} value="98" unit="%" trend="stable" />
                  <VitalSignMini icon={Zap} value="37.2" unit="°C" trend="up" />
                  <VitalSignMini icon={BarChart3} value="105" unit="mg/dL" trend="down" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className="lg:col-span-2 bg-slate-800/30 rounded-xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Heart Rate Trend</h4>
                        <p className="text-sm text-gray-400">Last 24 hours</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 bg-emerald-400" /> Normal
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 bg-rose-400" /> Alert
                        </span>
                      </div>
                    </div>
                    <div className="h-40 flex items-end gap-1">
                      {[65, 72, 68, 75, 82, 78, 85, 92, 88, 95, 82, 76, 72, 68, 75, 82, 78, 85, 92, 88, 95, 82, 76, 72].map((v, i) => (
                        <motion.div
                          key={i}
                          className={`flex-1 rounded-t-sm ${v > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${v}%` }}
                          transition={{ delay: i * 0.02, duration: 0.3 }}
                          viewport={{ once: true }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Alert Panel */}
                  <div className="bg-slate-800/30 rounded-xl p-6 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <h4 className="font-semibold">Recent Alerts</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-rose-400">HIGH PRIORITY</span>
                          <span className="text-xs text-gray-500">2m ago</span>
                        </div>
                        <p className="text-sm text-gray-300">Heart rate elevated: 125 BPM</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-amber-400">MEDIUM</span>
                          <span className="text-xs text-gray-500">15m ago</span>
                        </div>
                        <p className="text-sm text-gray-300">Glucose level: 180 mg/dL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-400 font-medium tracking-wider uppercase text-sm">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive tools for modern healthcare monitoring, designed for reliability and ease of use.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} delay={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-400 font-medium tracking-wider uppercase text-sm">How It Works</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 mb-6">
              Simple. Secure. Powerful.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Devices',
                description: 'Pair your edge devices via secure Bluetooth. Each device encrypts data locally before transmission.',
              },
              {
                step: '02',
                title: 'Monitor Vitals',
                description: 'View real-time vital signs on any device. AI continuously analyzes patterns and trends.',
              },
              {
                step: '03',
                title: 'Receive Alerts',
                description: 'Get instant notifications when readings exceed thresholds. Take action before emergencies.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-7xl font-bold bg-gradient-to-br from-emerald-500/20 to-transparent bg-clip-text text-transparent mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-emerald-400 font-medium tracking-wider uppercase text-sm">Security</span>
              <h2 className="text-4xl sm:text-5xl font-bold mt-4 mb-6">
                Enterprise-Grade Protection
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Built with security at its core. Every transmission is encrypted, every access is logged,
                and every compliance requirement is met.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Lock, title: 'End-to-End Encryption', desc: 'AES-256 for data at rest, TLS 1.3 for data in transit' },
                  { icon: Shield, title: 'HIPAA Compliant', desc: 'Full compliance with healthcare regulations' },
                  { icon: Cloud, title: 'Secure Cloud', desc: 'Multi-region redundancy with 99.99% uptime' },
                  { icon: CheckCircle2, title: 'Regular Audits', desc: 'Third-party security assessments' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <item.icon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">{item.title}</p>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 blur-3xl" />
              <div className="relative bg-slate-900/80 rounded-2xl border border-white/10 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Security Score</h4>
                    <p className="text-sm text-gray-400">Your organization's rating</p>
                  </div>
                </div>
                <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: '98%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    viewport={{ once: true }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Compliance</span>
                  <span className="text-emerald-400 font-semibold">98/100</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Device Support */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-400 font-medium tracking-wider uppercase text-sm">Compatibility</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 mb-6">
              Access Anywhere
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Whether on desktop, tablet, or mobile, VitalsEdge adapts to your workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: 'Mobile', desc: 'iOS and Android apps for clinicians on the move' },
              { icon: Tablet, title: 'Tablet', desc: 'Optimized layouts for bedside monitoring' },
              { icon: Monitor, title: 'Desktop', desc: 'Full-featured web dashboard for clinical stations' },
            ].map((device, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="text-center bg-slate-900/50 rounded-2xl border border-white/5 p-8 hover:border-emerald-500/20 transition-colors"
              >
                <device.icon className="w-20 h-20 mx-auto mb-6 text-emerald-400" />
                <h3 className="text-xl font-semibold mb-2">{device.title}</h3>
                <p className="text-gray-400">{device.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 blur-3xl" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl border border-white/10 p-12 md:p-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Transform Patient Care?
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join hundreds of healthcare professionals already using VitalsEdge for better patient outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={onGetStarted}
                  className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center gap-2 justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={onLogin}
                  className="px-10 py-4 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact Sales
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-emerald-500" />
              <span className="font-bold">VitalsEdge</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; 2026 VitalsEdge. All rights reserved. | HIPAA Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;