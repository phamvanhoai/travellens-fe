import { Button } from "@/components/ui/button";

export function AdminCrudPage({ title, noun, fields }: { title: string; noun: string; fields: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">List, create, update and delete {noun} records.</p>
        </div>
        <Button>Create</Button>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr>{["ID", ...fields, "Status", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-t border-slate-100">
                <td className="p-3 font-bold">#{1000 + row}</td>
                {fields.map((field) => <td key={field} className="p-3">{field} {row}</td>)}
                <td className="p-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span></td>
                <td className="p-3"><Button variant="outline" className="h-9 px-3">Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
