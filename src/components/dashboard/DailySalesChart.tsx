import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface DailySalesChartProps {
  data: Array<{ date: string; sales: number }>;
}

export function DailySalesChart({ data }: DailySalesChartProps) {
  const formatDollar = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">Daily Sales</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={formatDollar}
              width={50}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatDollar(value), 'Sales']}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              fill="url(#salesGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {data.length > 0 ? data[data.length - 1]?.date : ''}
      </p>
    </div>
  );
}
