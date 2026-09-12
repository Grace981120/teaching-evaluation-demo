const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
  body: JSON.stringify(body),
});

export default async (request) => {
  if (request.method !== 'POST') return json(405, {error: 'Method not allowed'});

  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) return json(403, {error: 'Forbidden'});

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > 64 * 1024) return json(413, {error: '请求内容过长'});

  const apiKey = Netlify.env.get('QWEN_API_KEY')?.trim();
  if (!apiKey) return json(503, {error: 'AI 服务尚未配置'});

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, {error: '请求格式不正确'});
  }

  const question = String(payload?.question || '').trim();
  if (!question) return json(400, {error: '请输入问题'});
  if (question.length > 4000) return json(400, {error: '问题内容过长'});

  const references = Array.isArray(payload?.references) ? payload.references.slice(0, 10) : [];
  const context = JSON.stringify({
    course: String(payload?.course || '智慧医疗').slice(0, 100),
    skill: payload?.skill || null,
    references,
    asr: payload?.asr || {},
  });
  if (context.length > 48000) return json(400, {error: '引用内容过长'});

  try {
    const upstream = await fetch('https://narrows-gateway.test.seewo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen3.7-flash',
        messages: [
          {
            role: 'system',
            content: '你是课堂教学评价助手。只依据提供的课堂报告、引用模块和转写回答；先给出有证据的判断，再给出具体建议。不要编造数据、原话或视频位置；证据不足时明确说明。回答简洁、专业。',
          },
          {role: 'user', content: `课堂上下文：\n${context}\n\n用户问题：${question}`},
        ],
        temperature: 0.3,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!upstream.ok) return json(502, {error: 'AI 服务暂时不可用'});
    const result = await upstream.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) return json(502, {error: 'AI 服务暂时不可用'});
    return json(200, {content});
  } catch {
    return json(502, {error: 'AI 服务暂时不可用'});
  }
};
