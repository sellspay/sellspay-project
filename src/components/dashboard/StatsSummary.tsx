interface StatsSummaryProps {
  totalSales: number;
  uniqueCustomers: number;
  totalOrders: number;
  totalViews: number;
}

export function StatsSummary({ totalSales, uniqueCustomers, totalOrders, totalViews }: StatsSummaryProps) {
  const stats = [
    { label: 'Total Sales', value: `$${totalSales.toFixed(0)}`, prefix: '$' },
    { label: 'Unique Customers', value: uniqueCustomers },
    { label: 'Total Orders', value: totalOrders },
    { label: 'Total Views', value: totalViews },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
