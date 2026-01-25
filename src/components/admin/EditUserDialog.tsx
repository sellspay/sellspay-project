import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onUserUpdated: () => void;
}

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: EditUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    is_creator: false,
    is_editor: false,
    verified: false,
    suspended: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        username: user.username || "",
        bio: user.bio || "",
        is_creator: user.is_creator || false,
        is_editor: user.is_editor || false,
        verified: user.verified || false,
        suspended: user.suspended || false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          username: formData.username || null,
          bio: formData.bio || null,
          is_creator: formData.is_creator,
          is_editor: formData.is_editor,
          verified: formData.verified,
          suspended: formData.suspended,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("User updated successfully");
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user profile and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Avatar & Info */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {user.full_name?.[0] || user.username?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">@{user.username || "No username"}</p>
              <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="User bio..."
                rows={3}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Permissions & Status</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_creator">Creator Status</Label>
                <p className="text-sm text-muted-foreground">
                  Allow user to create and sell products
                </p>
              </div>
              <Switch
                id="is_creator"
                checked={formData.is_creator}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_creator: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_editor">Editor Status</Label>
                <p className="text-sm text-muted-foreground">
                  Allow user to offer editing services
                </p>
              </div>
              <Switch
                id="is_editor"
                checked={formData.is_editor}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_editor: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="verified">Verified Badge</Label>
                <p className="text-sm text-muted-foreground">
                  Display verification badge on profile
                </p>
              </div>
              <Switch
                id="verified"
                checked={formData.verified}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, verified: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="suspended" className="text-destructive">Suspended</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent user from accessing the platform
                </p>
              </div>
              <Switch
                id="suspended"
                checked={formData.suspended}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, suspended: checked }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
