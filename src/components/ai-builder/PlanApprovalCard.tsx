import React, { useState } from "react";
import { FileText, ExternalLink, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanApprovalCardProps {
  planId: string;
  title: string;
  summary: string;
  steps?: string[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'executing';
}

export function PlanApprovalCard({ 
  planId, 
  title, 
  summary, 
  steps = [],
  onApprove, 
  onReject,
  isApproving = false,
  status = 'pending'
}: PlanApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isActionable = status === 'pending';
  const isExecuting = status === 'executing' || isApproving;

  return (
    <div className={cn(
      "w-full max-w-2xl border rounded-xl overflow-hidden shadow-xl mb-4 animate-in slide-in-from-bottom-2 transition-all duration-300",
      status === 'approved' && "border-green-500/30 bg-green-950/20",
      status === 'rejected' && "border-red-500/30 bg-red-950/20 opacity-60",
      status === 'executing' && "border-blue-500/30 bg-blue-950/20",
      status === 'pending' && "border-zinc-800 bg-zinc-900"
    )}>
      
      {/* HEADER */}
      <div className={cn(
        "border-b p-3 flex items-center gap-2",
        status === 'approved' && "bg-green-900/20 border-green-800/30",
        status === 'rejected' && "bg-red-900/20 border-red-800/30",
        status === 'executing' && "bg-blue-900/20 border-blue-800/30",
        status === 'pending' && "bg-zinc-800/50 border-zinc-800"
      )}>
        <div className={cn(
          "p-1.5 rounded-lg",
          status === 'approved' && "bg-green-500/10",
          status === 'rejected' && "bg-red-500/10",
          status === 'executing' && "bg-blue-500/10",
          status === 'pending' && "bg-blue-500/10"
        )}>
          {status === 'approved' ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : status === 'rejected' ? (
            <XCircle size={16} className="text-red-400" />
          ) : status === 'executing' ? (
            <Loader2 size={16} className="text-blue-400 animate-spin" />
          ) : (
            <FileText size={16} className="text-blue-400" />
          )}
        </div>
        <span className="text-sm font-semibold text-zinc-200">
          {status === 'approved' ? 'Plan Approved' : 
           status === 'rejected' ? 'Plan Rejected' :
           status === 'executing' ? 'Executing Plan...' :
           'Implementation Plan'}
        </span>
        
        {status === 'executing' && (
          <span className="ml-auto text-xs text-blue-400 animate-pulse">
            Generating code...
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="text-md font-bold text-white mb-2">{title}</h3>
        <div className={cn(
          "text-sm text-zinc-400 leading-relaxed",
          !isExpanded && "line-clamp-3"
        )}>
          {summary}
        </div>
        
        {/* Steps preview */}
        {steps.length > 0 && !isExpanded && (
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <span>{steps.length} steps</span>
            <span>•</span>
            <span className="truncate">{steps[0]}</span>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      {isActionable && (
        <div className="p-3 bg-black/20 border-t border-zinc-800 flex items-center justify-between gap-3">
          
          {/* OPEN BUTTON */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            {isExpanded ? "Collapse" : "Open"}
            <ExternalLink size={12} />
          </button>

          <div className="flex items-center gap-2">
            {/* REJECT */}
            <button 
              onClick={() => onReject(planId)}
              disabled={isExecuting}
              className="px-3 py-2 text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {/* APPROVE BUTTON */}
            <button 
              onClick={() => onApprove(planId)}
              disabled={isExecuting}
              className={cn(
                "flex items-center gap-2 px-6 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-lg",
                isExecuting 
                  ? "bg-blue-600/50 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
              )}
            >
              {isExecuting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <span>Approve</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FULL PLAN VIEW (If Open is clicked) */}
      {isExpanded && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 animate-in slide-in-from-top-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">
            Detailed Steps
          </p>
          
          {steps.length > 0 ? (
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 text-sm text-zinc-400"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-xs text-zinc-400">
              {summary}
            </div>
          )}
        </div>
      )}

      {/* Status indicator for completed states */}
      {(status === 'approved' || status === 'rejected') && (
        <div className={cn(
          "px-4 py-2 text-xs font-medium border-t",
          status === 'approved' && "bg-green-950/30 text-green-400 border-green-800/30",
          status === 'rejected' && "bg-red-950/30 text-red-400 border-red-800/30"
        )}>
          {status === 'approved' ? '✓ Plan approved and executed' : '✗ Plan was rejected'}
        </div>
      )}
    </div>
  );
}
