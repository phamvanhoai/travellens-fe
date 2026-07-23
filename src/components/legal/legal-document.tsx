import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalDocument({ eyebrow, title, summary, updated, sections }: {
  eyebrow: string;
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <div className="mt-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            <span className="grid size-9 place-items-center rounded-full bg-brand-50"><ShieldCheck size={18} /></span>{eyebrow}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{summary}</p>
          <p className="mt-5 text-sm font-medium text-slate-400">Cập nhật lần cuối: {updated}</p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
            Tài liệu này áp dụng cho website, ứng dụng và các dịch vụ trực tuyến mang thương hiệu <strong>TravelLens</strong>.
          </p>
          <div className="mt-9 space-y-9">
            {sections.map((section, index) => (
              <section key={section.title} className="scroll-mt-24">
                <h2 className="text-xl font-bold text-slate-900">{index + 1}. {section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items?.length ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-100 pt-6 text-sm font-semibold">
            <Link href="/privacy-policy" className="text-brand-700 hover:underline">Chính sách bảo mật</Link>
            <span className="text-slate-300">•</span>
            <Link href="/terms-of-use" className="text-brand-700 hover:underline">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
