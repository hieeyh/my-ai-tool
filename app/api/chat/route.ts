import { deepseek } from '@ai-sdk/deepseek';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { saveMessage } from '../../../lib/actions';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, conversationId }: { messages: UIMessage[]; conversationId?: string } = await req.json();

    // 保存用户最新一条消息到数据库
    const lastUserMessage = messages[messages.length - 1];
    if (conversationId && lastUserMessage?.role === 'user') {
      const text = lastUserMessage.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('');
      await saveMessage(conversationId, 'user', text);
    }

    const result = streamText({
      model: deepseek('deepseek-chat'),
      system: '你是一个专业、友善的 AI 助手，使用中文回答问题，回答简洁清晰。',
      messages: await convertToModelMessages(messages),
      // 流式完成后保存 AI 回复
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
