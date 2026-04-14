import { deepseek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';
import { saveMessage } from '../../../lib/actions';

export const maxDuration = 30;

// ai@6 UIMessage parts 里提取文本
function extractText(msg: { parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  if (msg.parts) {
    return msg.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
  }
  return msg.content ?? '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }>; content?: string }> = body.messages ?? [];
    const conversationId = body.conversationId as string | undefined;

    // 保存最后一条用户消息
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (conversationId && lastUserMsg) {
      await saveMessage(conversationId, 'user', extractText(lastUserMsg));
    }

    const result = streamText({
      model: deepseek('deepseek-chat'),
      system: '你是一个专业、友善的 AI 助手，使用中文回答问题，回答简洁清晰。',
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: extractText(m),
      })),
      onFinish: async ({ text }) => {
        if (conversationId && text) {
          await saveMessage(conversationId, 'assistant', text);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat API Error]', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
