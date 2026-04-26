import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', heartRate: 72, bloodPressure: 120, oxygen: 98 },
  { time: '04:00', heartRate: 68, bloodPressure: 118, oxygen: 97 },
  { time: '08:00', heartRate: 75, bloodPressure: 125, oxygen: 98 },
  { time: '12:00', heartRate: 82, bloodPressure: 130, oxygen: 99 },
  { time: '16:00', heartRate: 78, bloodPressure: 122, oxygen: 98 },
  { time: '20:00', heartRate: 70, bloodPressure: 115, oxygen: 97 },
];

export function VitalsChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Vital Signs Monitoring</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">24h</button>
          <button className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg">Week</button>
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Month</button>
        </div>
      </div>
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
          <span className="text-sm text-gray-600">Heart Rate (bpm)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-sm text-gray-600">Blood Pressure</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">O2 Saturation (%)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip />
          <Line type="monotone" dataKey="heartRate" stroke="#22d3ee" strokeWidth={3} />
          <Line type="monotone" dataKey="bloodPressure" stroke="#a855f7" strokeWidth={3} />
          <Line type="monotone" dataKey="oxygen" stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
