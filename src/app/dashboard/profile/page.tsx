import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {["Full Name", "Email", "Phone", "Country"].map((label) => <label key={label} className="text-sm font-semibold">{label}<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" defaultValue={label === "Full Name" ? "Sophie Martin" : ""} /></label>)}
      </div>
      <Button className="mt-6">Update Profile</Button>
    </div>
  );
}
