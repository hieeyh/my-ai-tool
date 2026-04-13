import { getConversations } from '../lib/actions';
import ChatClient from './components/ChatClient';

// Server Component：从数据库读对话列表
export default async function Home() {
  const conversations = await getConversations();
  return <ChatClient conversations={conversations} />;
}
