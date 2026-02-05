import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ToolShowcase } from "@/components/tools/ToolShowcase";
import { ToolActiveView } from "@/components/tools/ToolActiveView";
import { useSubscription } from "@/hooks/useSubscription";

export default function Tools() {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { credits: creditBalance, loading: isLoading } = useSubscription();

  // Handle URL params for direct tool access
  useEffect(() => {
    const toolParam = searchParams.get("tool");
    if (toolParam) {
      setActiveTool(toolParam);
    }
  }, [searchParams]);

  const handleActivateTool = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {activeTool ? (
        <ToolActiveView 
          toolId={activeTool} 
          onClose={handleCloseTool}
          creditBalance={creditBalance}
          isLoadingCredits={isLoading}
        />
      ) : (
        <ToolShowcase 
          onSelectTool={handleActivateTool}
          creditBalance={creditBalance}
          isLoadingCredits={isLoading}
        />
      )}
    </div>
  );
}
