import { Eye, Users, ShoppingCart, Download, Package, UserCheck } from 'lucide-react';

interface StatsSummaryProps {
  totalSales: number;
  uniqueCustomers: number;
  totalPurchases: number;
  totalDownloads: number;
  totalProductViews: number;
  totalProfileViews: number;
}

export function StatsSummary({ 
  totalSales, 
  uniqueCustomers, 
  totalPurchases, 
  totalDownloads,
  totalProductViews,
  totalProfileViews 
}: StatsSummaryProps) {
  const stats = [
    { 
      label: 'Profile Views', 
      value: totalProfileViews.toLocaleString(),
      icon: UserCheck,
      description: 'Visitors to your profile'
    },
    { 
      label: 'Product Views', 
      value: totalProductViews.toLocaleString(),
      icon: Eye,
      description: 'Views on your products'
    },
    { 
      label: 'Total Revenue', 
      value: `$${totalSales.toFixed(2)}`,
      icon: ShoppingCart,
      description: 'Your earnings'
    },
    { 
      label: 'Purchases', 
      value: totalPurchases.toLocaleString(),
      icon: Package,
      description: 'Paid orders'
    },
    { 
      label: 'Downloads', 
      value: totalDownloads.toLocaleString(),
      icon: Download,
      description: 'Total downloads'
    },
    { 
      label: 'Customers', 
      value: uniqueCustomers.toLocaleString(),
      icon: Users,
      description: 'Unique buyers'
    },
  ];

  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 rounded-lg bg-muted/30 border text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
