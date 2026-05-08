import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { MessageSquare, Send, Search, Circle } from 'lucide-react';

const conversations = [
  { id: 'ch1', buyer: 'Alice Chen', avatar: 'AC', lastMessage: 'Is the climate dataset updated for 2024?', time: '2m ago', unread: 2, online: true, datasetTitle: 'Global Climate Data 2024' },
  { id: 'ch2', buyer: 'Bob Martinez', avatar: 'BM', lastMessage: 'Can I get a sample before purchasing?', time: '1h ago', unread: 1, online: false, datasetTitle: 'AI Training Dataset' },
  { id: 'ch3', buyer: 'Carol Davis', avatar: 'CD', lastMessage: 'Thank you! The data was very helpful.', time: '3h ago', unread: 0, online: true, datasetTitle: 'Financial Markets Analysis' },
  { id: 'ch4', buyer: 'Dan Wilson', avatar: 'DW', lastMessage: 'What format is the genomics data in?', time: '1d ago', unread: 0, online: false, datasetTitle: 'Genomics Research Data' },
  { id: 'ch5', buyer: 'Eva Brown', avatar: 'EB', lastMessage: 'Is there a bulk discount available?', time: '2d ago', unread: 0, online: false, datasetTitle: 'Social Media Analytics 2024' },
];

const initialMessages = {
  ch1: [
    { id: 1, from: 'buyer', text: 'Hi! I am interested in your climate dataset.', time: '10:30 AM' },
    { id: 2, from: 'seller', text: 'Hello! Yes, it covers all of 2024 with monthly updates.', time: '10:32 AM' },
    { id: 3, from: 'buyer', text: 'Is the climate dataset updated for 2024?', time: '10:35 AM' },
  ],
  ch2: [
    { id: 1, from: 'buyer', text: 'Hello, I want to know more about the AI dataset.', time: '9:00 AM' },
    { id: 2, from: 'buyer', text: 'Can I get a sample before purchasing?', time: '9:05 AM' },
  ],
  ch3: [
    { id: 1, from: 'seller', text: 'Hi Carol! How can I help you today?', time: 'Yesterday' },
    { id: 2, from: 'buyer', text: 'Thank you! The data was very helpful.', time: 'Yesterday' },
  ],
};

export default function CustomerChatsPage() {
  const [activeChat, setActiveChat] = useState(conversations[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredConvos = conversations.filter(c =>
    c.buyer.toLowerCase().includes(search.toLowerCase()) ||
    c.datasetTitle.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const chatId = activeChat.id;
    const msg = { id: Date.now(), from: 'seller', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), msg] }));
    setNewMessage('');
  };

  const chatMessages = messages[activeChat?.id] || [];

  return (
    <DashboardLayout role="seller">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24, marginBottom: 0 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.02em' }}>Customer Chats</h2>
          <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 16, fontWeight: 500 }}>Communicate with buyers about your datasets</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid #e2e8f0', height: 700, background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          {/* Sidebar */}
          <div style={{ background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
                <input placeholder="Search chats..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px 10px 44px', color: '#1a202c', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConvos.map(c => (
                <div key={c.id} onClick={() => setActiveChat(c)}
                  style={{ padding: '20px 24px', cursor: 'pointer', background: activeChat?.id === c.id ? '#fff' : 'transparent', borderLeft: activeChat?.id === c.id ? `4px solid #FF8C00` : '4px solid transparent', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16, alignItems: 'center', transition: 'all 0.2s' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: '#20B2AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: '0 4px 6px -1px rgba(32,178,170,0.2)' }}>{c.avatar}</div>
                    {c.online && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#38a169', border: '3px solid #fff' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <p style={{ color: '#1a202c', fontWeight: 800, margin: 0, fontSize: 15 }}>{c.buyer}</p>
                      <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 600 }}>{c.time}</span>
                    </div>
                    <p style={{ color: '#718096', margin: 0, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage}</p>
                    <p style={{ color: '#20B2AA', margin: '4px 0 0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{c.datasetTitle}</p>
                  </div>
                  {c.unread > 0 && <div style={{ width: 22, height: 22, borderRadius: 8, background: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(255,140,0,0.2)' }}>{c.unread}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#20B2AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>{activeChat?.avatar}</div>
                {activeChat?.online && <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: '#38a169', border: '2px solid #fff' }} />}
              </div>
              <div>
                <p style={{ color: '#1a202c', fontWeight: 800, margin: 0, fontSize: 16 }}>{activeChat?.buyer}</p>
                <p style={{ color: activeChat?.online ? '#38a169' : '#a0aec0', margin: 0, fontSize: 13, fontWeight: 600 }}>{activeChat?.online ? 'Online' : 'Offline'} · {activeChat?.datasetTitle}</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'seller' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '70%', padding: '12px 18px', borderRadius: msg.from === 'seller' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: msg.from === 'seller' ? '#FF8C00' : '#fff', color: msg.from === 'seller' ? '#fff' : '#1a202c', fontSize: 15, fontWeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: msg.from === 'seller' ? 'none' : '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: msg.from === 'seller' ? 'rgba(255,255,255,0.7)' : '#a0aec0', textAlign: 'right', fontWeight: 600 }}>{msg.time}</p>
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                  <div style={{ padding: 24, borderRadius: '50%', background: '#fff', display: 'inline-block', marginBottom: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <MessageSquare size={48} color="#cbd5e0" />
                  </div>
                  <p style={{ color: '#a0aec0', margin: 0, fontSize: 16, fontWeight: 600 }}>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 16, background: '#fff' }}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..." style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 20px', color: '#1a202c', fontSize: 15, outline: 'none', transition: 'all 0.2s' }} />
              <button onClick={sendMessage} style={{ padding: '14px 28px', background: '#FF8C00', border: 'none', borderRadius: 16, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, boxShadow: '0 4px 10px rgba(255,140,0,0.2)', transition: 'all 0.2s' }}>
                <Send size={20} /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
