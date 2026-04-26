import { MoreHorizontal } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
}

const doctors: Doctor[] = [
  { id: '1', name: 'Dr. Jaylon Stanton', specialty: 'Dentist', avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop' },
  { id: '2', name: 'Dr. Carla Schleifer', specialty: 'Oculist', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop' },
  { id: '3', name: 'Dr. Hanna Geidt', specialty: 'Surgeon', avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop' },
];

export function DoctorsList() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Doctor List</h2>
        <span className="text-sm text-gray-500">Today</span>
      </div>
      <div className="space-y-2.5">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 truncate">{doctor.name}</div>
              <div className="text-xs text-gray-500">{doctor.specialty}</div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
