'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type MessageType = 'success' | 'error' | 'info' | 'warning';

interface MessageContextType {
  showMessage: (text: string, type?: MessageType) => void;
  hideMessage: () => void;
  message: string;
  messageType: MessageType;
  isVisible: boolean;
}

const MessageContext = createContext<MessageContextType>({
  showMessage: () => {},
  hideMessage: () => {},
  message: '',
  messageType: 'info',
  isVisible: false,
});

export const useMessage = () => useContext(MessageContext);

interface MessageProviderProps {
  children: ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('info');
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const hideMessage = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showMessage = useCallback((text: string, type: MessageType = 'info') => {
    // 기존 타이머가 있으면 제거
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 메시지 설정
    setMessage(text);
    setMessageType(type);
    setIsVisible(true);

    // 3초 후 메시지 숨기기
    const id = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    setTimeoutId(id);
  }, [timeoutId]);

  return (
    <MessageContext.Provider value={{ showMessage, hideMessage, message, messageType, isVisible }}>
      {children}
      
      {/* 토스트 메시지 UI */}
      {isVisible && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div 
            className={`px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium backdrop-blur-sm animate-fadeIn ${
              messageType === 'success' ? 'bg-green-500/90' : 
              messageType === 'error' ? 'bg-red-500/90' : 
              messageType === 'warning' ? 'bg-amber-500/90' : 
              'bg-blue-500/90'
            }`}
          >
            {message}
          </div>
        </div>
      )}
    </MessageContext.Provider>
  );
} 