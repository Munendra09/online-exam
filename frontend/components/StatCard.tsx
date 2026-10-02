import { cn } from '@/lib/utils';

const gradients = [
  'stat-gradient-1',
  'stat-gradient-2',
  'stat-gradient-3',
  'stat-gradient-4',
  'stat-gradient-5',
];

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  index?: number;
  subtitle?: string;
}

/**
 * Colorful gradient stat card for dashboards
 */
export default function StatCard({ title, value, icon, index = 0, subtitle }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl p-5 text-white shadow-lg animate-fade-in', gradients[index % gradients.length])}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{title}</p>
        {icon && <div className="text-white/60">{icon}</div>}
      </div>
      <h3 className="text-3xl font-black mt-2">{value ?? 0}</h3>
      {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
    </div>
  );
}
