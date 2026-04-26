import { Calendar, MoreHorizontal } from 'lucide-react';

interface Payment {
  id: string;
  patient: string;
  service: string;
  date: string;
  amount: number;
}

const payments: Payment[] = [
  { id: '1', patient: 'Dr. Johen Doe', service: 'Kidney function test', date: 'Sunday, 16 May', amount: 25.15 },
  { id: '2', patient: 'Dr. Michael Doe', service: 'Emergency appointment', date: 'Sunday, 16 May', amount: 99.15 },
  { id: '3', patient: 'Dr. Bertie Maxwell', service: 'Complementation test', date: 'Sunday, 16 May', amount: 40.45 },
];

export function PaymentsHistory() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Payments history</h2>
      <div className="space-y-3.5">
        {payments.map((payment) => (
          <div key={payment.id} className="pb-3.5 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs text-gray-500 mb-1">% {payment.patient}</p>
                <p className="font-semibold text-sm text-gray-800 leading-snug">{payment.service}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-semibold text-sm whitespace-nowrap">$ {payment.amount.toFixed(2)}</span>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Calendar className="w-3 h-3" />
              <span>{payment.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
