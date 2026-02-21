import { useState, useEffect } from 'react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VIBECODER_STDLIB } from '@/lib/vibecoder-stdlib';

interface AIStorefrontRendererProps {
  profileId: string;
}

const DEFAULT_PLACEHOLDER = `export default function Storefront() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h1 className="text-2xl font-bold text-white mb-2">AI Storefront</h1>
        <p className="text-zinc-400">This storefront is being set up...</p>
      </div>
    </div>
  );
}`;

export function AIStorefrontRenderer({ profileId }: AIStorefrontRendererProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorefrontCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the published Vibecoder code from project_files
      // Prefer the dedicated published path, with legacy fallback.
      const [filesResp, layoutResp] = await Promise.all([
        (async () => {
          const published = await supabase
            .from('project_files')
            .select('content')
            .eq('profile_id', profileId)
            .eq('file_path', '/App.published.tsx')
            .maybeSingle();

          if (published.data?.content) return published;

          return supabase
            .from('project_files')
            .select('content')
            .eq('profile_id', profileId)
            .eq('file_path', '/App.tsx')
            .maybeSingle();
        })(),
        supabase
          .from('ai_storefront_layouts')
          .select('is_published, vibecoder_mode')
          .eq('profile_id', profileId)
          .maybeSingle(),
      ]);

      // Check if AI storefront is published
      if (!layoutResp.data?.is_published) {
        setError('This AI storefront is not published yet.');
        return;
      }

      // Check if we have code
      if (!filesResp.data?.content) {
        setError('No storefront code found.');
        return;
      }

      setCode(filesResp.data.content);
    } catch (err) {
      console.error('Error fetching storefront code:', err);
      setError('Failed to load storefront.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchStorefrontCode();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Storefront</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchStorefrontCode}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const finalCode = code || DEFAULT_PLACEHOLDER;

  return (
    <div className="min-h-screen w-full">
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={{
          '/App.tsx': finalCode,
          ...VIBECODER_STDLIB,
        }}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
            'framer-motion': 'latest',
          },
        }}
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
          classes: {
            'sp-wrapper': 'h-screen',
            'sp-layout': 'h-full',
            'sp-preview': 'h-full',
          },
        }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
          style={{
            height: '100vh',
            width: '100%',
            border: 'none',
          }}
        />
      </SandpackProvider>
    </div>
  );
}

export default AIStorefrontRenderer;
