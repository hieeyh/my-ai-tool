'use server';

import { db } from './db';
import { revalidatePath } from 'next/cache';

// 创建新对话
export async function createConversation(userId: string) {
  const conversation = await db.conversation.create({
    data: { title: '新对话', userId },
  });
  revalidatePath('/');
  return conversation;
}

// 获取当前用户的对话列表
export async function getConversations(userId: string) {
  return db.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { take: 1, orderBy: { createdAt: 'asc' } },
    },
  });
}

// 获取某个对话的消息（验证归属）
export async function getMessages(conversationId: string, userId: string) {
  const conv = await db.conversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conv) throw new Error('对话不存在或无权访问');

  return db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

// 保存消息，返回最新标题
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<{ title: string }> {
  await db.message.create({
    data: { conversationId, role, content },
  });

  let title = '新对话';

  if (role === 'user') {
    const count = await db.message.count({ where: { conversationId } });
    if (count === 1) {
      title = content.slice(0, 20);
      await db.conversation.update({
        where: { id: conversationId },
        data: { title },
      });
    } else {
      const conv = await db.conversation.findUnique({
        where: { id: conversationId },
        select: { title: true },
      });
      title = conv?.title ?? '新对话';
    }
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  revalidatePath('/');
  return { title };
}

// 删除对话（验证归属）
export async function deleteConversation(conversationId: string, userId: string) {
  await db.conversation.deleteMany({
    where: { id: conversationId, userId },
  });
  revalidatePath('/');
}
