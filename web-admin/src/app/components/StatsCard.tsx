type StatsCardProps = {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
};

// Define color classes for different status types
const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export default function StatsCard({
  title,
  value,
  description,
  trend = 'neutral',
  color = 'primary',
}: StatsCardProps) {
  return (
    <div className="card" data-testid="stats-card">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-foreground/70 mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold">{value}</span>
        <div
          className={`w-2 h-2 rounded-full ${colorClasses[color]}`}
          data-testid="color-indicator"
        ></div>
      </div>
    </div>
  );
}
