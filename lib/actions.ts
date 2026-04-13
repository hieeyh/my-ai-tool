'use server';

import { db } from './db';
import { revalidatePath } from 'next/cache';

// 创建新对话
export async function createConversation() {
  const conversation = await db.conversation.create({
    data: { title: '新对话' },
  });
  revalidatePath('/');
  return conversation;
}

// 获取所有对话列表（按更新时间倒序）
export async function getConversations() {
  return db.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { take: 1, orderBy: { createdAt: 'asc' } }, // 取第一条消息做预览
    },
  });
}

// 获取某个对话的所有消息
export async function getMessages(conversationId: string) {
  return db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

// 保存一条消息
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  await db.message.create({
    data: { conversationId, role, content },
  });

  // 用第一条用户消息更新对话标题
  if (role === 'user') {
    const count = await db.message.count({ where: { conversationId } });
    if (count === 1) {
      await db.conversation.update({
        where: { id: conversationId },
        data: { title: content.slice(0, 20) }, // 截取前20字做标题
      });
    }
    // 更新对话的 updatedAt
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  revalidatePath('/');
}

// 删除对话
export async function deleteConversation(conversationId: string) {
  await db.conversation.delete({ where: { id: conversationId } });
  revalidatePath('/');
}
