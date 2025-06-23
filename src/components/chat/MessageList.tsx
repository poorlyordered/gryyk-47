import React, { useRef, useEffect } from 'react';
import { Message } from '../../models/strategicContextModels';
import { useMessages } from '../../hooks/useMessages';

interface MessageListProps {
  sessionId: string;
  corpId?: string;
  threadId?: string;
}

const MessageList: React.FC<MessageListProps> = ({ sessionId, corpId, threadId }) => {
  const {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
  } = useMessages({ sessionId, corpId, threadId });

  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [newMessage, setNewMessage] = React.useState('');

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage('');
    messageInputRef.current?.focus();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMoreMessages();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center my-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-8">
                No messages yet. Start a conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.messageId} message={message} />
                ))}
              </div>
            )}
          </>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <textarea
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-lg disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-3/4 rounded-lg p-3 ${
          isUser
            ? 'bg-blue-500 text-white'
            : isAI
            ? 'bg-gray-200 text-gray-800'
            : 'bg-yellow-100 text-gray-800'
        }`}
      >
        <div className="text-sm font-semibold mb-1">
          {isUser ? 'You' : isAI ? 'Gryyk-47' : 'System'}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs mt-1 opacity-75 text-right">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageList; 