import { useEffect } from 'react';
import { ExtensionMessage } from '@/shared/messaging';
import { useBoardStore } from '@/shared/store/boardStore';
import { Board } from '@/features/board/Board';
import { Toolbar } from '@/features/toolbar/Toolbar';

export const Overlay = () => {
  const { isOpen, toggleOpen } = useBoardStore();

  useEffect(() => {
    const handleMessage = (message: ExtensionMessage) => {
      if (message.type === 'TOGGLE_BOARD') {
        toggleOpen();
      }
    };

    const listener = (msg: unknown) => handleMessage(msg as ExtensionMessage);
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [toggleOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] pointer-events-none">
      <Board />
      <Toolbar />
    </div>
  );
};
