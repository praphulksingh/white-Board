import { sendMessageToBackground } from '@/shared/messaging';

export const App = () => {
  const handleToggleBoard = () => {
    sendMessageToBackground({ type: 'TOGGLE_BOARD' });
  };

  return (
    <div className="p-4 w-64 bg-white shadow-lg rounded-lg flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">GestureBoard</h1>
      <button
        onClick={handleToggleBoard}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Open / Close Board
      </button>
    </div>
  );
};
