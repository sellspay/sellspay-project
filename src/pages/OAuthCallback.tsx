import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function parseHashParams(hash: string) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const expires_in = params.get("expires_in");
  const token_type = params.get("token_type");
  return {
    access_token,
    refresh_token,
    expires_in: expires_in ? Number(expires_in) : null,
    token_type,
  };
}

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const { access_token, refresh_token } = parseHashParams(window.location.hash);

        // If we don't have tokens, bail back to login.
        if (!access_token || !refresh_token) {
          navigate("/login", { replace: true });
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error("[OAuthCallback] setSession error:", error);
          navigate("/login", { replace: true });
          return;
        }

        const next = localStorage.getItem("postAuthRedirect");
        localStorage.removeItem("postAuthRedirect");
        
        if (next && next !== '/') {
          navigate(next, { replace: true });
        } else {
          // Default to profile page
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', authUser.id)
              .single();
            navigate(prof?.username ? `/@${prof.username}` : '/', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      } catch (e) {
        console.error("[OAuthCallback] error:", e);
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  );
}
