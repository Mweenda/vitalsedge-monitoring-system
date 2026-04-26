import { Clock, DollarSign, Phone, ChevronLeft, ChevronRight, Calendar, MoreHorizontal } from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  type: string;
  time: string;
  cost: number;
  avatar: string;
}

const appointments: Appointment[] = [
  { id: '1', patientName: 'Shawn Hampton', type: 'Emergency appointment', time: '10:00', cost: 30, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: '2', patientName: 'Polly Paul', type: 'USG - Consultation', time: '10:30', cost: 50, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: '3', patientName: 'Johan Doe', type: 'Laboratory screening', time: '11:00', cost: 70, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { id: '4', patientName: 'Harmani Doe', type: 'Keeping pregnant', time: '11:30', cost: 0, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
];

const weekDays = [
  { day: 'Tue', date: '29th' },
  { day: 'Wed', date: '30th' },
  { day: 'Thursday', date: 'December 1st 2022', active: true },
  { day: 'Fri', date: '2nd' },
];

export function AppointmentsList() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Upcoming Appointments</h2>

      <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-1.5">
        <button className="p-1 hover:bg-white rounded transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <div className="flex items-center gap-0.5 text-xs">
          <div className="px-2 py-1 text-gray-600">
            <div className="font-medium text-xs">Tue</div>
            <div className="text-xs opacity-60">29th</div>
          </div>
          <div className="px-2 py-1 text-gray-600">
            <div className="font-medium text-xs">Wed</div>
            <div className="text-xs opacity-60">30th</div>
          </div>
          <div className="px-2.5 py-1.5 bg-cyan-500 text-white rounded-lg flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="font-semibold text-xs whitespace-nowrap">Thu, Dec 1st</span>
          </div>
          <div className="px-2 py-1 text-gray-600">
            <div className="font-medium text-xs">Fri</div>
            <div className="text-xs opacity-60">2nd</div>
          </div>
        </div>
        <button className="p-1 hover:bg-white rounded transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-3">
        {appointments.map((appointment, idx) => (
          <div key={appointment.id} className="flex items-center gap-2.5 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
            <img
              src={appointment.avatar}
              alt={appointment.patientName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 truncate">{appointment.patientName}</div>
              <div className="text-xs text-gray-500 truncate">{appointment.type}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{appointment.time}</span>
              </div>
              {appointment.cost > 0 && (
                <div className="text-xs text-gray-600">$ {appointment.cost}</div>
              )}
              <button className="p-1 text-cyan-500 hover:bg-cyan-50 rounded transition-colors">
                <Phone className="w-3.5 h-3.5" />
              </button>
              <button className="p-0.5 text-gray-400 hover:bg-gray-50 rounded transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
