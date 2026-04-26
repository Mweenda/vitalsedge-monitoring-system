import { ChevronRight, Search, Bell, Maximize2, Settings as SettingsIcon, Mic, Calendar, Users, Activity, Stethoscope, LayoutGrid, FileText, TrendingUp, Clipboard, PieChart } from 'lucide-react';
import { RevenueChart } from './components/RevenueChart';
import { AppointmentsList } from './components/AppointmentsList';
import { DoctorsList } from './components/DoctorsList';
import { PatientDemographics } from './components/PatientDemographics';
import { PaymentsHistory } from './components/PaymentsHistory';
import { BalanceOverview } from './components/BalanceOverview';
import { UserDropdown } from './components/UserDropdown';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center shadow-md">
                <div className="w-5 h-5 border-2 border-white rounded-full relative">
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-white"></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-800">Rhythm Admin</h1>
            </div>
            <button className="p-2 text-cyan-500 hover:bg-cyan-50 rounded-lg transition-colors">
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-cyan-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
              <SettingsIcon className="w-5 h-5 text-red-500" />
            </button>
            <div className="pl-3 border-l border-gray-200">
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-60 bg-gray-100 border-r border-gray-200">
          <div className="p-4">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg mb-6 hover:shadow-xl transition-shadow">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Emergency</div>
                <div className="text-xs opacity-90">help</div>
              </div>
            </button>

            <nav className="space-y-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-white text-cyan-500 rounded-lg shadow-sm">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Appointments</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Patients</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Doctors</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4" />
                  <span className="text-sm">Departments</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Analytics</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Reports</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Clipboard className="w-4 h-4" />
                  <span className="text-sm">Medical Records</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-white rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <PieChart className="w-4 h-4" />
                  <span className="text-sm">Billing</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>

            <div className="mt-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white text-center">
              <div className="mb-3">
                <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center text-4xl">
                  🩺
                </div>
              </div>
              <div className="font-semibold text-sm mb-1">Make an Appointment</div>
              <div className="text-xs opacity-90 mb-3">Best Health Care here</div>
              <button className="w-full bg-white text-cyan-600 py-2 rounded-lg font-semibold text-sm hover:bg-cyan-50 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-yellow-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-3xl">👨‍🦽</span>
                </div>
                <div className="text-sm text-gray-500 mb-1.5">Total Patients</div>
                <div className="text-3xl font-bold text-gray-800">1,548</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-pink-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-3xl">👨‍⚕️</span>
                </div>
                <div className="text-sm text-gray-500 mb-1.5">Consultation</div>
                <div className="text-3xl font-bold text-gray-800">448</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-yellow-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="text-sm text-gray-500 mb-1.5">Staff</div>
                <div className="text-3xl font-bold text-gray-800">848</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-cyan-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-3xl">🏥</span>
                </div>
                <div className="text-sm text-gray-500 mb-1.5">Total Rooms</div>
                <div className="text-3xl font-bold text-gray-800">3,100</div>
              </div>
            </div>
          </div>

          {/* Main Row */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <RevenueChart />
            <PaymentsHistory />
            <AppointmentsList />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-6">
            <DoctorsList />
            <BalanceOverview />
            <PatientDemographics />
          </div>
        </main>
      </div>
    </div>
  );
}