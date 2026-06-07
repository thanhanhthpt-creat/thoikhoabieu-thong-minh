import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Brain, Bot, HelpCircle, AlertCircle, RefreshCcw, Cpu } from "lucide-react";
import { ClassInfo, Teacher, Subject, ScheduleSlot } from "../types";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
}

interface AiAdvisorProps {
  apiKey: string;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  classes: ClassInfo[];
  teachers: Teacher[];
  subjects: Subject[];
  timetable: { [classId: string]: ScheduleSlot[] };
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({
  apiKey,
  selectedModel,
  setSelectedModel,
  classes,
  teachers,
  subjects,
  timetable
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là Trợ lý Trí tuệ Nhân tạo hỗ trợ xếp thời khóa biểu trường tiểu học. Tôi có thể giúp gì cho bạn hôm nay?\n\nBạn có thể thử các câu hỏi nhanh bên dưới:"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeModelUsed, setActiveModelUsed] = useState(selectedModel);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const promptSuggestions = [
    { title: "🔍 Kiểm định Thời Khóa Biểu", prompt: "Hãy phân tích nhanh sức khỏe thời khóa biểu hiện tại. Kiểm duyệt xem có bị trùng tiết của giáo viên nào không hoặc lớp nào thiếu định mức tiết dạy." },
    { title: "⚖️ Tối ưu hóa tải trọng Giáo viên", prompt: "Dựa trên danh sách 20 giáo viên, hãy gợi ý cấu hình định mức tiết dạy tiêu chuẩn cho họ và đề xuất cách cân bằng tránh quá tải." },
    { title: "📊 Đề xuất Spacing Môn học", prompt: "Làm thế nào để tự động sắp xếp các môn học chính như Toán và Tiếng Việt rải đều các thứ trong tuần thay vì bị gộp chung 1 ngày?" }
  ];

  // Helper: clean simple markdown parser to render basic list tags and bold text inside JSX
  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h5 key={idx} className="text-xs font-bold text-slate-800 mt-3 mb-1 font-mono uppercase tracking-wider">{line.slice(4)}</h5>;
      }
      if (line.startsWith("## ")) {
        return <h4 key={idx} className="text-sm font-semibold text-slate-900 mt-4 mb-1.5 border-b border-slate-100 pb-1">{line.slice(3)}</h4>;
      }
      if (line.startsWith("# ")) {
        return <h3 key={idx} className="text-base font-bold text-slate-900 mt-5 mb-2">{line.slice(2)}</h3>;
      }
      
