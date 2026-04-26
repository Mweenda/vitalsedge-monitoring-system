import React from "react";
import { clsx } from "clsx";

export interface VitalSignCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: "normal" | "alert" | "warning";
}

export const VitalSignCard: React.FC<VitalSignCardProps> = ({
  label,
  value,
  unit,
  icon,
  status,
}) => (
  <div
    className={clsx(
      "flex flex-col items-center rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow",
      status === "normal" && "border-gray-200",
      status === "alert" && "border-red-200 bg-red-50",
      status === "warning" && "border-amber-200 bg-amber-50",
    )}
  >
    <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3 bg-gray-50">
      {icon}
    </div>
    <div className="text-sm text-gray-500 mb-1.5 text-center">{label}</div>
    <div className={clsx(
      "text-3xl font-bold",
      status === "normal" && "text-gray-800",
      status === "alert" && "text-red-600",
      status === "warning" && "text-amber-600",
    )}>
      {value}
      <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>
    </div>
  </div>
);
