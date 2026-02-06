import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChangelogTimeline } from "@/components/changelog/ChangelogTimeline";
import { Skeleton } from "@/components/ui/skeleton";

export default function Changelog() {
  const { data: updates, isLoading } = useQuery({
    queryKey: ["changelog-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-primary" size={28} />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                What's New
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              SellsPay Changelog
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl">
              Track every evolution of the platform. From major features to
              subtle improvements, we document it all so you never miss what's
              new.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Timeline Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <ChangelogTimeline updates={updates ?? []} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by{" "}
            <span className="text-primary font-semibold">VibeCoder 2.0</span>
            {" "}— Self-Healing Multi-Agent Pipeline
          </p>
        </div>
      </footer>
    </div>
  );
}