      // Bullets
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={idx} className="flex gap-2 ml-2 my-1 align-top text-xs text-slate-700">
            <span className="text-blue-500 font-bold">•</span>
            <span>{parseInlineStyles(line.slice(2))}</span>
          </div>
        );
      }

      // Standard paragraphs
      return (
        <p key={idx} className="my-1.5 text-xs text-slate-700 leading-relaxed break-words">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (line: string) => {
    // Regex for bold text (**bold**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Pre-compile statistical context to guide Gemini
  const compileSystemContext = () => {
    const classCount = classes.length;
    const teacherCount = teachers.length;
    const subjectNames = subjects.map(s => s.name).join(", ");
    
    // Quick quota audit report
    const quotaAnalysis = classes.map(c => {
      const slots = timetable[c.id] || [];
      const scheduledCount = slots.filter(s => {
        const isLockedHDTN = s.subjectId === "HDTN" && ((s.day === 2 && s.period === 1) || (s.day === 6 && s.period === 4));
        return s.subjectId && !isLockedHDTN;
      }).length;
      return `${c.name}: ${scheduledCount}/30 tiết`;
    }).join(", ");

    // Teacher load report
    const loadAnalysis = teachers.map(t => {
      let count = 0;
      for (const classId in timetable) {
        timetable[classId].forEach(slot => {
          const isLockedHDTN = slot.subjectId === "HDTN" && ((slot.day === 2 && slot.period === 1) || (slot.day === 6 && slot.period === 4));
          if (slot.teacherId === t.id && slot.subjectId && !isLockedHDTN) {
            count++;
          }
        });
      }
      return `${t.shortName}: ${count}/${t.maxPeriodsPerWeek} tiết`;
    }).join(", ");

    return `
Bối cảnh hệ thống:
- Trường tiểu học có ${classCount} lớp, từ 1A1 đến 5A3.
- Số lượng giáo viên: ${teacherCount} giáo viên. Các giáo viên bộ môn đặc thù bao gồm Helen Nguyễn và Trần Nam (Tiếng Anh), Nguyễn Văn Hùng (Thể dục), Vũ Khánh Linh (Âm nhạc), Phan Thanh Tùng (Mỹ thuật), Tạ Quang Huy (Tin học & Công nghệ).
- Tổng 17 môn học: ${subjectNames}.
- Khung chương trình: 7 tiết/ngày (4 tiết sáng, 3 tiết chiều). Nghỉ chiều thứ Sáu cố định.
- Thống kê phân bổ tiết hiện tại cho các lớp: ${quotaAnalysis}.
- Tải giảng dạy thực tế hiện tại của các giáo viên: ${loadAnalysis}.

Hãy hỗ trợ trả lời câu hỏi của người dùng và tư vấn hữu ích dựa trên bối cảnh thực tế này. Luôn trả lời ngắn gọn, thiết thực và có cấu trúc rõ ràng.
`;
  };

  // Main chat submit handler with Fallback strategy
  const handleSubmit = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    const userMsg = textToSend;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    const fullPrompt = `${compileSystemContext()}\n\nYêu cầu của người dùng: ${userMsg}`;
    
    // Define fallback sequence path
    const allModels = ["gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-2.5-flash"];
    const fallbackModels = [selectedModel, ...allModels.filter(m => m !== selectedModel)];
    let success = false;
    let finalResponse = "";
    let modelUsed = selectedModel;

    // Run fallback loop
    for (let i = 0; i < fallbackModels.length; i++) {
      const modelToTry = fallbackModels[i];
      modelUsed = modelToTry;
      setActiveModelUsed(modelToTry);

      try {
        const response = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: fullPrompt,
            model: modelToTry,
            userKey: apiKey || "" // Prefer user key or let backend fall back
          })
        });

        if (response.status === 429) {
          console.warn(`Model ${modelToTry} bị giới hạn tần suất (429). Thực hiện fallback...`);
          if (i === fallbackModels.length - 1) {
             throw new Error(`429 RESOURCE_EXHAUSTED`);
          }
          continue; // Try next model in index loop
        }

        if (!response.ok) {
          let errorText = `Lỗi phản hồi HTTP: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData.error?.message) {
              errorText = errData.error.message;
            } else if (errData.message) {
              errorText = errData.message;
            }
          } catch (e) {
            // keep default error text if json parsing fails
          }
          throw new Error(errorText);
        }

        const data = await response.json();
        finalResponse = data.text;
        success = true;
        break; // Break the fallback loop
      } catch (error: any) {
        console.error(`Sự cố khi thử model ${modelToTry}:`, error.message);
        if (i === fallbackModels.length - 1) {
          // If this was the last model in list, throw absolute error
          finalResponse = `LỖI API: ${error.message}`;
        }
      }
    }

    if (success) {
      setMessages(prev => [...prev, { role: "assistant", content: finalResponse }]);
    } else {
      setMessages(prev => [...prev, { role: "error", content: finalResponse }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[580px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Trợ lý Phân tích AI</h3>
            <p className="text-[10px] text-white/70">Xếp TKB tối ưu & hóa giải xung đột</p>
          </div>
        </div>

        {/* Model selector info badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-mono">
          <Cpu className="w-3 h-3 text-blue-200" />
          <span className="truncate max-w-[80px]">{activeModelUsed}</span>
        </div>
      </div>

      {/* Suggestion Prompt list */}
      <div className="p-3 bg-slate-50/70 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {promptSuggestions.map((s, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSubmit(s.prompt)}
            className="p-2 bg-white hover:bg-blue-50/15 border border-slate-200 hover:border-blue-400 text-[10px] text-start rounded-xl font-medium text-slate-705 leading-tight transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <Brain className="w-3 h-3 text-blue-500" />
              <span>{s.title}</span>
            </div>
            <p className="line-clamp-1 mt-0.5 text-[9px] text-slate-400 font-normal">{s.prompt}</p>
          </button>
        ))}
      </div>

      {/* Messages layout scrolling screen */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10">
        {messages.map((m, idx) => {
          const isAi = m.role === "assistant";
          const isErr = m.role === "error";

          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : isErr ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                  isAi ? "bg-blue-100 text-blue-600" : isErr ? "bg-red-100 text-red-600" : "bg-indigo-600 text-white"
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : isErr ? <AlertCircle className="w-4 h-4" /> : "U"}
              </div>

              <div
                className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                  isAi
                    ? "bg-white border-slate-200 text-slate-800 shadow-sm"
                    : isErr
                    ? "bg-red-50 border-red-150 text-red-700"
                    : "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-500/10"
                }`}
              >
                {formatMarkdown(m.content)}
              </div>
            </div>
          );
        })}

        {/* Loading placeholder skeleton */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-slate-400" />
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex-1 space-y-2">
              <div className="h-2.5 bg-slate-250 rounded-md w-full" />
              <div className="h-2.5 bg-slate-200 rounded-md w-5/6" />
              <div className="h-2.5 bg-slate-200 rounded-md w-2/3" />
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-white border-t border-slate-150/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            required
            disabled={isLoading}
            placeholder="Đặt câu hỏi tư vấn tự động xếp lịch với AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 focus:bg-white text-slate-800 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition duration-150 shadow-md shadow-blue-500/15 flex-shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
