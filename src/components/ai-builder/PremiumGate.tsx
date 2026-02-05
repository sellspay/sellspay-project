 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Sparkles, ArrowLeft, Crown } from 'lucide-react';
 import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
 
 export function PremiumGate() {
   const navigate = useNavigate();
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
         <div className="flex items-center gap-3">
           <img src={sellspayLogo} alt="SellsPay" className="w-8 h-8 object-contain" />
           <span className="font-semibold text-lg">AI Builder</span>
         </div>
         <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
           <ArrowLeft className="w-4 h-4" />
           Back
         </Button>
       </header>
 
       {/* Content */}
       <div className="flex-1 flex items-center justify-center p-8">
         <div className="max-w-lg text-center space-y-8">
           {/* Premium badge */}
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full border border-primary/30">
             <Crown className="w-5 h-5 text-primary" />
             <span className="text-sm font-medium text-primary">Premium Feature</span>
           </div>
 
           {/* Logo */}
           <div className="relative mx-auto w-24 h-24">
             <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-150" />
             <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-background via-muted/50 to-background border border-border/40 flex items-center justify-center shadow-2xl">
               <img src={sellspayLogo} alt="SellsPay" className="w-14 h-14 object-contain" />
             </div>
           </div>
 
           {/* Title */}
           <div className="space-y-3">
             <h1 className="text-3xl font-bold tracking-tight">AI-Powered Store Builder</h1>
             <p className="text-muted-foreground text-lg leading-relaxed">
               Create stunning storefronts with a single prompt. Describe your vision and watch it come to life.
             </p>
           </div>
 
           {/* Features */}
           <div className="grid gap-4 text-left">
             {[
               'Blank canvas - AI authors everything from zero',
               'Premium layouts, themes, and copy generation',
               'Real-time preview as you iterate',
               'No templates - pure creative freedom',
             ].map((feature, i) => (
               <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                 <Sparkles className="w-4 h-4 text-primary shrink-0" />
                 {feature}
               </div>
             ))}
           </div>
 
           {/* CTA */}
           <div className="pt-4 space-y-3">
             <Button 
               size="lg" 
               onClick={() => navigate('/pricing')}
               className="w-full gap-2 h-12 text-base font-medium"
             >
               <Crown className="w-4 h-4" />
               Upgrade to Premium
             </Button>
             <Button 
               variant="ghost" 
               onClick={() => navigate('/profile')}
               className="w-full"
             >
               Use Free Builder Instead
             </Button>
           </div>
         </div>
       </div>
     </div>
   );
 }