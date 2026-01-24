import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { DailyViewsChart } from '@/components/dashboard/DailyViewsChart';
import { DailySalesChart } from '@/components/dashboard/DailySalesChart';
import { StatsSummary } from '@/components/dashboard/StatsSummary';
import { SalesBreakdown } from '@/components/dashboard/SalesBreakdown';
import { VisitorSourcesTable } from '@/components/dashboard/VisitorSourcesTable';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { VisitsMap } from '@/components/dashboard/VisitsMap';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';

interface ProfileData {
  id: string;
  is_creator: boolean | null;
  is_seller: boolean | null;
}

interface Product {
  id: string;
  name: string;
}

interface Purchase {
  product_id: string;
  creator_payout_cents: number;
  created_at: string;
  buyer_id: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // Filters
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_creator, is_seller')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setLoading(false);
        return;
      }
      
      setProfile(profileData);

      if (profileData.is_creator || profileData.is_seller) {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('creator_id', profileData.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch all purchases for these products
        const productIds = productsData?.map(p => p.id) || [];
        
        if (productIds.length > 0) {
          const { data: purchasesData } = await supabase
            .from('purchases')
            .select('product_id, creator_payout_cents, created_at, buyer_id')
            .in('product_id', productIds)
            .eq('status', 'completed');
          
          setPurchases(purchasesData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Get date range for filtering
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'last_7_days':
        return { start: subDays(today, 7), end: today };
      case 'last_30_days':
        return { start: subDays(today, 30), end: today };
      case 'last_90_days':
        return { start: subDays(today, 90), end: today };
      case 'all_time':
        return { start: subDays(today, 365), end: today };
      case 'this_month':
      default:
        return { start: startOfMonth(today), end: today };
    }
  };

  // Filter purchases based on selected product and date range
  const filteredPurchases = useMemo(() => {
    const { start, end } = getDateRange();
    
    return purchases.filter(p => {
      const purchaseDate = new Date(p.created_at);
      const inDateRange = purchaseDate >= start && purchaseDate <= end;
      const matchesProduct = selectedProduct === 'all' || p.product_id === selectedProduct;
      return inDateRange && matchesProduct;
    });
  }, [purchases, selectedProduct, dateRange]);

  // Generate daily views data (simulated based on purchases activity)
  const dailyViewsData = useMemo(() => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, 'MMM d');
      // Simulate views - in a real app, you'd have a views table
      const purchasesOnDay = filteredPurchases.filter(
        p => format(new Date(p.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      ).length;
      // Assume 10-50 views per day, more if there were purchases
      const baseViews = Math.floor(Math.random() * 10);
      const views = baseViews + (purchasesOnDay * 5);
      
      return { date: dateStr, views };
    });
  }, [filteredPurchases, dateRange]);

  // Generate daily sales data
  const dailySalesData = useMemo(() => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, 'MMM d');
      const dayPurchases = filteredPurchases.filter(
        p => format(new Date(p.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const sales = dayPurchases.reduce((acc, p) => acc + p.creator_payout_cents / 100, 0);
      
      return { date: dateStr, sales };
    });
  }, [filteredPurchases, dateRange]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalSales = filteredPurchases.reduce((acc, p) => acc + p.creator_payout_cents, 0) / 100;
    const uniqueCustomers = new Set(filteredPurchases.map(p => p.buyer_id)).size;
    const totalOrders = filteredPurchases.length;
    const totalViews = dailyViewsData.reduce((acc, d) => acc + d.views, 0);
    
    return { totalSales, uniqueCustomers, totalOrders, totalViews };
  }, [filteredPurchases, dailyViewsData]);

  // Sales breakdown by product
  const salesBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; sales: number; revenue: number }> = {};
    
    products.forEach(p => {
      breakdown[p.id] = { name: p.name, sales: 0, revenue: 0 };
    });
    
    filteredPurchases.forEach(p => {
      if (breakdown[p.product_id]) {
        breakdown[p.product_id].sales++;
        breakdown[p.product_id].revenue += p.creator_payout_cents;
      }
    });
    
    return Object.values(breakdown);
  }, [products, filteredPurchases]);

  // Simulated visitor sources (in a real app, you'd track referrers)
  const visitorSources = useMemo(() => {
    const totalViews = summaryStats.totalViews;
    if (totalViews === 0) return [];
    
    return [
      { referrer: 'Direct', visits: Math.floor(totalViews * 0.6), orders: Math.floor(summaryStats.totalOrders * 0.5) },
      { referrer: 'Google', visits: Math.floor(totalViews * 0.2), orders: Math.floor(summaryStats.totalOrders * 0.3) },
      { referrer: 'Twitter', visits: Math.floor(totalViews * 0.1), orders: Math.floor(summaryStats.totalOrders * 0.1) },
      { referrer: 'YouTube', visits: Math.floor(totalViews * 0.05), orders: Math.floor(summaryStats.totalOrders * 0.05) },
      { referrer: 'Other', visits: Math.floor(totalViews * 0.05), orders: Math.floor(summaryStats.totalOrders * 0.05) },
    ].filter(s => s.visits > 0);
  }, [summaryStats]);

  // Simulated country data (in a real app, you'd track visitor locations)
  const countryData = useMemo(() => {
    const totalViews = summaryStats.totalViews;
    if (totalViews === 0) return { countries: [], maxVisits: 0 };
    
    const countries = [
      { country: 'US', visits: Math.floor(totalViews * 0.6) },
      { country: 'GB', visits: Math.floor(totalViews * 0.1) },
      { country: 'CA', visits: Math.floor(totalViews * 0.08) },
      { country: 'AU', visits: Math.floor(totalViews * 0.05) },
      { country: 'DE', visits: Math.floor(totalViews * 0.05) },
    ].filter(c => c.visits > 0);
    
    const maxVisits = Math.max(...countries.map(c => c.visits), 1);
    
    return { countries, maxVisits };
  }, [summaryStats]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          Please sign in to access your dashboard.
        </p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  if (!profile?.is_creator && !profile?.is_seller) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Dashboard Not Available</h1>
        <p className="text-muted-foreground mb-8">
          The dashboard is available for sellers. Become a seller to access it.
        </p>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          Become a Seller
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Analytics Card */}
      <Card className="bg-card">
        <CardContent className="p-6 space-y-6">
          {/* Filters */}
          <DashboardFilters
            products={products}
            selectedProduct={selectedProduct}
            onProductChange={setSelectedProduct}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <Separator />

          {/* Daily Views Chart */}
          <DailyViewsChart data={dailyViewsData} />

          <Separator />

          {/* Daily Sales Chart */}
          <DailySalesChart data={dailySalesData} />

          <Separator />

          {/* Stats Summary */}
          <StatsSummary
            totalSales={summaryStats.totalSales}
            uniqueCustomers={summaryStats.uniqueCustomers}
            totalOrders={summaryStats.totalOrders}
            totalViews={summaryStats.totalViews}
          />
        </CardContent>
      </Card>

      {/* Sales Breakdown */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <SalesBreakdown products={salesBreakdown} />
        </CardContent>
      </Card>

      {/* Visitor Sources */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <VisitorSourcesTable sources={visitorSources} />
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <ConversionFunnel
            views={summaryStats.totalViews}
            startedCheckout={Math.floor(summaryStats.totalOrders * 1.5)}
            completedCheckout={summaryStats.totalOrders}
          />
        </CardContent>
      </Card>

      {/* Visits Map */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <VisitsMap 
            countries={countryData.countries} 
            maxVisits={countryData.maxVisits} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
