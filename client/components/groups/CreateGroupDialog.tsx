import { useState } from "react";
import { useCreateGroup } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader } from "lucide-react";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  onGroupCreated?: (groupId: string) => void;
}

export default function CreateGroupDialog({
  onGroupCreated,
}: CreateGroupDialogProps) {
  const { userProfile } = useAuth();
  const { createGroup, loading, error } = useCreateGroup();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      toast.error("Please sign in first");
      return;
    }

    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (userProfile.role !== "partner" && userProfile.role !== "admin") {
      toast.error("Only partners can create groups");
      return;
    }

    try {
      const groupId = await createGroup(
        userProfile.uid,
        userProfile.displayName,
        userProfile.profileImage,
        name,
        description,
      );

      toast.success("Group created successfully");
      setName("");
      setDescription("");
      setOpen(false);

      if (onGroupCreated) {
        onGroupCreated(groupId);
      }
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error(error || "Failed to create group");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Create a group to collaborate and chat with other partners.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Group Name
            </label>
            <Input
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Description
            </label>
            <Textarea
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader size={16} className="mr-2 animate-spin" />}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
