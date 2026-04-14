import { getConversations } from '../lib/actions';
import { auth } from '../auth';
import { redirect } from 'next/navigation';
import ChatClient from './components/ChatClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const conversations = await getConversations(session.user.id);
  return (
    <ChatClient
      conversations={conversations}
      user={session.user}
    />
  );
}
