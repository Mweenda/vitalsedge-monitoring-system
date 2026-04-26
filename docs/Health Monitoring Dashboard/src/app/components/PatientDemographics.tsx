import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Male', value: 40, color: '#3b82f6' },
  { name: 'Female', value: 30, color: '#ec4899' },
  { name: 'Child', value: 15, color: '#22d3ee' },
  { name: 'Germany', value: 15, color: '#f59e0b' },
];

export function PatientDemographics() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Appointments Overview</h2>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-2 right-2 w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
          💬
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {data.map((item, idx) => (
          <div key={`legend-${idx}`} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs text-gray-600 truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
