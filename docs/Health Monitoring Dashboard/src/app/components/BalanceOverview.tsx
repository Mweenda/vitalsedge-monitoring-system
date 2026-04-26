import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

export function BalanceOverview() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Balance</h2>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-cyan-50 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="text-sm text-gray-600">Income</span>
            </div>
            <span className="text-xl font-bold text-gray-800">$142K</span>
          </div>
          <ResponsiveContainer width="100%" height={85} key="income-chart">
            <AreaChart data={incomeData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888" fontSize={9} />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-pink-500" />
              </div>
              <span className="text-sm text-gray-600">Outcome</span>
            </div>
            <span className="text-xl font-bold text-gray-800">$43K</span>
          </div>
          <ResponsiveContainer width="100%" height={85} key="outcome-chart">
            <AreaChart data={outcomeData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorOutcome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888" fontSize={9} />
              <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorOutcome)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
