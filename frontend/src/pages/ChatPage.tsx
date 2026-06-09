import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Loader, AlertCircle } from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: number;
  text: string;
  senderId: number;
  bookingId: number;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface BookingInfo {
  id: number;
  property: {
    id: number;
    title: string;
    coverImage?: string | null;
    images: string[];
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  userId: number;
}

const ChatPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await axiosInstance.get(`/messages/${bookingId}`);
      setMessages(res.data.messages || []);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [msgRes, bookRes] = await Promise.all([
          axiosInstance.get(`/messages/${bookingId}`),
          axiosInstance.get(`/bookings/${bookingId}`),
        ]);
        setMessages(msgRes.data.messages || []);
        setBooking(bookRes.data.booking || null);
      } catch (err: unknown) {
        setError((err as any).response?.data?.error || "Не удалось загрузить чат");
      } finally {
        setLoading(false);
      }
    };
    init();

    // Polling every 3 seconds
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const trimmed = text.trim();
    setText("");
    setSending(true);
    try {
      const res = await axiosInstance.post(`/messages/${bookingId}`, { text: trimmed });
      setMessages(prev => [...prev, res.data.message]);
    } catch (err: unknown) {
      alert((err as any).response?.data?.error || "Ошибка отправки");
      setText(trimmed); // restore
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md flex gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">Ошибка</h3>
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-blue-600 text-sm hover:underline">
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );

  const interlocutor = booking
    ? (booking.userId === user?.id
      ? { name: "Арендодатель", email: "" }
      : { name: booking.user?.name || booking.user?.email, email: booking.user?.email })
    : null;

  const coverImg = booking?.property?.coverImage || booking?.property?.images?.[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          {coverImg && (
            <img src={coverImg} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{booking?.property?.title || "Чат"}</p>
            {interlocutor && (
              <p className="text-sm text-gray-500 truncate">{interlocutor.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto container mx-auto px-4 py-6 max-w-2xl w-full">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Сообщений пока нет</p>
            <p className="text-sm mt-1">Начните переписку!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] group`}>
                    {!isMe && (
                      <p className="text-xs text-gray-500 mb-1 px-1">
                        {msg.sender?.name || msg.sender?.email}
                      </p>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex gap-3 items-end">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение... (Enter для отправки)"
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-32"
              style={{ overflowY: text.includes("\n") || text.length > 60 ? "auto" : "hidden" }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition flex-shrink-0"
            >
              {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
