import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({ title, value, icon: Icon, iconBgColor, iconColor }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`${iconBgColor} ${iconColor} p-4 rounded-xl`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}
