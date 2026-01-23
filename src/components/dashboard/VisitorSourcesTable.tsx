import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VisitorSource {
  referrer: string;
  visits: number;
  orders: number;
}

interface VisitorSourcesTableProps {
  sources: VisitorSource[];
}

export function VisitorSourcesTable({ sources }: VisitorSourcesTableProps) {
  const calculateConversion = (orders: number, visits: number) => {
    if (visits === 0) return '0%';
    return `${((orders / visits) * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Top 10 Visitor Sources</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs uppercase text-muted-foreground">Referer</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground"># Visits</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground"># Orders</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">Conversion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No visitor data available
              </TableCell>
            </TableRow>
          ) : (
            sources.map((source) => (
              <TableRow key={source.referrer}>
                <TableCell>{source.referrer}</TableCell>
                <TableCell>{source.visits}</TableCell>
                <TableCell>{source.orders}</TableCell>
                <TableCell>{calculateConversion(source.orders, source.visits)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
