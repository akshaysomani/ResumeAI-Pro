"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { updateUserProfile } from "@/app/actions/profileActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  User,
  Mail,
  Globe,
  MapPin,
  Phone,
  Github,
  Linkedin,
  Twitter,
  Calendar,
  Layers,
  Camera,
  Trash2,
  RefreshCw,
  Crop,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");

  // New Module 4 Fields
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [twitter, setTwitter] = useState("");
  const [personalWebsite, setPersonalWebsite] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");

  // Cropping Modal States
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Sync state with profile hook
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setHeadline(profile.headline || "");
      setSummary(profile.summary || "");
      setPhoneNumber(profile.phoneNumber || "");
      setLocation(profile.location || "");
      setGithub(profile.github || "");
      setLinkedin(profile.linkedin || "");
      setPortfolio(profile.portfolio || "");
      setAvatarUrl(profile.avatarUrl || "");
      setEmail(profile.email || "");

      // Extend values
      setDob(profile.dob || "");
      setGender(profile.gender || "");
      setCountry(profile.country || "");
      setTwitter(profile.twitterUrl || "");
      setPersonalWebsite(profile.personalWebsite || "");
      setPreferredLanguage(profile.preferredLanguage || "en");
      setTimezone(profile.timezone || "UTC");
    }
  }, [profile]);

  // Handle Photo Select and trigger Crop Modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File Validation: size under 5MB for loading into client cropper
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      error("Image size exceeds the 5MB limit.");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      error("Unsupported format. Please upload a PNG or JPEG file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input so user can choose same file again if they cancel
    e.target.value = "";
  };

  // Render crop area reactively on drag
  useEffect(() => {
    if (!isCropOpen || !cropSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = cropSrc;
    image.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw square base crop zone (size 250x250)
      const size = 250;
      canvas.width = size;
      canvas.height = size;

      // Draw circular clipping path for avatar representation preview
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate placement based on zoom and drag offset
      const imgWidth = image.width;
      const imgHeight = image.height;
      const scale = Math.min(size / imgWidth, size / imgHeight) * zoom;

      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const x = (size - drawWidth) / 2 + cropOffset.x;
      const y = (size - drawHeight) / 2 + cropOffset.y;

      ctx.drawImage(image, x, y, drawWidth, drawHeight);
      ctx.restore();
    };
  }, [isCropOpen, cropSrc, zoom, cropOffset]);

  // Crop Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setCropOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  // Confirm Crop and Compress Image using Canvas API
  const handleConfirmCrop = async () => {
    if (!canvasRef.current || !user) return;
    setIsCropOpen(false);
    setUploading(true);

    try {
      const canvas = canvasRef.current;

      // JPEG format compression at 0.8 quality factor (reduces file sizes significantly under 500KB)
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            error("Failed to crop image.");
            return;
          }

          let finalAvatarUrl = "";
          try {
            const fileName = `${user.id}/${Date.now()}.jpg`;

            // Upload to avatars bucket
            const { data, error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(fileName, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: true });

            if (uploadError) {
              throw uploadError;
            }

            // Fetch public link from Supabase
            const {
              data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(fileName);

            finalAvatarUrl = publicUrl;
          } catch (storageErr) {
            console.warn("Supabase Storage upload failed, falling back to base64 encoding:", storageErr);
            // Convert blob to base64 Data URL
            const base64Data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            finalAvatarUrl = base64Data;
          }

          setAvatarUrl(finalAvatarUrl);

          // Update profiles database row using Server Action
          await updateUserProfile(user.id, {
            fullName,
            headline,
            summary,
            phoneNumber,
            location,
            linkedin: linkedin,
            github: github,
            portfolio: portfolio,
            avatarUrl: finalAvatarUrl,
            dob,
            gender,
            country,
            twitterUrl: twitter,
            personalWebsite,
            preferredLanguage,
            timezone,
          });

          await refreshProfile();
          success("Profile photo uploaded and cropped successfully.");
        },
        "image/jpeg",
        0.8
      );
    } catch (err: any) {
      error(err.message || "Failed to save profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !avatarUrl) return;
    setUploading(true);

    try {
      if (avatarUrl.startsWith("http")) {
        const urlParts = avatarUrl.split("/public/avatars/");
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          await supabase.storage.from("avatars").remove([filePath]).catch(() => {
            // Ignore storage deletion errors for safety
          });
        }
      }

      setAvatarUrl("");
      await updateUserProfile(user.id, {
        fullName,
        headline,
        summary,
        phoneNumber,
        location,
        linkedin: linkedin,
        github: github,
        portfolio: portfolio,
        avatarUrl: "",
        dob,
        gender,
        country,
        twitterUrl: twitter,
        personalWebsite,
        preferredLanguage,
        timezone,
      });

      await refreshProfile();
      success("Profile photo deleted.");
    } catch (err: any) {
      error(err.message || "Failed to delete photo.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await updateUserProfile(user.id, {
        fullName,
        headline,
        summary,
        phoneNumber,
        location,
        linkedin: linkedin,
        github: github,
        portfolio: portfolio,
        avatarUrl,
        dob,
        gender,
        country,
        twitterUrl: twitter,
        personalWebsite,
        preferredLanguage,
        timezone,
      });

      await refreshProfile();
      success("Profile details updated successfully.");
    } catch (err: any) {
      error(err.message || "Failed to update profile record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Professional Profile</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your personal details, biography summaries, coordinates, and social profile links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Header Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Camera className="h-4.5 w-4.5 text-indigo-600" /> Profile Picture
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a professional portrait image (PNG or JPG under 5MB). You can crop it inline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6 border-t pt-6">
            <div className="relative group shrink-0">
              <div className="h-20 w-20 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-center font-bold text-lg overflow-hidden text-zinc-600 dark:text-zinc-400">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{fullName ? fullName.charAt(0).toUpperCase() : "U"}</span>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                disabled={uploading}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={triggerFileInput} disabled={uploading}>
                  Upload & Crop
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-500"
                    onClick={handleDeletePhoto}
                    disabled={uploading}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">Accepted formats: PNG, JPG, JPEG. Max size: 5MB.</p>
            </div>
          </CardContent>
        </Card>

        {/* General Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <User className="h-4.5 w-4.5 text-indigo-600" />
              General Details
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your identity parameters, overview statement, and job-seeking profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Professional Headline</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Senior Cloud Solutions Architect"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-zinc-400" /> Email Address
                </label>
                <Input value={email} disabled placeholder="user@domain.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-zinc-400" /> Phone Number
                </label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-zinc-400" /> Date of Birth
                </label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Gender (optional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Biography & Summary</label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of your background, experience achievements, and career goals..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Coordinates Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-indigo-600" />
              Location Coordinates
            </CardTitle>
            <CardDescription className="text-xs">
              Provide geographic boundaries to help matching recruiters filter your location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">City / State</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Country</label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolios & Networks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Globe className="h-4.5 w-4.5 text-indigo-600" />
              Social Portfolio Links
            </CardTitle>
            <CardDescription className="text-xs">
              Provide public channels showing your accomplishments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-zinc-400" /> LinkedIn Profile URL
                </label>
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5 text-zinc-400" /> GitHub URL
                </label>
                <Input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="github.com/username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Twitter className="h-3.5 w-3.5 text-zinc-400" /> Twitter / X URL
                </label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="twitter.com/handle"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" /> Personal Website
                </label>
                <Input
                  value={personalWebsite}
                  onChange={(e) => setPersonalWebsite(e.target.value)}
                  placeholder="www.myblog.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5 text-indigo-600" />
              Language & Localizations
            </CardTitle>
            <CardDescription className="text-xs">
              Default preferences mapping date, language and timezone attributes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Preferred Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="UTC">UTC / Coordinated Universal Time</option>
                  <option value="EST">EST / Eastern Standard Time</option>
                  <option value="PST">PST / Pacific Standard Time</option>
                  <option value="GMT">GMT / Greenwich Mean Time</option>
                  <option value="IST">IST / Indian Standard Time</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} disabled={uploading}>
            Save Profile Changes
          </Button>
        </div>
      </form>

      {/* Image Cropping Dialog Modal */}
      <Dialog isOpen={isCropOpen} onClose={() => setIsCropOpen(false)}>
        <DialogHeader>
          <DialogTitle>Crop & Preview Profile Picture</DialogTitle>
          <DialogDescription>
            Drag the image to adjust framing. Zoom slider controls scale.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {/* Crop Container Area */}
          <div
            className="relative border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 rounded-xl overflow-hidden cursor-move select-none"
            style={{ width: "250px", height: "250px" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} width="250" height="250" className="block" />
            <div className="absolute inset-0 border border-indigo-600 rounded-full pointer-events-none opacity-40" />
          </div>

          {/* Zoom Slider Control */}
          <div className="w-full max-w-xs space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
              <span>Zoom Scale</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-zinc-800"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCropOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmCrop} disabled={uploading} className="bg-indigo-600 hover:bg-indigo-500">
            <Check className="mr-1.5 h-4 w-4" /> Crop & Save
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
