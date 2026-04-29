const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";
const SYSTEM_PROMPT = "أنت مساعد ذكي ومحترف باللغة العربية. تقدم إجابات دقيقة ومنظمة.";

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // تقديم الواجهة من مجلد Assets
        if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
            return env.ASSETS.fetch(request);
        }

        // معالجة طلب الدردشة
        if (url.pathname === "/api/chat" && request.method === "POST") {
            return handleChatRequest(request, env, ctx);
        }

        return new Response("Not Found", { status: 404 });
    }
};

async function handleChatRequest(request, env, ctx) {
    try {
        const { messages = [] } = await request.json();

        // إضافة البرومبت الأساسي
        if (!messages.some((msg) => msg.role === "system")) {
            messages.unshift({ role: "system", content: SYSTEM_PROMPT });
        }

        // تشغيل الذكاء الاصطناعي
        const stream = await env.AI.run(MODEL_ID, {
            messages,
            max_tokens: 1024,
            stream: true
        });

        // (اختياري) حفظ آخر رسالة في الـ KV للتعلم الذاتي
        // ctx.waitUntil(env.KV_CHAT.put("last_chat", JSON.stringify(messages.slice(-2))));

        return new Response(stream, {
            headers: {
                "content-type": "text/event-stream; charset=utf-8",
                "cache-control": "no-cache",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" }
        });
    }
}
