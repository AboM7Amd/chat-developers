const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";
const SYSTEM_PROMPT = "أنت مساعد ذكي ومحترف. تقدم إجابات منظمة باللغة العربية مع ذاكرة قوية للمحادثات.";

export default {
    async fetch(request: any, env: any, ctx: any) {
        const url = new URL(request.url);

        // 1. عرض الواجهة
        if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
            return env.ASSETS.fetch(request);
        }

        // 2. معالجة الدردشة
        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                const { messages = [] } = await request.json();

                if (!messages.some((m: any) => m.role === "system")) {
                    messages.unshift({ role: "system", content: SYSTEM_PROMPT });
                }

                // طلب الذكاء الاصطناعي
                const stream = await env.AI.run(MODEL_ID, {
                    messages,
                    max_tokens: 1024,
                    stream: true
                });

                // [التعلم الذاتي]: حفظ المحادثة في الـ KV في الخلفية
                ctx.waitUntil(
                    env.KV_CHAT.put("last_session", JSON.stringify(messages.slice(-5)), { expirationTtl: 86400 })
                );

                return new Response(stream, {
                    headers: { "content-type": "text/event-stream; charset=utf-8" }
                });

            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    }
};