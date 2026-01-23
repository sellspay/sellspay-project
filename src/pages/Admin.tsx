import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, DollarSign, TrendingUp, Search, MoreHorizontal, Loader2, Shield, FileText, CheckCircle, XCircle, Clock, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ViewApplicationDialog from "@/components/admin/ViewApplicationDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";
import ManageFeaturedDialog from "@/components/admin/ManageFeaturedDialog";
import DeleteProductDialog from "@/components/admin/DeleteProductDialog";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean | null;
  is_editor: boolean | null;
  suspended: boolean | null;
  verified: boolean | null;
  created_at: string | null;
}

interface Product {
  id: string;
  name: string;
  status: string | null;
  pricing_type: string | null;
  price_cents: number | null;
  featured: boolean | null;
  created_at: string | null;
  creator: {
    username: string | null;
    full_name: string | null;
  } | null;
}

interface EditorApplication {
  id: string;
  user_id: string;
  display_name: string;
  about_me: string;
  country: string;
  city: string;
  hourly_rate_cents: number;
  starting_budget_cents?: number | null;
  services: string[];
  languages: string[];
  social_links?: unknown;
  status: string | null;
  created_at: string | null;
  profile?: {
    avatar_url: string | null;
    username: string | null;
    email: string | null;
  };
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editorApplications, setEditorApplications] = useState<EditorApplication[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [viewingApplication, setViewingApplication] = useState<EditorApplication | null>(null);
  
  // New dialog states
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCreators, setTotalCreators] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch users with new fields
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, email, avatar_url, bio, is_creator, is_editor, suspended, verified, created_at")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
      setTotalUsers(usersData?.length || 0);
      setTotalCreators(usersData?.filter(u => u.is_creator).length || 0);

      // Fetch products with featured field
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, status, pricing_type, price_cents, featured, created_at, creator_id")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Fetch creators for products
      const creatorIds = [...new Set(productsData?.map(p => p.creator_id).filter(Boolean) || [])];
      let creatorsMap: Record<string, { username: string | null; full_name: string | null }> = {};
      
      if (creatorIds.length > 0) {
        const { data: creatorsData } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", creatorIds);
        
        creatorsData?.forEach(c => {
          creatorsMap[c.id] = { username: c.username, full_name: c.full_name };
        });
      }

      const productsWithCreators = productsData?.map(p => ({
        ...p,
        creator: p.creator_id ? creatorsMap[p.creator_id] || null : null
      })) || [];

      setProducts(productsWithCreators);
      setTotalProducts(productsData?.length || 0);

      // Fetch editor applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("editor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!applicationsError && applicationsData) {
        // Get profile info for each application
        const appUserIds = [...new Set(applicationsData.map(a => a.user_id))];
        let profilesMap: Record<string, { avatar_url: string | null; username: string | null; email: string | null }> = {};
        
        if (appUserIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, avatar_url, username, email")
            .in("id", appUserIds);
          
          profilesData?.forEach(p => {
            profilesMap[p.id] = { avatar_url: p.avatar_url, username: p.username, email: p.email };
          });
        }

        const appsWithProfiles = applicationsData.map(a => ({
          ...a,
          profile: profilesMap[a.user_id] || null
        }));

        setEditorApplications(appsWithProfiles);
        setPendingApplications(applicationsData.filter(a => a.status === 'pending').length);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const application = editorApplications.find(a => a.id === applicationId);
      if (!application) return;

      // Update application status
      const { error: updateError } = await supabase
        .from('editor_applications')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // If approved, update the profile
      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_editor: true,
            editor_hourly_rate_cents: application.hourly_rate_cents,
            editor_services: application.services,
            editor_languages: application.languages,
            editor_country: application.country,
            editor_city: application.city,
            editor_about: application.about_me
          })
          .eq('id', application.user_id);

        if (profileError) throw profileError;
      }

      toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  // User action handlers
  const handleViewProfile = (profile: Profile) => {
    if (profile.username) {
      navigate(`/@${profile.username}`);
    } else {
      toast.error("User doesn't have a username set");
    }
  };

  const handleEditUser = (profile: Profile) => {
    setEditingUser(profile);
  };

  const handleSuspendUser = async (profile: Profile) => {
    try {
      const newSuspendedStatus = !profile.suspended;
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: newSuspendedStatus })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success(newSuspendedStatus ? "User suspended" : "User unsuspended");
      fetchData();
    } catch (error) {
      console.error("Error updating suspension status:", error);
      toast.error("Failed to update user");
    }
  };

  // Product action handlers
  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/edit-product/${product.id}`);
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const newFeaturedStatus = !product.featured;
      const { error } = await supabase
        .from("products")
        .update({ featured: newFeaturedStatus })
        .eq("id", product.id);

      if (error) throw error;

      toast.success(newFeaturedStatus ? "Product featured" : "Product unfeatured");
      fetchData();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update product");
    }
  };

  const handleRemoveProduct = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deletingProduct.id);

      if (error) throw error;

      toast.success("Product deleted successfully");
      setDeletingProduct(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (cents: number | null, type: string | null) => {
    if (type === "free" || !cents) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const filteredUsers = users.filter(u =>
    (u.username?.toLowerCase() || "").includes(userSearch.toLowerCase()) ||
    (u.full_name?.toLowerCase() || "").includes(userSearch.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredApplications = editorApplications.filter(a =>
    a.display_name.toLowerCase().includes(applicationSearch.toLowerCase()) ||
    (a.profile?.username?.toLowerCase() || "").includes(applicationSearch.toLowerCase())
  );

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
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          Please sign in to access the admin panel.
        </p>
        <Button onClick={() => navigate("/login")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, products, and platform settings.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
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
                <p className="text-2xl font-bold">{totalCreators}</p>
                <p className="text-sm text-muted-foreground">Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Package className="w-6 h-6 text-primary" />
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
                <FileText className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApplications}</p>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="editor-applications" className="relative">
            Editor Applications
            {pendingApplications > 0 && (
              <span className="ml-2 bg-yellow-500 text-yellow-950 text-xs px-1.5 py-0.5 rounded-full">
                {pendingApplications}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage all registered users</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.full_name?.[0] || profile.username?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {profile.full_name || profile.username || "Unnamed"}
                            </p>
                            {profile.username && (
                              <p className="text-sm text-muted-foreground">
                                @{profile.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{profile.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {profile.is_creator && <Badge>Creator</Badge>}
                          {profile.is_editor && <Badge className="bg-accent text-accent-foreground">Editor</Badge>}
                          {!profile.is_creator && !profile.is_editor && <Badge variant="secondary">User</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {profile.verified && (
                            <Badge className="bg-primary/20 text-primary">Verified</Badge>
                          )}
                          {profile.suspended && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                          {!profile.suspended && !profile.verified && (
                            <span className="text-muted-foreground text-sm">Active</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(profile.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(profile)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(profile)}>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSuspendUser(profile)}
                              className={profile.suspended ? "text-primary" : "text-destructive"}
                            >
                              {profile.suspended ? "Unsuspend User" : "Suspend User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage all products on the platform</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.creator?.full_name || product.creator?.username || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {product.status === "published" ? (
                          <Badge className="bg-green-500/20 text-green-500">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.featured ? (
                          <Badge className="bg-yellow-500/20 text-yellow-600">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatPrice(product.price_cents, product.pricing_type)}
                      </TableCell>
                      <TableCell>{formatDate(product.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                              View Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                              {product.featured ? "Remove from Featured" : "Add to Featured"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingProduct(product)}
                              className="text-destructive"
                            >
                              Remove Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editor Applications Tab */}
        <TabsContent value="editor-applications">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Editor Applications</CardTitle>
                  <CardDescription>Review and manage editor applications</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                    placeholder="Search applications..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={app.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {app.display_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{app.display_name}</p>
                            {app.profile?.username && (
                              <p className="text-sm text-muted-foreground">
                                @{app.profile.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.city}, {app.country}
                      </TableCell>
                      <TableCell>
                        ${(app.hourly_rate_cents / 100).toFixed(0)}/hr
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {app.services.slice(0, 2).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {app.services.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.services.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.status === 'pending' && (
                          <Badge className="bg-yellow-500/20 text-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {app.status === 'approved' && (
                          <Badge className="bg-green-500/20 text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {app.status === 'rejected' && (
                          <Badge className="bg-red-500/20 text-red-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(app.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setViewingApplication(app)}
                            title="View Application"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => handleApplicationAction(app.id, 'approve')}
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleApplicationAction(app.id, 'reject')}
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredApplications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No applications found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Application Dialog */}
        <ViewApplicationDialog
          open={!!viewingApplication}
          onOpenChange={(open) => !open && setViewingApplication(null)}
          application={viewingApplication}
          onApprove={(id) => {
            handleApplicationAction(id, 'approve');
            setViewingApplication(null);
          }}
          onReject={(id) => {
            handleApplicationAction(id, 'reject');
            setViewingApplication(null);
          }}
        />

        {/* Edit User Dialog */}
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onUserUpdated={fetchData}
        />

        {/* Manage Featured Dialog */}
        <ManageFeaturedDialog
          open={showFeaturedDialog}
          onOpenChange={setShowFeaturedDialog}
          onFeaturedChanged={fetchData}
        />

        {/* Delete Product Dialog */}
        <DeleteProductDialog
          open={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
          product={deletingProduct}
          onConfirm={handleRemoveProduct}
          isDeleting={isDeleting}
        />

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-secondary/20">
                <h3 className="font-medium mb-2">Commission Rate</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set the platform commission rate for all sales.
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    defaultValue="5"
                    className="w-24"
                    min="0"
                    max="100"
                  />
                  <span className="text-muted-foreground">%</span>
                  <Button>Update</Button>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-secondary/20">
                <h3 className="font-medium mb-2">Featured Products</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage which products appear on the homepage.
                </p>
                <Button variant="outline" onClick={() => setShowFeaturedDialog(true)}>
                  <Star className="w-4 h-4 mr-2" />
                  Manage Featured
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
