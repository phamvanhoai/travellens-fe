"use client";

import { FormEvent, MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Clock3,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { PageHero } from "@/components/common/page-hero";
import { images } from "@/lib/data";
import { aiService, type AIHistoryItem } from "@/services/ai.service";
import { useAIStore } from "@/store/use-ai-store";
import { useAuthStore } from "@/store/use-auth-store";

const fieldNamesMap: Record<string, string> = {
  cust_segment: "đối tượng chuyến đi",
  tour_type: "loại hình du lịch",
  pax: "số lượng người",
  budget_per_person_vnd: "ngân sách mỗi người"
};

const travelSuggestions = [
  {
    label: "Biển cho gia đình",
    prompt: "Tôi muốn đi du lịch biển cùng gia đình 4 người, ngân sách khoảng 5 triệu đồng mỗi người."
  },
  {
    label: "Khám phá cùng bạn bè",
    prompt: "Nhóm bạn 6 người muốn đi khám phá thiên nhiên và trải nghiệm ngoài trời, ngân sách khoảng 4 triệu đồng mỗi người."
  },
  {
    label: "Văn hóa cho cặp đôi",
    prompt: "Cặp đôi 2 người muốn khám phá văn hóa, ẩm thực và các địa điểm lãng mạn, ngân sách khoảng 7 triệu đồng mỗi người."
  },
  {
    label: "Tiết kiệm cho sinh viên",
    prompt: "Nhóm sinh viên 5 người muốn du lịch nghỉ dưỡng kết hợp tham quan, ngân sách tối đa 3 triệu đồng mỗi người."
  }
] as const;

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const { travelRequest, setTravelRequest, results, setResults, showResults, setShowResults } = useAIStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  async function loadHistory() {
    try {
      setHistory(await aiService.getHistory());
    } catch (historyError) {
      console.error("Failed to load history", historyError);
    }
  }

  useEffect(() => {
    if (user) void loadHistory();
  }, [user]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      setError("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    if (!travelRequest.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await aiService.searchByText(travelRequest);
      if (!response.success) {
        const missing = (response.missing_fields || []).map((field) => fieldNamesMap[field] || field).join(", ");
        setError(`Hãy mô tả chi tiết hơn${missing ? `. AI chưa nhận diện được: ${missing}` : ""}.`);
        return;
      }
      setResults(response.recommendations || []);
      setShowResults(true);
      void loadHistory();
    } catch (searchError: unknown) {
      const candidate = searchError as { response?: { data?: { message?: string } }; message?: string };
      setError(candidate.response?.data?.message || candidate.message || "Không thể lấy kết quả. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function selectHistory(item: AIHistoryItem) {
    setTravelRequest(item.travel_request);
    setResults(item.recommendations);
    setShowResults(true);
    setShowHistory(false);
  }

  async function deleteHistory(id: number, event: MouseEvent) {
    event.stopPropagation();
    try {
      await aiService.deleteHistory(id);
      setHistory((current) => current.filter((item) => item.id !== id));
    } catch (historyError) {
      console.error("Failed to delete history", historyError);
    }
  }

  const assistantForm = (
    <form onSubmit={handleSearch} className="rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur">
      <label className="flex items-start gap-3 rounded-xl px-3 py-2">
        <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Bot size={21} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Tell AI about your ideal trip</span>
          <textarea
            value={travelRequest}
            onChange={(event) => setTravelRequest(event.target.value)}
            rows={2}
            required
            placeholder="Ví dụ: Tôi muốn đi biển cùng gia đình 4 người, ngân sách khoảng 5 triệu mỗi người..."
            className="mt-1 w-full resize-none bg-transparent text-sm font-semibold leading-6 outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-base"
          />
        </span>
      </label>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3 pt-1" aria-label="Gợi ý yêu cầu chuyến đi">
        {travelSuggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => {
              setTravelRequest(suggestion.prompt);
              setError(null);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
          >
            <Sparkles size={12} />{suggestion.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="px-3 text-xs font-medium text-slate-400">Điểm đến phù hợp được gợi ý dựa trên sở thích của bạn.</span>
        {user ? (
          <button type="submit" disabled={loading || !travelRequest.trim()} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-60">
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? "AI đang phân tích..." : "Tạo gợi ý"}
          </button>
        ) : (
          <Link href="/login" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700">Đăng nhập để trải nghiệm <ArrowRight size={17} /></Link>
        )}
      </div>
    </form>
  );

  return (
    <>
      <PageHero title="AI Travel Assistant" subtitle="Mô tả chuyến đi trong mơ và để AI tìm những điểm đến phù hợp nhất cho bạn." image={images.balloons} searchClassName="w-full" searchContent={assistantForm} />

      <section className="bg-gradient-to-b from-slate-50 to-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600"><Sparkles size={14} />Personalized discovery</span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">{showResults ? "Điểm đến dành cho bạn" : "Bắt đầu hành trình của bạn"}</h2>
              <p className="mt-1 text-sm text-slate-500">{showResults ? `${results.length} gợi ý dựa trên yêu cầu của bạn.` : "Càng mô tả chi tiết, kết quả AI đưa ra càng phù hợp."}</p>
            </div>

            <div className="relative flex gap-2">
              {showResults ? <button type="button" onClick={() => { setTravelRequest(""); setShowResults(false); setError(null); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-600"><RefreshCw size={15} />Làm mới</button> : null}
              {user ? <button type="button" onClick={() => setShowHistory((visible) => !visible)} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold shadow-sm transition ${showHistory ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"}`}><History size={16} />Lịch sử <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{history.length}</span></button> : null}

              {showHistory ? (
                <div className="absolute right-0 top-12 z-30 flex max-h-96 w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h3 className="font-bold text-ink">Lịch sử gần đây</h3><p className="text-xs text-slate-400">Chọn để xem lại kết quả</p></div><button type="button" onClick={() => setShowHistory(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink"><X size={17} /></button></div>
                  <div className="overflow-y-auto">
                    {history.length ? history.map((item) => (
                      <button key={item.id} type="button" onClick={() => selectHistory(item)} className="group relative block w-full border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-brand-50/60">
                        <p className="line-clamp-2 pr-7 text-sm font-semibold leading-5 text-slate-700">“{item.travel_request}”</p>
                        <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={12} />{new Date(item.created_at).toLocaleDateString("vi-VN")} · {item.recommendations.length} kết quả</span>
                        <span role="button" tabIndex={0} onClick={(event) => void deleteHistory(item.id, event)} className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"><Trash2 size={15} /></span>
                      </button>
                    )) : <div className="p-8 text-center"><History className="mx-auto text-slate-300" size={28} /><p className="mt-2 text-sm text-slate-500">Chưa có lịch sử tìm kiếm.</p></div>}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {error ? <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div> : null}

          {!showResults ? (
            <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Search size={24} /></span><h3 className="mt-4 font-bold text-ink">Sẵn sàng khám phá?</h3><p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Nhập loại hình, số người và ngân sách để nhận gợi ý chính xác hơn.</p></div></div>
          ) : results.length === 0 ? (
            <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"><div><AlertCircle className="mx-auto text-slate-300" size={32} /><h3 className="mt-3 font-bold text-ink">Không tìm thấy kết quả phù hợp</h3><p className="mt-1 text-sm text-slate-500">Hãy thử thay đổi yêu cầu hoặc ngân sách của bạn.</p></div></div>
          ) : (
            <div className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((destination, index) => (
                <article key={destination.destination_id} className="group flex h-full min-h-[430px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <Image src={destination.thumbnail || "/placeholder-destination.jpg"} alt={destination.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/10" />
                    <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-xl bg-white/90 text-sm font-black text-brand-700 shadow-sm backdrop-blur">{index + 1}</span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm"><Sparkles size={12} />{Math.round(destination.score * 100)}% match</span>
                    <div className="absolute bottom-4 left-4 right-4"><h3 className="text-xl font-bold text-white">{destination.name}</h3><span className="mt-2 inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{destination.suggested_tour_type || "Khám phá"}</span></div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="line-clamp-3 text-sm leading-6 text-slate-500" dangerouslySetInnerHTML={{ __html: destination.description || "Điểm đến tuyệt vời để bạn trải nghiệm và khám phá." }} />
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Giá tham khảo</p><p className="mt-1 font-bold text-brand-700">{destination.starting_price ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(destination.starting_price) : "Đang cập nhật"}</p></div>
                      <Link href={destination.detail_link} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-50 px-4 text-sm font-bold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">Chi tiết <ArrowRight size={15} /></Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
