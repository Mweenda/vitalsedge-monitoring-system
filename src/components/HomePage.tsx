import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  Activity,
  Users,
  User,
  Calendar,
  Clock,
  Phone,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Stethoscope,
  FileText,
  Shield,
  LayoutGrid,
} from 'lucide-react';
import { clsx } from 'clsx';
import { UserRole, PatientData, VitalSigns } from '../types';
import { Card, CardHeader } from './common';

interface HomePageProps {
  fullName?: string;
  role?: UserRole;
  clinicName?: string;
  patients?: PatientData[];
  latestVitals?: VitalSigns;
}

const patientsData = [
  { day: '10', income: 280, expense: 220 },
  { day: '11', income: 320, expense: 240 },
  { day: '12', income: 340, expense: 280 },
  { day: '13', income: 380, expense: 300 },
  { day: '14', income: 420, expense: 340 },
  { day: '15', income: 390, expense: 310 },
  { day: '16', income: 360, expense: 270 },
];

const incomeData = [
  { month: 'Jan', value: 120 },
  { month: 'Feb', value: 135 },
  { month: 'Mar', value: 128 },
  { month: 'Apr', value: 145 },
  { month: 'May', value: 138 },
  { month: 'Jun', value: 142 },
];

const outcomeData = [
  { month: 'Jan', value: 35 },
  { month: 'Feb', value: 42 },
  { month: 'Mar', value: 38 },
  { month: 'Apr', value: 45 },
  { month: 'May', value: 40 },
  { month: 'Jun', value: 43 },
];

