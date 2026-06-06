import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dns from "dns";

// Support standard ESM directory locations in full standalone node executions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable DNS lookup caching or resolve localhost explicitly
dns.setDefaultResultOrder("ipv4first");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json({ limit: "50mb" }));

  // API endpoint for Gemini generation (serves as full-stack secure proxy)
  app.post("/api/gemini/generate", async (req: Request, res: Response) => {
    const { prompt, model, userKey } = req.body;

    // Determine absolute key to use (preference: header/body payload key, fallback: process.env)
    const effectiveKey = userKey || process.env.GEMINI_API_KEY;

    if (!effectiveKey) {
      res.status(401).json({
        error: "QUYEN_TRUY_CAP_BI_TU_CHOI",
        message: "Không tìm thấy API Key. Quý khách vui lòng cấu hình GEMINI_API_KEY trong cấu hình Secrets của AI Studio hoặc nhập mã khóa trên giao diện của ứng dụng."
      });
      return;
    }

    // Suggested model fallbacks in order which are supported by GenAI
    const targetModel = model || "gemini-3.5-flash";

    try {
      // Lazy initialization of SDK to prevent crash on startup if key is missing
      const ai = new GoogleGenAI({
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });

      res.json({
        text: response.text || ""
      });
    } catch (err: any) {
      console.error("Lỗi khi xử lý qua Gemini API:", err);
      res.status(500).json({
        error: "LOI_API_YEU_CAU",
        message: err.message || "Đã xảy ra sự cố kỹ thuật trong quá trình xử lý qua mô hình Gemini AI."
      });
    }
  });

  // Load Vite developer middleware or serve static production ready files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HỆ THỐNG] Máy chủ Express phát sóng trên cổng ${PORT} thành công.`);
  });
}

startServer();
