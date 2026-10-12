import React, { useState, useEffect } from 'react';
import { adminStatsAPI } from '../../services/api';
import { Mail, Search, Eye } from 'lucide-react';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await adminStatsAPI.getMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((message) =>
    message.name.toLowerCase().includes(search.toLowerCase()) ||
    message.email.toLowerCase().includes(search.toLowerCase()) ||
    message.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    if (status === 'unread') return 'bg-yellow-500';
    if (status === 'read') return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusLabel = (status) => {
    if (status === 'unread') return 'Non lu';
    if (status === 'read') return 'Lu';
    return 'Répondu';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-poppins">Messages</h1>
        <p className="text-gray-400">Messages de contact</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher un message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-light text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-dark-light rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark">
            <tr>
              <th className="text-left text-white font-semibold p-4">Expéditeur</th>
              <th className="text-left text-white font-semibold p-4">Sujet</th>
              <th className="text-left text-white font-semibold p-4">Date</th>
              <th className="text-left text-white font-semibold p-4">Statut</th>
              <th className="text-right text-white font-semibold p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((message) => (
              <tr key={message.id} className="border-t border-dark-lighter">
                <td className="p-4">
                  <p className="text-white font-semibold">{message.name}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {message.email}
                  </p>
                </td>
                <td className="p-4">
                  <p className="text-white">{message.subject}</p>
                </td>
                <td className="p-4 text-gray-300">
                  {new Date(message.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`${getStatusColor(message.status)} text-white text-xs font-semibold px-3 py-1 rounded`}>
                    {getStatusLabel(message.status)}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedMessage(message)}
                    className="text-primary hover:text-primary-light p-2"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-light rounded-xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Message</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-white text-3xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-dark rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">De</p>
                    <p className="text-white font-semibold">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{selectedMessage.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Sujet</p>
                <p className="text-white font-semibold text-lg">{selectedMessage.subject}</p>
              </div>

              <div className="bg-dark rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Message</p>
                <p className="text-white leading-relaxed">{selectedMessage.message}</p>
              </div>

              <div className="text-gray-400 text-sm">
                Reçu le {new Date(selectedMessage.created_at).toLocaleString()}
              </div>

              <div className="flex gap-4">
                <a
                  href={`mailto:${selectedMessage.email}?subject=RE: ${selectedMessage.subject}`}
                  className="flex-1 bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition text-center"
                >
                  Répondre par email
                </a>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex-1 bg-dark text-white font-semibold py-3 rounded-lg hover:bg-dark-lighter transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
