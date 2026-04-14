import { getConversations } from '../lib/actions';
import ChatClient from './components/ChatClient';

// 强制动态渲染，避免构建时尝试连接数据库
export const dynamic = 'force-dynamic';

// Server Component：从数据库读对话列表
export default async function Home() {
  const conversations = await getConversations();
  return <ChatClient conversations={conversations} />;
}
