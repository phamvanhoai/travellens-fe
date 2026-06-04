"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  profile_info: string;
};

const emptyForm: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
  profile_info: ""
};

function isProfileObject(value: any) {
  return Boolean(value && typeof value === "object" && ("user_id" in value || "email" in value || "name" in value || "avatar_url" in value));
}

function normalizeProfile(responseData: any, fallback: any = {}) {
  const candidates = [responseData?.data?.user, responseData?.data, responseData?.user, responseData];
  const profile = candidates.find(isProfileObject);

  return {
    ...fallback,
    ...(profile ?? {})
  };
}

function formatDateForInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}");
  } catch {
    return {};
  }
}

function getBackendErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;
  const bodyDetails = data?.details?.body;

  if (Array.isArray(bodyDetails) && bodyDetails.length > 0) {
    return bodyDetails.join("\n");
  }

  if (typeof bodyDetails === "string") {
    return bodyDetails;
  }

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details.join("\n");
  }

  if (typeof data?.details === "string") {
    return data.details;
  }

  return data?.message || err?.message || fallback;
}

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  try {
    const url = new URL(apiUrl);
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
}

function resolveAvatarUrl(url: string) {
  if (!url || url.startsWith("blob:") || url.startsWith("data:") || /^https?:\/\//i.test(url)) {
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${getApiOrigin()}${path}`;
}

function withCacheBust(url: string) {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
  const [baseUrl, hash = ""] = url.split("#");
  const [path, queryString = ""] = baseUrl.split("?");
  const params = new URLSearchParams(queryString);

  params.set("v", String(Date.now()));

  return `${path}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

export default function ProfilePage() {
  const { setUser } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarVersion, setAvatarVersion] = useState(0);

  const avatarPreview = useMemo(() => {
    if (!avatarFile) return avatarUrl ? withCacheBust(avatarUrl) : "";
    return URL.createObjectURL(avatarFile);
  }, [avatarFile, avatarUrl, avatarVersion]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await authService.getProfile();
        const currentUser = getStoredUser();
        const profile = normalizeProfile(response.data, currentUser);
        applyProfile(profile);
      } catch (err: any) {
        setError(getBackendErrorMessage(err, "Unable to load profile. Please sign in again."));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  const applyProfile = (profile: any) => {
    const resolvedAvatarUrl = resolveAvatarUrl(profile.avatar_url ?? "");
    const nextProfile = {
      ...profile,
      avatar_url: resolvedAvatarUrl ? withCacheBust(resolvedAvatarUrl) : ""
    };

    setForm({
      name: nextProfile.name ?? "",
      email: nextProfile.email ?? "",
      phone: nextProfile.phone ?? "",
      date_of_birth: formatDateForInput(nextProfile.date_of_birth),
      gender: nextProfile.gender ?? "",
      address: nextProfile.address ?? "",
      profile_info: nextProfile.profile_info ?? ""
    });
    setAvatarUrl(nextProfile.avatar_url ?? "");
    setAvatarVersion((version) => version + 1);
    setUser(nextProfile);
    localStorage.setItem("user", JSON.stringify(nextProfile));
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.updateProfile({
        name: form.name,
        phone: form.phone,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        address: form.address,
        profile_info: form.profile_info,
        avatar_file: avatarFile
      });
      setAvatarFile(null);
      const latestProfileResponse = await authService.getProfile();
      const latestProfile = normalizeProfile(latestProfileResponse.data, {
        ...getStoredUser(),
        ...form,
        avatar_url: avatarUrl
      });

      applyProfile(latestProfile);
      setSuccess(response.data?.message || "Profile updated successfully.");
    } catch (err: any) {
      setError(getBackendErrorMessage(err, "Unable to update profile. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Update your personal information and avatar.</p>
        </div>
        {loading ? (
          <span className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-slate-500">
            <Loader2 className="size-4 animate-spin" /> Loading
          </span>
        ) : null}
      </div>

      {error ? <div className="mt-5 whitespace-pre-line rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div> : null}
      {success ? <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</div> : null}

      <div className="mt-6 flex flex-col gap-5 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-brand-600 ring-1 ring-slate-200">
          {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : <UserRound size={38} />}
        </div>
        <div className="flex-1">
          <p className="font-bold">Avatar</p>
          <p className="mt-1 text-sm text-slate-500">Upload JPG, PNG or WEBP.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700">
              <Upload size={16} /> Upload Avatar
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={loading || saving}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setAvatarFile(file);
                }}
              />
            </label>
            {avatarFile ? (
              <button
                type="button"
                onClick={() => setAvatarFile(null)}
                disabled={loading || saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} /> Clear Selection
              </button>
            ) : (
              <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-500">
                <ImagePlus size={16} /> {avatarUrl ? "Current avatar" : "No image selected"}
              </span>
            )}
          </div>
        </div>
      </div>

      <fieldset disabled={loading || saving} className="mt-6 grid gap-4 disabled:opacity-70 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Full Name
          <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </label>
        <label className="text-sm font-semibold">
          Email
          <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-500 outline-none" type="email" value={form.email} readOnly />
        </label>
        <label className="text-sm font-semibold">
          Phone
          <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Date of Birth
          <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" type="date" value={form.date_of_birth} onChange={(event) => updateField("date_of_birth", event.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Gender
          <select className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Address
          <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Profile Info
          <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-brand-600" value={form.profile_info} onChange={(event) => updateField("profile_info", event.target.value)} />
        </label>
      </fieldset>

      <Button className="mt-6" type="submit" disabled={loading || saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Update Profile
      </Button>
    </form>
  );
}
