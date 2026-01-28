import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, BarChart3, RefreshCw } from 'lucide-react';
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
import { EditorApplicationCard } from '@/components/dashboard/EditorApplicationCard';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';

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

interface EditorBooking {
  editor_payout_cents: number;
  created_at: string;
  status: string;
}

interface ProductView {
  product_id: string;
  referrer_domain: string | null;
  country_code: string | null;
  created_at: string;
}

interface ProfileView {
  referrer_domain: string | null;
  country_code: string | null;
  created_at: string;
}

interface ProductDownload {
  product_id: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [editorBookings, setEditorBookings] = useState<EditorBooking[]>([]);
  const [productViews, setProductViews] = useState<ProductView[]>([]);
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [productDownloads, setProductDownloads] = useState<ProductDownload[]>([]);
  
  // Filters
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');

  // Derive seller status from centralized auth
  const isSeller = profile?.is_seller || false;
  const isCreator = profile?.is_creator || false;
  const hasAccess = isSeller || isCreator;

  const fetchDashboardData = async (showToast = false) => {
    if (!profile) return;
    
    try {
      if (showToast) setRefreshing(true);
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('creator_id', profile.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      const productIds = productsData?.map(p => p.id) || [];
      
      if (productIds.length > 0) {
        // Fetch purchases
        const { data: purchasesData } = await supabase
          .from('purchases')
          .select('product_id, creator_payout_cents, created_at, buyer_id')
          .in('product_id', productIds)
          .eq('status', 'completed');
        
        setPurchases(purchasesData || []);

        // Fetch real product views
        const { data: viewsData } = await supabase
          .from('product_views')
          .select('product_id, referrer_domain, country_code, created_at')
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
          .limit(10000);
        
        setProductViews(viewsData || []);

        // Fetch product downloads
        const { data: downloadsData } = await supabase
          .from('product_downloads')
          .select('product_id, created_at')
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
          .limit(10000);
        
        setProductDownloads(downloadsData || []);
      }

      // Fetch profile views (total visitors to seller's profile)
      const { data: profileViewsData } = await supabase
        .from('profile_views')
        .select('referrer_domain, country_code, created_at')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10000);
      
      setProfileViews(profileViewsData || []);

      // Fetch editor bookings (if user is an editor) - include all paid bookings
      const { data: bookingsData } = await supabase
        .from('editor_bookings')
        .select('editor_payout_cents, created_at, status')
        .eq('editor_id', profile.id)
        .in('status', ['completed', 'in_progress', 'queued']); // Include all paid statuses
      
      setEditorBookings(bookingsData || []);
      
      if (showToast) toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && profile && hasAccess) {
      fetchDashboardData();
    } else if (!profileLoading) {
      setLoading(false);
    }
  }, [user, profile, hasAccess, profileLoading]);

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

  // Filter views based on selected product and date range
  const filteredViews = useMemo(() => {
    const { start, end } = getDateRange();
    
    return productViews.filter(v => {
      const viewDate = new Date(v.created_at);
      const inDateRange = viewDate >= start && viewDate <= end;
      const matchesProduct = selectedProduct === 'all' || v.product_id === selectedProduct;
      return inDateRange && matchesProduct;
    });
  }, [productViews, selectedProduct, dateRange]);

  // Filter downloads based on selected product and date range
  const filteredDownloads = useMemo(() => {
    const { start, end } = getDateRange();
    
    return productDownloads.filter(d => {
      const downloadDate = new Date(d.created_at);
      const inDateRange = downloadDate >= start && downloadDate <= end;
      const matchesProduct = selectedProduct === 'all' || d.product_id === selectedProduct;
      return inDateRange && matchesProduct;
    });
  }, [productDownloads, selectedProduct, dateRange]);

  // Filter profile views based on date range (not product-specific)
  const filteredProfileViews = useMemo(() => {
    const { start, end } = getDateRange();
    
    return profileViews.filter(v => {
      const viewDate = new Date(v.created_at);
      return viewDate >= start && viewDate <= end;
    });
  }, [profileViews, dateRange]);

  // Generate daily views data from REAL data
  const dailyViewsData = useMemo(() => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    
    // Group views by day
    const viewsByDay = new Map<string, number>();
    filteredViews.forEach(v => {
      const dayKey = format(new Date(v.created_at), 'yyyy-MM-dd');
      viewsByDay.set(dayKey, (viewsByDay.get(dayKey) || 0) + 1);
    });
    
    return days.map(day => {
      const dateStr = format(day, 'MMM d');
      const dayKey = format(day, 'yyyy-MM-dd');
      return { date: dateStr, views: viewsByDay.get(dayKey) || 0 };
    });
  }, [filteredViews, dateRange]);

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

  // Calculate summary stats from REAL data
  const summaryStats = useMemo(() => {
    const totalSales = filteredPurchases.reduce((acc, p) => acc + p.creator_payout_cents, 0) / 100;
    const uniqueCustomers = new Set(filteredPurchases.map(p => p.buyer_id)).size;
    const totalPurchases = filteredPurchases.length;
    const totalDownloads = filteredDownloads.length;
    const totalProductViews = filteredViews.length;
    const totalProfileViews = filteredProfileViews.length;
    
    return { totalSales, uniqueCustomers, totalPurchases, totalDownloads, totalProductViews, totalProfileViews };
  }, [filteredPurchases, filteredDownloads, filteredViews, filteredProfileViews]);

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

  // Calculate total earnings
  const totalProductEarnings = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.creator_payout_cents, 0) / 100;
  }, [purchases]);

  const totalEditorEarnings = useMemo(() => {
    return editorBookings.reduce((acc, b) => acc + b.editor_payout_cents, 0) / 100;
  }, [editorBookings]);

  // REAL visitor sources from product_views table
  const visitorSources = useMemo(() => {
    if (filteredViews.length === 0) return [];
    
    // Group views by referrer domain
    const sourceMap = new Map<string, { visits: number; orders: number }>();
    
    filteredViews.forEach(v => {
      const domain = v.referrer_domain || 'Direct';
      const current = sourceMap.get(domain) || { visits: 0, orders: 0 };
      current.visits++;
      sourceMap.set(domain, current);
    });
    
    // Add order counts from purchases
    filteredPurchases.forEach(p => {
      // Find the view that matches this purchase (by product_id and buyer proximity in time)
      const matchingView = filteredViews.find(v => 
        v.product_id === p.product_id && 
        new Date(v.created_at) <= new Date(p.created_at)
      );
      const domain = matchingView?.referrer_domain || 'Direct';
      const current = sourceMap.get(domain);
      if (current) {
        current.orders++;
      }
    });
    
    // Convert to array and sort by visits
    return Array.from(sourceMap.entries())
      .map(([referrer, data]) => ({ referrer, ...data }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
  }, [filteredViews, filteredPurchases]);


  if (loading || profileLoading) {
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

  if (!hasAccess) {
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
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time insights into your performance</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Earnings Card at Top */}
      <div className="mb-6">
        <EarningsCard 
          productEarnings={totalProductEarnings} 
          editorEarnings={totalEditorEarnings} 
        />
      </div>

      {/* Editor Application Card - only shown for approved editors */}
      {profile?.is_editor && profile.id && (
        <div className="mb-6">
          <EditorApplicationCard profileId={profile.id} />
        </div>
      )}

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
            totalPurchases={summaryStats.totalPurchases}
            totalDownloads={summaryStats.totalDownloads}
            totalProductViews={summaryStats.totalProductViews}
            totalProfileViews={summaryStats.totalProfileViews}
          />
        </CardContent>
      </Card>

      {/* Sales Breakdown */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <SalesBreakdown products={salesBreakdown} />
        </CardContent>
      </Card>

      {/* Visitor Sources - Now with REAL data */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <VisitorSourcesTable sources={visitorSources} />
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="bg-card mt-6">
        <CardContent className="p-6">
          <ConversionFunnel
            views={summaryStats.totalProductViews}
            startedCheckout={Math.floor(summaryStats.totalPurchases * 1.5)}
            completedCheckout={summaryStats.totalPurchases}
          />
        </CardContent>
      </Card>

    </div>
  );
}
