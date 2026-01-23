import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  Eye, 
  ShoppingCart,
  Loader2,
  BarChart3,
  Clock,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileData {
  id: string;
  is_creator: boolean | null;
  is_editor: boolean | null;
  editor_hourly_rate_cents: number | null;
}

interface ProductStats {
  id: string;
  name: string;
  price_cents: number | null;
  pricing_type: string | null;
  status: string | null;
  created_at: string | null;
  purchases_count: number;
  total_revenue: number;
}

interface BookingStats {
  id: string;
  hours: number;
  total_amount_cents: number;
  editor_payout_cents: number;
  status: string;
  created_at: string;
  buyer_name: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats[]>([]);
  
  // Aggregated stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [editorEarnings, setEditorEarnings] = useState(0);
  const [totalHoursWorked, setTotalHoursWorked] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_creator, is_editor, editor_hourly_rate_cents')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setLoading(false);
        return;
      }
      
      setProfile(profileData);

      // Fetch creator stats if user is a creator
      if (profileData.is_creator) {
        // Fetch products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, price_cents, pricing_type, status, created_at')
          .eq('creator_id', profileData.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Fetch purchases for these products
        const productIds = products?.map(p => p.id) || [];
        let purchasesMap: Record<string, { count: number; revenue: number }> = {};

        if (productIds.length > 0) {
          const { data: purchases } = await supabase
            .from('purchases')
            .select('product_id, creator_payout_cents, status')
            .in('product_id', productIds)
            .eq('status', 'completed');

          purchases?.forEach(p => {
            if (!purchasesMap[p.product_id]) {
              purchasesMap[p.product_id] = { count: 0, revenue: 0 };
            }
            purchasesMap[p.product_id].count++;
            purchasesMap[p.product_id].revenue += p.creator_payout_cents;
          });
        }

        const statsWithPurchases = products?.map(p => ({
          ...p,
          purchases_count: purchasesMap[p.id]?.count || 0,
          total_revenue: purchasesMap[p.id]?.revenue || 0
        })) || [];

        setProductStats(statsWithPurchases);
        setTotalProducts(products?.length || 0);
        setTotalSales(Object.values(purchasesMap).reduce((acc, p) => acc + p.count, 0));
        setTotalRevenue(Object.values(purchasesMap).reduce((acc, p) => acc + p.revenue, 0));

        // Fetch pending payouts
        const { data: pendingPurchases } = await supabase
          .from('purchases')
          .select('creator_payout_cents')
          .in('product_id', productIds)
          .eq('status', 'pending');

        setPendingPayouts(pendingPurchases?.reduce((acc, p) => acc + p.creator_payout_cents, 0) || 0);
      }

      // Fetch editor stats if user is an editor
      if (profileData.is_editor) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('editor_bookings')
          .select('id, hours, total_amount_cents, editor_payout_cents, status, created_at, buyer_id')
          .eq('editor_id', profileData.id)
          .order('created_at', { ascending: false });

        if (!bookingsError && bookings) {
          // Get buyer names
          const buyerIds = [...new Set(bookings.map(b => b.buyer_id))];
          let buyersMap: Record<string, string> = {};
          
          if (buyerIds.length > 0) {
            const { data: buyers } = await supabase
              .from('profiles')
              .select('id, full_name, username')
              .in('id', buyerIds);
            
            buyers?.forEach(b => {
              buyersMap[b.id] = b.full_name || b.username || 'Unknown';
            });
          }

          const bookingsWithNames = bookings.map(b => ({
            ...b,
            buyer_name: buyersMap[b.buyer_id] || null
          }));

          setBookingStats(bookingsWithNames);
          setEditorEarnings(bookings.filter(b => b.status === 'paid' || b.status === 'completed')
            .reduce((acc, b) => acc + b.editor_payout_cents, 0));
          setTotalHoursWorked(bookings.filter(b => b.status === 'completed')
            .reduce((acc, b) => acc + b.hours, 0));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

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

  if (!profile?.is_creator && !profile?.is_editor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Dashboard Not Available</h1>
        <p className="text-muted-foreground mb-8">
          The dashboard is available for creators and editors. Become a creator or apply as an editor to access it.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate('/settings')}>
            Become a Creator
          </Button>
          <Button onClick={() => navigate('/hire-editors')}>
            Apply as Editor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your earnings and performance.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue + editorEarnings)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {profile?.is_creator && (
          <>
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalSales}</p>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/20">
                    <Package className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalProducts}</p>
                    <p className="text-sm text-muted-foreground">Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/20">
                    <Wallet className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatPrice(pendingPayouts)}</p>
                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {profile?.is_editor && (
          <>
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalHoursWorked}</p>
                    <p className="text-sm text-muted-foreground">Hours Worked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/20">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{bookingStats.length}</p>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Data Tables */}
      <Tabs defaultValue={profile?.is_creator ? "products" : "bookings"} className="space-y-6">
        <TabsList>
          {profile?.is_creator && <TabsTrigger value="products">Products</TabsTrigger>}
          {profile?.is_editor && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
        </TabsList>

        {/* Products Tab */}
        {profile?.is_creator && (
          <TabsContent value="products">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Track sales and revenue for each product</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productStats.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          {product.status === 'published' ? (
                            <Badge className="bg-green-500/20 text-green-500">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.pricing_type === 'free' ? 'Free' : formatPrice(product.price_cents || 0)}
                        </TableCell>
                        <TableCell>{product.purchases_count}</TableCell>
                        <TableCell>{formatPrice(product.total_revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {productStats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No products yet. <Button variant="link" onClick={() => navigate('/create-product')}>Create your first product</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Bookings Tab */}
        {profile?.is_editor && (
          <TabsContent value="bookings">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>View and manage your editing bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Your Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingStats.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.buyer_name || 'Unknown'}</TableCell>
                        <TableCell>{booking.hours} hrs</TableCell>
                        <TableCell>{formatPrice(booking.editor_payout_cents)}</TableCell>
                        <TableCell>
                          {booking.status === 'completed' ? (
                            <Badge className="bg-green-500/20 text-green-500">Completed</Badge>
                          ) : booking.status === 'paid' ? (
                            <Badge className="bg-blue-500/20 text-blue-500">Paid</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(booking.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {bookingStats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings yet. Your bookings will appear here when clients hire you.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
