import React from 'react';
import { 
  LayoutGrid, Calendar, Users, Activity, Stethoscope, FileText, 
  TrendingUp, Clipboard, PieChart, Search, Bell, Settings, Mic,
  ChevronRight, Plus, MoreVertical, Phone, Mail, Clock, DollarSign,
  TrendingDown, User, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '../components/FirebaseProvider';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { MedicalRAGAssistant } from '../components/MedicalRAGAssistant';
import { MedicalAssistant } from '../components/ai';

const CRMDashboard: React.FC = () => {
  const { userData } = useFirebase();

  const stats = [
    { label: 'Total Patients', value: '1,284', change: '+12%', trend: 'up', icon: Users },
    { label: 'Active Doctors', value: '48', change: '+5%', trend: 'up', icon: Stethoscope },
    { label: 'Appointments', value: '156', change: '+8%', trend: 'up', icon: Calendar },
    { label: 'Revenue', value: '$48.2K', change: '+23%', trend: 'up', icon: DollarSign },
  ];

  const recentPatients = [
    { name: 'John Doe', mrn: 'VE-102345', condition: 'CHF', status: 'Stable', time: '2 mins ago' },
    { name: 'Sarah Smith', mrn: 'VE-102346', condition: 'COPD', status: 'Critical', time: '5 mins ago' },
    { name: 'Michael Brown', mrn: 'VE-102347', condition: 'Diabetes', status: 'Stable', time: '10 mins ago' },
    { name: 'Emily Davis', mrn: 'VE-102348', condition: 'Hypertension', status: 'Moderate', time: '15 mins ago' },
  ];

  const alerts = [
    { message: 'Patient John Doe - Heart rate above threshold', severity: 'critical', time: '2 mins ago' },
    { message: 'Device VE-102348 offline', severity: 'warning', time: '15 mins ago' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/25">
                <div className="w-5 h-5 border-2 border-white rounded-full relative">
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-white"></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <h1 className="text-xl font-bold text-white">VitalsEdge CRM</h1>
            </div>
            <button className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search patients, doctors, appointments..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all backdrop-blur"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
            <button className="relative p-2.5 hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <UserProfileMenu
              fullName={userData?.fullName ?? undefined}
              email={userData?.email}
              role={userData?.role}
              onNavigate={() => {}}
              onSignOut={() => {}}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-60 bg-slate-900/50 border-r border-white/10">
          <div className="p-4">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25 mb-6 hover:shadow-xl transition-shadow">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">AI Assistant</div>
                <div className="text-xs opacity-90">Medical RAG</div>
              </div>
            </button>

            <nav className="space-y-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Appointments</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Patients</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4" />
                  <span className="text-sm">Doctors</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Vitals</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Records</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Analytics</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Clipboard className="w-4 h-4" />
                  <span className="text-sm">Reports</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <PieChart className="w-4 h-4" />
                  <span className="text-sm">Billing</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="flex-1 p-6 overflow-auto">
          {/*Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trend === 'up' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Alerts & Patients Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Alerts */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Live Alerts</h3>
                <button className="text-xs text-emerald-400 hover:text-emerald-300">View all</button>
              </div>
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-white">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Patients */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Patients</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Patient
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 pb-3">Patient</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-3">MRN</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-3">Condition</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-3">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((patient, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm font-medium text-white">
                              {patient.name.charAt(0)}
                            </div>
                            <span className="text-sm text-white">{patient.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-slate-400">{patient.mrn}</td>
                        <td className="py-3 text-sm text-white">{patient.condition}</td>
                        <td className="py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            patient.status === 'Critical' 
                              ? 'bg-red-500/10 text-red-400' 
                              : patient.status === 'Moderate'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-slate-500">{patient.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* AI Medical Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MedicalRAGAssistant />
            <MedicalAssistant />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CRMDashboard;