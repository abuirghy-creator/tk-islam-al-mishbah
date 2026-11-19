import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Users,
  User,
  Send,
  Image,
  Sparkles,
  CheckCheck,
  Search,
  PhoneCall,
  Video
} from 'lucide-react';

export const ParentTeacherChat: React.FC = () => {
  const { chatGroups, chatMessages, currentUser, users, sendChatMessage } = useApp();

  const [chatType, setChatType] = useState<'group' | 'private'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(chatGroups[0]?.id || 'group-tk-a1');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    currentUser.role === 'ortu' ? 'user-guru-1' : 'user-ortu-1'
  );
  const [inputText, setInputText] = useState('');

  // Active group or recipient
  const activeGroup = chatGroups.find((g) => g.id === selectedGroupId) || chatGroups[0];
  const activeRecipient = users.find((u) => u.id === selectedRecipientId) || users[0];

  // Filter messages
  const displayedMessages = chatType === 'group'
    ? chatMessages.filter((m) => m.groupId === selectedGroupId)
    : chatMessages.filter(
        (m) =>
          (m.senderId === currentUser.id && m.recipientId === selectedRecipientId) ||
          (m.senderId === selectedRecipientId && m.recipientId === currentUser.id)
      );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (chatType === 'group') {
      sendChatMessage(inputText, selectedGroupId);
    } else {
      sendChatMessage(inputText, undefined, selectedRecipientId);
    }

    setInputText('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-amber-300">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Komunikasi & Silaturahmi Terpadu
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Interaksi Orang Tua & Guru (Chat Grup & Pribadi)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Media koordinasi harian antara wali murid dan para pendidik melalui grup kelas resmi serta ruang pesan pribadi yang aman.
          </p>
        </div>

        {/* Switch between Group and Private */}
        <div className="bg-black/20 p-1.5 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setChatType('group')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              chatType === 'group'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Grup Kelas
          </button>
          <button
            onClick={() => setChatType('private')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              chatType === 'private'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> Pesan Pribadi (Japri)
          </button>
        </div>
      </div>

      {/* Chat Window layout */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Channel / Contacts List */}
        <div className="md:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {chatType === 'group' ? 'Daftar Grup Diskusi' : 'Kontak Pendidik & Wali'}
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatType === 'group'
              ? chatGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 ${
                      selectedGroupId === g.id
                        ? 'bg-emerald-100/70 border border-emerald-300 shadow-xs'
                        : 'hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 truncate">{g.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{g.description}</div>
                      <div className="text-[9px] text-emerald-700 font-semibold mt-1">
                        {g.memberCount} Anggota
                      </div>
                    </div>
                  </button>
                ))
              : users
                  .filter((u) => u.id !== currentUser.id)
                  .map((u, idx) => (
                    <button
                      key={`${u.id}-${idx}`}
                      onClick={() => setSelectedRecipientId(u.id)}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 ${
                        selectedRecipientId === u.id
                          ? 'bg-emerald-100/70 border border-emerald-300 shadow-xs'
                          : 'hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-emerald-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-800 truncate">{u.name}</div>
                        <div className="text-[10px] text-emerald-700 font-medium capitalize">
                          {u.position || u.role}
                        </div>
                      </div>
                    </button>
                  ))}
          </div>
        </div>

        {/* Right Chat Viewport */}
        <div className="md:col-span-8 flex flex-col h-[580px]">
          {/* Channel Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              {chatType === 'group' ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-xl">
                  {activeGroup.icon}
                </div>
              ) : (
                <img
                  src={activeRecipient.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-emerald-300"
                />
              )}
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {chatType === 'group' ? activeGroup.name : activeRecipient.name}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {chatType === 'group' ? activeGroup.description : `Role: ${activeRecipient.role.toUpperCase()} • Online`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                Resmi Sekolah
              </span>
            </div>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
                <p>Belum ada percakapan. Mulai kirimkan pesan untuk silaturahmi!</p>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[85%] ${
                      isMe ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    {!isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-1"
                      />
                    )}
                    <div>
                      {!isMe && (
                        <div className="text-[10px] font-bold text-slate-500 mb-0.5">
                          {msg.senderName} ({msg.senderRole})
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-emerald-700 text-white rounded-tr-none shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {msg.text}
                        <div
                          className={`text-[9px] text-right mt-1 font-mono ${
                            isMe ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tulis pesan untuk ${chatType === 'group' ? activeGroup.name : activeRecipient.name}...`}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 focus:bg-white"
            />
            <button
              type="submit"
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md transition-all shrink-0"
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
