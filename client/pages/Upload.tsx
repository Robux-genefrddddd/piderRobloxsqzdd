import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload as UploadIcon, X, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createAsset } from "@/lib/assetService";
import { toast } from "sonner";

interface FilePreview {
  id: string;
  name: string;
  size: number;
  type: string;
}

const ASSET_CATEGORIES = [
  "3D Models",
  "UI Design",
  "Scripts",
  "Animations",
  "Plugins",
  "Sounds",
  "Images",
  "Other",
];

export default function Upload() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    tags: "",
  });
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const newPreviews: FilePreview[] = newFiles.map((file) => ({
      id: Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setFiles((prev) => [...prev, ...newPreviews]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check authentication
      if (!user || !userProfile) {
        toast.error("You must be logged in to upload assets");
        navigate("/login");
        return;
      }

      // Validate form
      if (
        !formData.name ||
        !formData.description ||
        !formData.category ||
        files.length === 0
      ) {
        toast.error(
          "Please fill in all required fields and upload at least one file",
        );
        setIsSubmitting(false);
        return;
      }

      // Create asset with verification status
      const assetId = await createAsset(user.uid, userProfile.displayName, {
        name: formData.name,
        description: formData.description,
        category:
          (formData.category as
            | "3D Models"
            | "UI Design"
            | "Scripts"
            | "Animations"
            | "Plugins"
            | "Sounds"
            | "Images"
            | "Other") || "Other",
        price: parseFloat(formData.price) || 0,
        imageUrl:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop",
        authorId: user.uid,
        authorName: userProfile.displayName,
        rating: 0,
        status: "uploading" as const,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      });

      // Simulate verification delay (in real app, this would be backend check)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        "Asset uploaded! ✓ Now in verification process. You'll see it in your dashboard once approved.",
      );

      setUploadSuccess(true);

      // Reset form
      setTimeout(() => {
        setFormData({
          name: "",
          description: "",
          category: "",
          price: "",
          tags: "",
        });
        setFiles([]);
        setUploadSuccess(false);
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload asset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-fade-in">
                <CheckCircle size={48} className="text-green-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">
                Upload Successful! ✓
              </h1>
              <p className="text-lg text-muted-foreground">
                Your asset has been uploaded and is now in verification process.
              </p>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Our team will review it to ensure it meets our quality standards
                and is virus-free. Once approved, it will appear on the
                marketplace and in your dashboard.
              </p>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline">View Marketplace</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold">Upload Asset</h1>
            <p className="text-lg text-muted-foreground">
              Share your digital creation with the RbxAssets community
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Upload Files *</Label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-secondary/20"
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <UploadIcon size={32} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Drag and drop your files here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {files.length} file(s) selected
                  </p>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="ml-3 p-1 hover:bg-secondary rounded transition-colors"
                        >
                          <X size={18} className="text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Asset Details Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl font-semibold">Asset Details</h2>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter asset name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your asset and its features..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (Optional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00 (free if empty)"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="Separate tags with commas (e.g., modern, clean, ui)"
                  value={formData.tags}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="p-4 bg-secondary/50 border border-border rounded-lg space-y-3">
              <div className="flex gap-3">
                <input type="checkbox" id="terms" required className="mt-0.5" />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground"
                >
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  id="original"
                  required
                  className="mt-0.5"
                />
                <label
                  htmlFor="original"
                  className="text-sm text-muted-foreground"
                >
                  I confirm this is original content or I have the rights to
                  distribute it
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Uploading..." : "Upload Asset"}
              </Button>
              <Link
                to="/dashboard"
                className="px-6 py-2 rounded-md border border-border text-foreground font-semibold hover:bg-secondary transition-all inline-flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Info Section */}
          <div className="p-6 bg-secondary/30 border border-border rounded-lg space-y-4">
            <h3 className="font-semibold">Before You Upload</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Ensure your asset meets our quality standards</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Files must be virus-free and compatible</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Maximum file size: 100MB per file</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Preview your asset before publishing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
