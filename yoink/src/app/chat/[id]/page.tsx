import ChatThread from '@/features/chat/ChatThread'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChatThread conversationId={id} />
}