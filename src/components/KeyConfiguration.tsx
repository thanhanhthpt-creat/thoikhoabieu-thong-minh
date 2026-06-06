import React, { useState } from "react";
import { Key, Eye, EyeOff, ShieldCheck, Database, Download, Upload, Cpu, FileJson } from "lucide-react";

interface KeyConfigurationProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MODELS_LIST = [
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview (Default)", desc: "Mô hình nhanh và hiệu quả, phù hợp cho hầu hết tác vụ." },
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", desc: "Phân tích chuyên sâu và xử lý suy luận phức tạp." },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Mô hình tiết kiệm tài nguyên." }
];

export const KeyConfiguration: React.FC<KeyConfigurationProps> = ({
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  onExportBackup,
  onImportBackup
}) => {
  const [showKey, setShowKey] = useState(false);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const handleSaveKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem("gemini_api_key", val);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Cấu hình API & Hệ thống</h3>
          <p className="text-xs text-slate-500">Quản lý kết nối Gemini AI và sao lưu dữ liệu trường học của bạn</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* API Key Form */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Mã khóa Gemini API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              placeholder="Nhập GEMINI_API_KEY ở đây..."
              className="w-full pl-3 pr-24 py-2.5 bg-slate-50 hover:bg-slate-50/50 focus:bg-white text-slate-800 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-150 transition"
                title={showKey ? "Ẩn" : "Hiện"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {apiKey ? (
                <span className="flex items-center gap-0.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-medium border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Đã lưu
                </span>
              ) : (
                <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-medium border border-amber-500/20">
                  Chưa nhập
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            * Khóa được lưu hoàn toàn cục bộ trên trình duyệt (<span className="font-mono">localStorage</span>) để bảo mật. 
            Bạn cũng có thể cấu hình thông qua biến môi trường của môi trường phát triển AI Studio.
          </p>
          {isSavedAlert && (
            <div className="mt-2 text-[11px] text-emerald-600 font-medium">
              ✓ Đã ghi nhận mã khóa thành công trên bộ nhớ cục bộ.
            </div>
          )}
        </div>

        {/* Selected AI model */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Mô hình AI đàm thoại & tối ưu
          </label>
          <div className="space-y-2">
            {MODELS_LIST.map((m) => (
              <label
                key={m.id}
                className={`flex gap-3 p-3 border rounded-xl cursor-pointer hover:border-blue-300 transition duration-150 ${
                  selectedModel === m.id
                    ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="ai_model"
                  value={m.id}
                  checked={selectedModel === m.id}
                  onChange={() => setSelectedModel(m.id)}
                  className="mt-0.5 accent-blue-600 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="block text-xs font-semibold text-slate-800">{m.name}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Database backup restoration */}
        <div className="border-t border-slate-100 pt-4 mt-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Sao lưu & Khôi phục dữ liệu
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onExportBackup}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-750 font-medium text-xs rounded-xl hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition duration-150"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Xuất File Sao Lưu</span>
            </button>
            <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 hover:border-slate-350 cursor-pointer text-slate-755 font-medium text-xs rounded-xl transition duration-150">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Nạp File Sao Lưu</span>
              <input
                type="file"
                accept=".json"
                onChange={onImportBackup}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
            Định dạng tập tin hỗ trợ: .JSON
          </p>
        </div>
      </div>
    </div>
  );
};
