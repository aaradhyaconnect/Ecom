"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  label,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          onChange(data.url);
        } else {
          toast.error(data.error || "Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group">
          <div className="relative h-40 w-full overflow-hidden rounded-lg border border-ivory-dark/60 bg-ivory-dark/20">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-charcoal/80 text-ivory rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-charcoal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 text-xs text-charcoal-muted hover:text-gold-dark transition-colors"
          >
            Replace image
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative h-40 w-full border-2 border-dashed rounded-lg cursor-pointer
            flex flex-col items-center justify-center gap-2 transition-all
            ${
              dragActive
                ? "border-gold bg-gold/5"
                : "border-ivory-dark/60 hover:border-gold/40 hover:bg-ivory-dark/20"
            }
          `}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-charcoal-muted" />
              <div className="text-center">
                <p className="text-sm text-charcoal-muted">
                  Drop image here or{" "}
                  <span className="text-gold-dark font-medium">browse</span>
                </p>
                <p className="text-[11px] text-charcoal-muted mt-1">
                  JPEG, PNG, WebP, GIF — max 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  value,
  onChange,
  folder = "uploads",
  label,
  maxImages = 10,
  className = "",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          onChange([...value, data.url]);
        } else {
          toast.error(data.error || "Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, value]
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (value.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    const updated = [...value];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    onChange(updated);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-charcoal mb-1.5">
          {label}
          <span className="text-charcoal-muted ml-1 text-xs">
            ({value.length}/{maxImages})
          </span>
        </label>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {value.map((url, i) => (
            <div key={url} className="relative group aspect-square">
              <div className="relative h-full w-full overflow-hidden rounded-lg border border-ivory-dark/60">
                <Image
                  src={url}
                  alt={`Image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
              <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    className="p-1 bg-charcoal/80 text-ivory rounded-full text-[10px] hover:bg-charcoal"
                  >
                    ←
                  </button>
                )}
                {i < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    className="p-1 bg-charcoal/80 text-ivory rounded-full text-[10px] hover:bg-charcoal"
                  >
                    →
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 p-1 bg-charcoal/80 text-ivory rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-charcoal"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-charcoal/80 text-ivory px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative h-32 w-full border-2 border-dashed rounded-lg cursor-pointer
            flex flex-col items-center justify-center gap-1.5 transition-all
            ${
              dragActive
                ? "border-gold bg-gold/5"
                : "border-ivory-dark/60 hover:border-gold/40 hover:bg-ivory-dark/20"
            }
          `}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-gold animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-charcoal-muted" />
              <p className="text-xs text-charcoal-muted">
                Drop or <span className="text-gold-dark font-medium">browse</span>
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
