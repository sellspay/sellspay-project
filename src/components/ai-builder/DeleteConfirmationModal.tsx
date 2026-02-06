import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: DeleteConfirmationModalProps) {
  const [confirmationText, setConfirmationText] = useState("");

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText("");
    }
  }, [isOpen]);

  const isMatch = confirmationText === projectName;

  const handleConfirm = () => {
    if (isMatch) {
      onConfirm();
      setConfirmationText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Delete Project</DialogTitle>
        </DialogHeader>

        <div className="p-6 flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-500/5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Delete Project?</h2>

          <p className="text-sm text-zinc-400 mb-6 leading-relaxed max-w-sm">
            This action cannot be undone. This will permanently delete the{" "}
            <span className="text-white font-semibold">"{projectName}"</span>{" "}
            site and all its generated assets, code, and history.
          </p>

          {/* Verification Input */}
          <div className="w-full space-y-2 mb-6">
            <label className="text-xs text-zinc-500 block text-left">
              Type <span className="text-red-400 font-mono">"{projectName}"</span> to confirm
            </label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={projectName}
              className="w-full bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-red-500/20"
              autoFocus
              onPaste={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isMatch) {
                  handleConfirm();
                }
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isMatch}
              className={`flex-1 gap-2 transition-all ${
                isMatch
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"
                  : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-zinc-800"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
