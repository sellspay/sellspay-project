import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
}

interface DashboardFiltersProps {
  products: Product[];
  selectedProduct: string;
  onProductChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export function DashboardFilters({
  products,
  selectedProduct,
  onProductChange,
  dateRange,
  onDateRangeChange,
}: DashboardFiltersProps) {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  return (
    <div className="flex flex-wrap items-center gap-2 text-lg">
      <span className="font-semibold">Analytics for</span>
      <Select value={selectedProduct} onValueChange={onProductChange}>
        <SelectTrigger className="w-[180px] bg-card border-border">
          <SelectValue placeholder="All Products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="font-semibold">during</span>
      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-[220px] bg-card border-border">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="this_month">This month (1 {currentMonth} - Today)</SelectItem>
          <SelectItem value="last_7_days">Last 7 days</SelectItem>
          <SelectItem value="last_30_days">Last 30 days</SelectItem>
          <SelectItem value="last_90_days">Last 90 days</SelectItem>
          <SelectItem value="all_time">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
