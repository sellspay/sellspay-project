import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, DollarSign, TrendingUp, Search, MoreHorizontal, Loader2, Shield, FileText, CheckCircle, XCircle, Clock, Eye, Star, Trash2, AlertTriangle, X, Briefcase, Crown, UserMinus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth, checkUserRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ViewApplicationDialog from "@/components/admin/ViewApplicationDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";
import ManageFeaturedDialog from "@/components/admin/ManageFeaturedDialog";
import DeleteProductDialog from "@/components/admin/DeleteProductDialog";
import ViewCreatorApplicationDialog from "@/components/admin/ViewCreatorApplicationDialog";
import SpotlightNominationsDialog from "@/components/admin/SpotlightNominationsDialog";
import SpotlightLeaderboard from "@/components/admin/SpotlightLeaderboard";
import { CreatorApplication, PRODUCT_TYPE_OPTIONS } from "@/components/creator-application/types";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
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
  reviewed_at: string | null;
  profile?: {
    avatar_url: string | null;
    username: string | null;
  };
}

// Helper to calculate days remaining before rejected user can reapply
const getDaysUntilReapply = (reviewedAt: string | null): number => {
  if (!reviewedAt) return 0;
  const reviewedDate = new Date(reviewedAt);
  const cooldownEnd = new Date(reviewedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
};

// Check if a rejected application is past the 14-day cooldown
const isExpiredRejection = (reviewedAt: string | null): boolean => {
  return getDaysUntilReapply(reviewedAt) <= 0;
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editorApplications, setEditorApplications] = useState<EditorApplication[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [creatorAppSearch, setCreatorAppSearch] = useState("");
  const [manageUsersSearch, setManageUsersSearch] = useState("");
  const [manageUsersFilter, setManageUsersFilter] = useState<'all' | 'creators' | 'editors'>('all');
  const [revokingUserCreator, setRevokingUserCreator] = useState<string | null>(null);
  const [revokingUserEditor, setRevokingUserEditor] = useState<string | null>(null);
  const [viewingApplication, setViewingApplication] = useState<EditorApplication | null>(null);
  const [viewingCreatorApp, setViewingCreatorApp] = useState<CreatorApplication | null>(null);
  const [applicationTab, setApplicationTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [creatorAppTab, setCreatorAppTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // New dialog states
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState<string | null>(null);
  const [deletingCreatorAppId, setDeletingCreatorAppId] = useState<string | null>(null);
  const [showSpotlightDialog, setShowSpotlightDialog] = useState(false);
  const [revokingEditorId, setRevokingEditorId] = useState<string | null>(null);
  const [revokingCreatorId, setRevokingCreatorId] = useState<string | null>(null);
  
  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCreators, setTotalCreators] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [pendingCreatorAppsCount, setPendingCreatorAppsCount] = useState(0);

  // Check admin role on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const hasAdminRole = await checkUserRole('admin');
      setIsAdmin(hasAdminRole);
      
      if (hasAdminRole) {
        fetchData();
      } else {
        setLoading(false);
      }
    };
    
    checkAdminAccess();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch users (no email - moved to private schema)
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url, bio, is_creator, is_editor, suspended, verified, created_at")
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
        // Get profile info for each application (no email - in private schema)
        const appUserIds = [...new Set(applicationsData.map(a => a.user_id))];
        let profilesMap: Record<string, { avatar_url: string | null; username: string | null }> = {};
        
        if (appUserIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, avatar_url, username")
            .in("id", appUserIds);
          
          profilesData?.forEach(p => {
            profilesMap[p.id] = { avatar_url: p.avatar_url, username: p.username };
          });
        }

        const appsWithProfiles = applicationsData.map(a => ({
          ...a,
          profile: profilesMap[a.user_id] || null
        }));

        setEditorApplications(appsWithProfiles);
        setPendingApplicationsCount(applicationsData.filter(a => a.status === 'pending').length);
      }

      // Fetch creator applications
      const { data: creatorAppsData, error: creatorAppsError } = await supabase
        .from("creator_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!creatorAppsError && creatorAppsData) {
        const creatorAppUserIds = [...new Set(creatorAppsData.map(a => a.user_id))];
        let creatorProfilesMap: Record<string, { avatar_url: string | null; username: string | null }> = {};
        
        if (creatorAppUserIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, avatar_url, username")
            .in("id", creatorAppUserIds);
          
          profilesData?.forEach(p => {
            creatorProfilesMap[p.id] = { avatar_url: p.avatar_url, username: p.username };
          });
        }

        const creatorAppsWithProfiles = creatorAppsData.map(a => ({
          ...a,
          profile: creatorProfilesMap[a.user_id] || null
        }));

        setCreatorApplications(creatorAppsWithProfiles);
        setPendingCreatorAppsCount(creatorAppsData.filter(a => a.status === 'pending').length);
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

  // Delete expired rejected application
  const handleDeleteApplication = async (applicationId: string) => {
    setDeletingApplicationId(applicationId);
    try {
      const { error } = await supabase
        .from("editor_applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;

      toast.success("Application removed");
      fetchData();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setDeletingApplicationId(null);
    }
  };

  // Handle creator application actions
  const handleCreatorAppAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const application = creatorApplications.find(a => a.id === applicationId);
      if (!application) return;

      // Update application status
      const { error: updateError } = await supabase
        .from('creator_applications')
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
            is_creator: true,
            verified: true
          })
          .eq('id', application.user_id);

        if (profileError) throw profileError;
      }

      toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  // Delete creator application
  const handleDeleteCreatorApp = async (applicationId: string) => {
    setDeletingCreatorAppId(applicationId);
    try {
      const { error } = await supabase
        .from("creator_applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;

      toast.success("Application removed");
      fetchData();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setDeletingCreatorAppId(null);
    }
  };

  // Revoke editor status
  const handleRevokeEditor = async (application: EditorApplication) => {
    setRevokingEditorId(application.id);
    try {
      // Remove editor status from profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_editor: false,
          editor_hourly_rate_cents: null,
          editor_services: null,
          editor_languages: null,
          editor_country: null,
          editor_city: null,
          editor_about: null
        })
        .eq('id', application.user_id);

      if (profileError) throw profileError;

      // Delete the application record
      const { error: deleteError } = await supabase
        .from('editor_applications')
        .delete()
        .eq('id', application.id);

      if (deleteError) throw deleteError;

      toast.success("Editor status revoked successfully");
      fetchData();
    } catch (error) {
      console.error("Error revoking editor:", error);
      toast.error("Failed to revoke editor status");
    } finally {
      setRevokingEditorId(null);
    }
  };

  // Revoke verified creator status
  const handleRevokeCreator = async (application: CreatorApplication) => {
    setRevokingCreatorId(application.id);
    try {
      // Remove creator and verified status from profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_creator: false,
          verified: false
        })
        .eq('id', application.user_id);

      if (profileError) throw profileError;

      // Delete the application record
      const { error: deleteError } = await supabase
        .from('creator_applications')
        .delete()
        .eq('id', application.id);

      if (deleteError) throw deleteError;

      toast.success("Creator verification revoked successfully");
      fetchData();
    } catch (error) {
      console.error("Error revoking creator:", error);
      toast.error("Failed to revoke creator status");
    } finally {
      setRevokingCreatorId(null);
    }
  };

  // Revoke creator status directly from user (Manage Users tab)
  const handleRevokeCreatorFromUser = async (userId: string) => {
    setRevokingUserCreator(userId);
    try {
      // Remove creator and verified status from profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_creator: false,
          verified: false
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete any creator application record
      await supabase
        .from('creator_applications')
        .delete()
        .eq('user_id', userId);

      toast.success("Creator status revoked successfully");
      fetchData();
    } catch (error) {
      console.error("Error revoking creator:", error);
      toast.error("Failed to revoke creator status");
    } finally {
      setRevokingUserCreator(null);
    }
  };

  // Revoke editor status directly from user (Manage Users tab)
  const handleRevokeEditorFromUser = async (userId: string) => {
    setRevokingUserEditor(userId);
    try {
      // Remove editor status and clear all editor fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_editor: false,
          editor_hourly_rate_cents: null,
          editor_services: null,
          editor_languages: null,
          editor_country: null,
          editor_city: null,
          editor_about: null
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete any editor application record
      await supabase
        .from('editor_applications')
        .delete()
        .eq('user_id', userId);

      toast.success("Editor status revoked successfully");
      fetchData();
    } catch (error) {
      console.error("Error revoking editor:", error);
      toast.error("Failed to revoke editor status");
    } finally {
      setRevokingUserEditor(null);
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
    (u.full_name?.toLowerCase() || "").includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter applications by search query first
  const searchFilteredApplications = editorApplications.filter(a =>
    a.display_name.toLowerCase().includes(applicationSearch.toLowerCase()) ||
    (a.profile?.username?.toLowerCase() || "").includes(applicationSearch.toLowerCase())
  );

  // Then filter by status tab
  const pendingApplications = searchFilteredApplications.filter(a => a.status === 'pending');
  const approvedApplications = searchFilteredApplications.filter(a => a.status === 'approved');
  const rejectedApplications = searchFilteredApplications.filter(a => a.status === 'rejected');

  // Get the applications for current tab
  const currentTabApplications = applicationTab === 'pending' 
    ? pendingApplications 
    : applicationTab === 'approved' 
      ? approvedApplications 
      : rejectedApplications;

  // Filter creator applications
  const searchFilteredCreatorApps = creatorApplications.filter(a =>
    a.full_name.toLowerCase().includes(creatorAppSearch.toLowerCase()) ||
    (a.profile?.username?.toLowerCase() || "").includes(creatorAppSearch.toLowerCase())
  );

  const pendingCreatorApps = searchFilteredCreatorApps.filter(a => a.status === 'pending');
  const approvedCreatorApps = searchFilteredCreatorApps.filter(a => a.status === 'approved');
  const rejectedCreatorApps = searchFilteredCreatorApps.filter(a => a.status === 'rejected');

  const currentCreatorApps = creatorAppTab === 'pending'
    ? pendingCreatorApps
    : creatorAppTab === 'approved'
      ? approvedCreatorApps
      : rejectedCreatorApps;

  const getProductTypeLabel = (value: string) => {
    return PRODUCT_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          {!user ? "Please sign in to access the admin panel." : "You don't have permission to access this page."}
        </p>
        <Button onClick={() => navigate(user ? "/" : "/login")}>{user ? "Go Home" : "Sign In"}</Button>
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
                <p className="text-2xl font-bold">{pendingApplicationsCount}</p>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="manage-users">
            <UserCog className="w-4 h-4 mr-1.5" />
            Manage Users
          </TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="featured" className="relative">
            <Star className="w-4 h-4 mr-1.5" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="spotlight" className="relative">
            <Crown className="w-4 h-4 mr-1.5 text-amber-500" />
            Spotlight
          </TabsTrigger>
          <TabsTrigger value="editor-applications" className="relative">
            Editor Applications
            {pendingApplicationsCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-yellow-950 text-xs px-1.5 py-0.5 rounded-full">
                {pendingApplicationsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="creator-applications" className="relative">
            <Briefcase className="w-4 h-4 mr-1.5" />
            Creator Applications
            {pendingCreatorAppsCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-yellow-950 text-xs px-1.5 py-0.5 rounded-full">
                {pendingCreatorAppsCount}
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
                      <TableCell>@{profile.username || "-"}</TableCell>
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

        {/* Manage Users Tab */}
        <TabsContent value="manage-users">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" />
                    Manage User Roles
                  </CardTitle>
                  <CardDescription>Quick actions to revoke creator or editor roles</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <Button 
                      variant={manageUsersFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setManageUsersFilter('all')}
                    >
                      All
                    </Button>
                    <Button 
                      variant={manageUsersFilter === 'creators' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setManageUsersFilter('creators')}
                    >
                      Creators
                    </Button>
                    <Button 
                      variant={manageUsersFilter === 'editors' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setManageUsersFilter('editors')}
                    >
                      Editors
                    </Button>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={manageUsersSearch}
                      onChange={(e) => setManageUsersSearch(e.target.value)}
                      placeholder="Search by name..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Current Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(u => {
                      // Filter by search
                      const matchesSearch = 
                        (u.username?.toLowerCase() || "").includes(manageUsersSearch.toLowerCase()) ||
                        (u.full_name?.toLowerCase() || "").includes(manageUsersSearch.toLowerCase());
                      
                      // Filter by role
                      if (manageUsersFilter === 'creators') return matchesSearch && u.is_creator;
                      if (manageUsersFilter === 'editors') return matchesSearch && u.is_editor;
                      return matchesSearch && (u.is_creator || u.is_editor);
                    })
                    .map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
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
                        <TableCell>
                          <div className="flex gap-1.5 flex-wrap">
                            {profile.is_creator && (
                              <Badge className="bg-primary/20 text-primary">
                                Creator
                              </Badge>
                            )}
                            {profile.is_editor && (
                              <Badge className="bg-accent/20 text-accent">
                                Editor
                              </Badge>
                            )}
                            {profile.verified && (
                              <Badge variant="outline" className="text-green-500 border-green-500/30">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile.suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {profile.is_creator && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={revokingUserCreator === profile.id}
                                onClick={() => handleRevokeCreatorFromUser(profile.id)}
                              >
                                {revokingUserCreator === profile.id ? (
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                  <UserMinus className="w-3 h-3 mr-1.5" />
                                )}
                                Revoke Creator
                              </Button>
                            )}
                            {profile.is_editor && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={revokingUserEditor === profile.id}
                                onClick={() => handleRevokeEditorFromUser(profile.id)}
                              >
                                {revokingUserEditor === profile.id ? (
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                  <UserMinus className="w-3 h-3 mr-1.5" />
                                )}
                                Revoke Editor
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {users.filter(u => u.is_creator || u.is_editor).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No creators or editors found
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

        {/* Featured Tab */}
        <TabsContent value="featured">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Featured Products
                  </CardTitle>
                  <CardDescription>
                    Manage which products appear on the homepage
                  </CardDescription>
                </div>
                <Button onClick={() => setShowFeaturedDialog(true)} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Star className="w-4 h-4" />
                  Manage Featured
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold">{products.filter(p => p.featured).length}</p>
                      <p className="text-sm text-muted-foreground">Featured Products</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{products.filter(p => p.status === 'published').length}</p>
                      <p className="text-sm text-muted-foreground">Published Products</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">
                        {products.filter(p => p.featured).length > 0 ? "Active" : "Inactive"}
                      </p>
                      <p className="text-sm text-muted-foreground">Homepage Display</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Products Grid */}
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Currently Featured ({products.filter(p => p.featured).length})
              </h3>
              
              {products.filter(p => p.featured).length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl">
                  <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">No featured products yet</p>
                  <Button onClick={() => setShowFeaturedDialog(true)} variant="outline">
                    Add Featured Products
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.filter(p => p.featured).map((product) => (
                    <div
                      key={product.id}
                      className="group relative rounded-xl overflow-hidden border border-amber-500/30 bg-card hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10"
                    >
                      {/* Placeholder for cover image - we don't have it in products list */}
                      <div className="aspect-video relative bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                        <Star className="w-8 h-8 text-amber-500/50" />
                        {/* Featured badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-amber-500 text-amber-950 text-[10px]">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            Featured
                          </Badge>
                        </div>
                        {/* Remove overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleToggleFeatured(product)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                      {/* Product Info */}
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          by {product.creator?.full_name || product.creator?.username || "Unknown"}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                          {formatPrice(product.price_cents, product.pricing_type)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spotlight Tab - Leaderboard View */}
        <TabsContent value="spotlight">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Creator Spotlight Nominations
                  </CardTitle>
                  <CardDescription>
                    End-of-month leaderboard — feature the most nominated creators
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowSpotlightDialog(true)} 
                  className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  <Crown className="w-4 h-4" />
                  Add to Spotlight
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SpotlightLeaderboard onSelectCreator={() => setShowSpotlightDialog(true)} />
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
              {/* Application Status Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={applicationTab === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationTab('pending')}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Pending
                  {pendingApplications.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {pendingApplications.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={applicationTab === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationTab('approved')}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approved
                  {approvedApplications.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {approvedApplications.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={applicationTab === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationTab('rejected')}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rejected
                  {rejectedApplications.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {rejectedApplications.length}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Rejected Tab Info */}
              {applicationTab === 'rejected' && rejectedApplications.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Rejection Cooldown</p>
                    <p className="text-muted-foreground">
                      Rejected applicants cannot reapply for 14 days. After the cooldown expires, their application can be removed to allow reapplication.
                    </p>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Services</TableHead>
                    {applicationTab === 'rejected' && <TableHead>Cooldown</TableHead>}
                    <TableHead>{applicationTab === 'pending' ? 'Applied' : applicationTab === 'approved' ? 'Approved' : 'Rejected'}</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTabApplications.map((app) => {
                    const daysRemaining = app.status === 'rejected' ? getDaysUntilReapply(app.reviewed_at) : 0;
                    const canBeRemoved = app.status === 'rejected' && isExpiredRejection(app.reviewed_at);
                    
                    return (
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
                        {applicationTab === 'rejected' && (
                          <TableCell>
                            {canBeRemoved ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                Expired - Can remove
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/20 text-destructive">
                                {daysRemaining} days left
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          {formatDate(applicationTab === 'pending' ? app.created_at : app.reviewed_at)}
                        </TableCell>
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
                            {app.status === 'approved' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRevokeEditor(app)}
                                disabled={revokingEditorId === app.id}
                                title="Revoke Editor Status"
                              >
                                {revokingEditorId === app.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <UserMinus className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            {app.status === 'rejected' && canBeRemoved && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteApplication(app.id)}
                                disabled={deletingApplicationId === app.id}
                                title="Remove application (allow reapplication)"
                              >
                                {deletingApplicationId === app.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {currentTabApplications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No {applicationTab} applications found
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

        {/* Creator Applications Tab */}
        <TabsContent value="creator-applications">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Creator Applications</CardTitle>
                  <CardDescription>Review and manage creator applications</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={creatorAppSearch}
                    onChange={(e) => setCreatorAppSearch(e.target.value)}
                    placeholder="Search applications..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Tabs */}
              <div className="flex gap-2 mb-6">
                <Button variant={creatorAppTab === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setCreatorAppTab('pending')} className="gap-2">
                  <Clock className="w-4 h-4" /> Pending
                  {pendingCreatorApps.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pendingCreatorApps.length}</Badge>}
                </Button>
                <Button variant={creatorAppTab === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => setCreatorAppTab('approved')} className="gap-2">
                  <CheckCircle className="w-4 h-4" /> Approved
                  {approvedCreatorApps.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{approvedCreatorApps.length}</Badge>}
                </Button>
                <Button variant={creatorAppTab === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setCreatorAppTab('rejected')} className="gap-2">
                  <XCircle className="w-4 h-4" /> Rejected
                  {rejectedCreatorApps.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{rejectedCreatorApps.length}</Badge>}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Product Types</TableHead>
                    {creatorAppTab === 'rejected' && <TableHead>Cooldown</TableHead>}
                    <TableHead>{creatorAppTab === 'pending' ? 'Applied' : 'Reviewed'}</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCreatorApps.map((app) => {
                    const daysRemaining = app.status === 'rejected' ? getDaysUntilReapply(app.reviewed_at) : 0;
                    const canBeRemoved = app.status === 'rejected' && isExpiredRejection(app.reviewed_at);
                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={app.profile?.avatar_url || undefined} />
                              <AvatarFallback>{app.full_name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{app.full_name}</p>
                              {app.profile?.username && <p className="text-sm text-muted-foreground">@{app.profile.username}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{app.state}, {app.country}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {app.product_types.slice(0, 2).map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs">{getProductTypeLabel(t)}</Badge>
                            ))}
                            {app.product_types.length > 2 && <Badge variant="outline" className="text-xs">+{app.product_types.length - 2}</Badge>}
                          </div>
                        </TableCell>
                        {creatorAppTab === 'rejected' && (
                          <TableCell>
                            {canBeRemoved ? <Badge variant="outline">Expired</Badge> : <Badge className="bg-destructive/20 text-destructive">{daysRemaining} days</Badge>}
                          </TableCell>
                        )}
                        <TableCell>{formatDate(creatorAppTab === 'pending' ? app.created_at : app.reviewed_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewingCreatorApp(app)}><Eye className="w-4 h-4" /></Button>
                            {app.status === 'pending' && (
                              <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleCreatorAppAction(app.id, 'approve')}><CheckCircle className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleCreatorAppAction(app.id, 'reject')}><XCircle className="w-4 h-4" /></Button>
                              </>
                            )}
                            {app.status === 'approved' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                onClick={() => handleRevokeCreator(app)} 
                                disabled={revokingCreatorId === app.id}
                                title="Revoke Creator Status"
                              >
                                {revokingCreatorId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                              </Button>
                            )}
                            {app.status === 'rejected' && canBeRemoved && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCreatorApp(app.id)} disabled={deletingCreatorAppId === app.id}>
                                {deletingCreatorAppId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {currentCreatorApps.length === 0 && <div className="text-center py-8 text-muted-foreground">No {creatorAppTab} applications found</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Creator Application Dialog */}
        <ViewCreatorApplicationDialog
          open={!!viewingCreatorApp}
          onOpenChange={(open) => !open && setViewingCreatorApp(null)}
          application={viewingCreatorApp}
          onApprove={(id) => { handleCreatorAppAction(id, 'approve'); setViewingCreatorApp(null); }}
          onReject={(id) => { handleCreatorAppAction(id, 'reject'); setViewingCreatorApp(null); }}
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
                  <Input type="number" defaultValue="5" className="w-24" min="0" max="100" />
                  <span className="text-muted-foreground">%</span>
                  <Button>Update</Button>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-secondary/20">
                <h3 className="font-medium mb-2">Featured Products</h3>
                <p className="text-sm text-muted-foreground mb-4">Manage which products appear on the homepage.</p>
                <Button variant="outline" onClick={() => setShowFeaturedDialog(true)}><Star className="w-4 h-4 mr-2" />Manage Featured</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SpotlightNominationsDialog 
        open={showSpotlightDialog} 
        onOpenChange={setShowSpotlightDialog} 
      />
    </div>
  );
}
