 import { useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/lib/auth';
 import { supabase } from '@/integrations/supabase/client';
 import { PremiumGate } from '@/components/ai-builder/PremiumGate';
 import { AIBuilderCanvas } from '@/components/ai-builder/AIBuilderCanvas';
 import { Loader2 } from 'lucide-react';
 
 export default function AIBuilder() {
   const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   const [profile, setProfile] = useState<any>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (authLoading) return;
     
     if (!user) {
       navigate('/login?redirect=/ai-builder');
       return;
     }
 
     const fetchProfile = async () => {
       const { data } = await supabase
         .from('profiles')
         .select('*')
         .eq('user_id', user.id)
         .maybeSingle();
       
       setProfile(data);
       setLoading(false);
     };
 
     fetchProfile();
   }, [user, authLoading, navigate]);
 
   if (authLoading || loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!user || !profile) {
     return null;
   }
 
   // Check premium status
   const isPremium = profile?.subscription_tier && 
     ['pro', 'enterprise', 'creator_pro'].includes(profile.subscription_tier);
 
   if (!isPremium) {
     return <PremiumGate />;
   }
 
   return <AIBuilderCanvas profileId={profile.id} />;
 }