import { deepseek } from '@ai-sdk/deepseek';
import { streamText, UIMessageStreamWriter } from 'ai';
import { saveMessage } from '../../../lib/actions';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ai@6 新格式：messages 在 body.messages，附加字段在 body 里
    const messages = body.messages ?? [];
    const conversationId = body.conversationId as string | undefined;

    // 找到最后一条用户消息保存
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    if (conversationId && lastUserMsg) {
      await saveMessage(conversationId, 'user', lastUserMsg.content);
    }

    const result = streamText({
      model: deepseek('deepseek-chat'),
      system: '你是一个专业、友善的 AI 助手，使用中文回答问题，回答简洁清晰。',
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
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
