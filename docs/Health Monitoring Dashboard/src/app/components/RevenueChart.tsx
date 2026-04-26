import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = [
  { day: '10', income: 280, expense: 220 },
  { day: '11', income: 320, expense: 240 },
  { day: '12', income: 340, expense: 280 },
  { day: '13', income: 380, expense: 300 },
  { day: '14', income: 420, expense: 340 },
  { day: '15', income: 390, expense: 310 },
  { day: '16', income: 360, expense: 270 },
];

export function RevenueChart() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-800">Daily Revenue Report</h2>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-2xl font-bold text-cyan-500">$32,485</span>
          <span className="text-gray-400 text-xs">$12,458</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180} key="revenue-chart">
        <BarChart data={data} barGap={2} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="day" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Bar dataKey="income" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={10} isAnimationActive={false} />
          <Bar dataKey="expense" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></div>
          <span className="text-xs text-gray-600">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>
          <span className="text-xs text-gray-600">Expense</span>
        </div>
      </div>
    </div>
  );
}