const upcomingAppointments = [
  { id: '1', name: 'Shawn Hampton', type: 'Emergency appointment', time: '10:00', cost: 30, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: '2', name: 'Polly Paul', type: 'USG - Consultation', time: '10:30', cost: 50, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: '3', name: 'Johan Doe', type: 'Laboratory screening', time: '11:00', cost: 70, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { id: '4', name: 'Harmani Doe', type: 'Keeping pregnant', time: '11:30', cost: 0, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
];

const doctors = [
  { id: '1', name: 'Dr. Jaylon Stanton', specialty: 'Dentist', avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop' },
  { id: '2', name: 'Dr. Carla Schleifer', specialty: 'Oculist', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop' },
  { id: '3', name: 'Dr. Hanna Geidt', specialty: 'Surgeon', avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop' },
];

const payments = [
  { id: '1', patient: 'Dr. Johen Doe', service: 'Kidney function test', date: 'Sunday, 16 May', amount: 25.15 },
  { id: '2', patient: 'Dr. Michael Doe', service: 'Emergency appointment', date: 'Sunday, 16 May', amount: 99.15 },
  { id: '3', patient: 'Dr. Bertie Maxwell', service: 'Complementation test', date: 'Sunday, 16 May', amount: 40.45 },
];

const demographicsData = [
  { name: 'Male', value: 40, color: '#3b82f6' },
  { name: 'Female', value: 30, color: '#ec4899' },
  { name: 'Child', value: 15, color: '#22d3ee' },
  { name: 'Zambia', value: 15, color: '#f59e0b' },
];

const weekDays = [
  { day: 'Tue', date: '29th' },
  { day: 'Wed', date: '30th' },
  { day: 'Thursday', date: 'December 1st 2022', active: true },
  { day: 'Fri', date: '2nd' },
];

export const HomePage: React.FC<HomePageProps> = ({ fullName, role, clinicName }) => {
  const getRoleLabel = (r?: UserRole): string => {
    switch (r) {
      case 'CLINICIAN':
        return 'Clinical Provider';
      case 'PATIENT':
        return 'Patient';
      case 'CLINIC_MANAGER':
        return 'Clinic Manager';
      case 'ADMIN':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {fullName?.split(' ')[0] || 'Doctor'}!
        </h1>
        <p className="text-slate-400">Here's what's happening with your patients today.</p>
      </div>

      {/* Stats Cards - 4 columns */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-sm text-slate-400 mb-1.5">Total Patients</div>
            <div className="text-3xl font-bold text-white">1,548</div>
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-pink-500/10 rounded-xl flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-pink-400" />
            </div>
            <div className="text-sm text-slate-400 mb-1.5">Consultation</div>
            <div className="text-3xl font-bold text-white">448</div>
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-sm text-slate-400 mb-1.5">Staff</div>
            <div className="text-3xl font-bold text-white">848</div>
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
              <Activity className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-sm text-slate-400 mb-1.5">Total Rooms</div>
            <div className="text-3xl font-bold text-white">3,100</div>
          </div>
        </div>
      </div>

      {/* Main Row - 3 columns */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Daily Revenue Report */}
        <Card>
          <CardHeader 
            title="Daily Revenue Report" 
            action={<span className="text-2xl font-bold text-emerald-400">K32,485</span>}
          />
          <ResponsiveContainer width="100%" height={180} key="revenue-chart">
            <BarChart data={patientsData} barGap={2} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} isAnimationActive={false} />
              <Bar dataKey="expense" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
              <span className="text-xs text-slate-400">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>
              <span className="text-xs text-slate-400">Expense</span>
            </div>
          </div>
        </Card>

        {/* Payments History */}
        <Card>
          <CardHeader title="Payments history" />
          <div className="space-y-3.5">
            {payments.map((payment) => (
              <div key={payment.id} className="pb-3.5 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs text-slate-500 mb-1">% {payment.patient}</p>
                    <p className="font-semibold text-sm text-white leading-snug">{payment.service}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-sm whitespace-nowrap text-white">K {payment.amount.toFixed(2)}</span>
                    <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{payment.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader title="Upcoming Appointments" />
          <div className="flex items-center justify-between mb-4 bg-slate-800/60 rounded-lg p-1.5">
            <button className="p-1 hover:bg-slate-700 rounded transition-colors">
              <ChevronRight className="w-3.5 h-3.5 rotate-180 text-slate-400" />
            </button>
            <div className="flex items-center gap-0.5 text-xs">
              {weekDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={clsx(
                    "px-2 py-1 rounded-lg flex items-center gap-1",
                    day.active ? "bg-emerald-500 text-white" : "text-slate-400"
                  )}
                >
                  {day.active && <Calendar className="w-3 h-3" />}
                  <span className="font-semibold text-xs whitespace-nowrap">{day.day}, {day.date}</span>
                </div>
              ))}
            </div>
            <button className="p-1 hover:bg-slate-700 rounded transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center gap-2.5 pb-3 border-b border-white/10 last:border-0 last:pb-0">
                <img
                  src={appointment.avatar}
                  alt={appointment.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white truncate">{appointment.name}</div>
                  <div className="text-xs text-slate-500 truncate">{appointment.type}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{appointment.time}</span>
                  </div>
                  {appointment.cost > 0 && (
                    <div className="text-xs text-slate-400">K {appointment.cost}</div>
                  )}
                  <button className="p-1 text-emerald-400 hover:bg-slate-800 rounded transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-0.5 text-slate-500 hover:bg-slate-800 rounded transition-colors">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row - 3 columns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Doctor List */}
        <Card>
          <CardHeader title="Doctor List" action={<span className="text-sm text-slate-500">Today</span>} />
          <div className="space-y-2.5">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center gap-3 p-3 hover:bg-slate-800/60 rounded-lg transition-colors">
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white truncate">{doctor.name}</div>
                  <div className="text-xs text-slate-500">{doctor.specialty}</div>
                </div>
                <button className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Balance Overview */}
        <Card>
          <CardHeader title="Balance" />
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">Income</span>
                </div>
                <span className="text-xl font-bold text-white">K142K</span>
              </div>
              <ResponsiveContainer width="100%" height={85} key="income-chart">
                <AreaChart data={incomeData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-pink-500/10 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="text-sm text-slate-400">Outcome</span>
                </div>
                <span className="text-xl font-bold text-white">K43K</span>
              </div>
              <ResponsiveContainer width="100%" height={85} key="outcome-chart">
                <AreaChart data={outcomeData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorOutcome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                  <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorOutcome)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Patient Demographics - Pie Chart */}
        <Card>
          <CardHeader title="Appointments Overview" />
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={demographicsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-2 right-2 w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
              💬
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {demographicsData.map((item, idx) => (
              <div key={`legend-${idx}`} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-slate-400 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};