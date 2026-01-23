import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProductSale {
  name: string;
  sales: number;
  revenue: number;
}

interface SalesBreakdownProps {
  products: ProductSale[];
}

export function SalesBreakdown({ products }: SalesBreakdownProps) {
  const hasTransactions = products.some(p => p.sales > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Sales Breakdown</h3>
      
      {!hasTransactions ? (
        <p className="text-muted-foreground text-sm">
          • No transactions have been made in this period
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.filter(p => p.sales > 0).map((product) => (
              <TableRow key={product.name}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{product.sales}</TableCell>
                <TableCell className="text-right">${(product.revenue / 100).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
