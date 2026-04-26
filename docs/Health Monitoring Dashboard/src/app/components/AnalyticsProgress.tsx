interface AnalyticsItem {
  label: string;
  percentage: number;
  color: string;
}

const analytics: AnalyticsItem[] = [
  { label: 'Cardiology', percentage: 90, color: 'bg-blue-500' },
  { label: 'Neurology', percentage: 40, color: 'bg-pink-400' },
  { label: 'Orthopedic', percentage: 60, color: 'bg-cyan-400' },
  { label: 'Dermatology', percentage: 50, color: 'bg-yellow-400' },
];

export function AnalyticsProgress() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-6">Department Analytics</h2>
      <div className="space-y-4">
        {analytics.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-semibold">{item.percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`${item.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
