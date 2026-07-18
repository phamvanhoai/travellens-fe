"use client";

import React, { useState, useEffect } from "react";
import { aiService, AIRecommendationResult, AIHistoryItem } from "@/services/ai.service";
import { useAuthStore } from "@/store/use-auth-store";
import { useAIStore } from "@/store/use-ai-store";
import Link from "next/link";
import Image from "next/image";

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const { travelRequest, setTravelRequest, results, setResults, showResults, setShowResults } = useAIStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch history when user logs in
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const data = await aiService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const fieldNamesMap: Record<string, string> = {
    cust_segment: "Đối tượng (Gia đình, Sinh viên...)",
    tour_type: "Loại hình (Biển, Văn hóa...)",
    pax: "Số lượng người",
    budget_per_person_vnd: "Ngân sách mỗi người",
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelRequest.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await aiService.searchByText(travelRequest);

      if (!res.success) {
        // Missing fields – ask user to describe more
        const missing = (res.missing_fields || [])
          .map((f) => fieldNamesMap[f] || f)
          .join(", ");
        setError(`Vui lòng mô tả chi tiết hơn. Hệ thống chưa nhận diện được: ${missing}.`);
        return;
      }

      setResults(res.recommendations || []);
      setShowResults(true);

      // Refresh history if logged in
      if (user) loadHistory();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Không thể lấy kết quả. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleSelectHistory = (item: AIHistoryItem) => {
    setTravelRequest(item.travel_request);
    setResults(item.recommendations);
    setShowResults(true);
    setShowHistory(false);
  };

  const handleDeleteHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiService.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Failed to delete history", err);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div className="text-center md:text-left flex-1">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
            AI Travel Assistant
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Mô tả chuyến đi lý tưởng của bạn, AI sẽ tìm những điểm đến hoàn hảo nhất!
          </p>
        </div>

        {user && (
          <div className="mt-6 md:mt-0 relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Lịch sử tìm kiếm ({history.length})
            </button>

            {showHistory && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-96 flex flex-col">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Lịch sử gần đây</h3>
                  <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  {history.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Chưa có lịch sử tìm kiếm nào.
                    </div>
                  ) : (
                    history.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistory(item)}
                        className="p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors relative group"
                      >
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 pr-6">
                          &ldquo;{item.travel_request}&rdquo;
                        </p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.recommendations.length} kết quả</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="absolute top-4 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg max-w-2xl mx-auto font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Search box */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-12 border border-gray-100 max-w-3xl mx-auto">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <textarea
              className="w-full p-5 pl-5 pr-14 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none resize-none mb-6 text-lg transition-all"
              rows={3}
              placeholder="Ví dụ: Tôi muốn đi biển cùng gia đình 4 người, ngân sách khoảng 5 triệu mỗi người."
              value={travelRequest}
              onChange={(e) => setTravelRequest(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !travelRequest.trim()}
            className="w-full bg-gray-900 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1 flex justify-center items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            )}
            {loading ? "Đang phân tích AI..." : "Khám Phá Điểm Đến"}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {showResults && (
        <div className="animate-fade-in-up">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Top {results.length} Điểm Đến Đề Xuất
              </h2>
              <p className="text-gray-500 mt-2">Dựa trên mong muốn của bạn</p>
            </div>

            <button
              onClick={() => {
                setTravelRequest("");
                setShowResults(false);
              }}
              className="text-blue-600 font-semibold hover:text-blue-800 transition-colors flex items-center bg-blue-50 px-4 py-2 rounded-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Làm mới
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy kết quả phù hợp</h3>
              <p className="text-gray-500 mb-6">Chúng tôi chưa tìm thấy điểm đến nào phù hợp hoàn toàn với tiêu chí hiện tại.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((dest, idx) => (
                <div
                  key={dest.destination_id}
                  className="bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full border border-gray-100 relative"
                >
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 font-black w-10 h-10 flex items-center justify-center rounded-2xl z-10 shadow-sm">
                    {idx + 1}
                  </div>

                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={dest.thumbnail || "/placeholder-destination.jpg"}
                      alt={dest.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm flex items-center gap-1 backdrop-blur-md">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {(dest.score * 100).toFixed(0)}%
                    </div>

                    <div className="absolute bottom-4 left-5 right-5">
                      <h3 className="font-bold text-2xl text-white mb-2 leading-tight drop-shadow-md">
                        {dest.name}
                      </h3>
                      <div className="flex gap-2">
                        <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {dest.suggested_tour_type || "Khám phá"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                      {dest.description || "Điểm đến tuyệt vời để bạn trải nghiệm và khám phá những điều thú vị."}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Chỉ từ</p>
                        {dest.starting_price ? (
                          <span className="text-xl font-bold text-orange-600">
                            {formatVND(dest.starting_price)}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-400">Đang cập nhật</span>
                        )}
                      </div>

                      <Link
                        href={dest.detail_link}
                        className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                      >
                        Chi Tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
