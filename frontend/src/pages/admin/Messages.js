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
    (message.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (message.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (message.subject || '').toLowerCase().includes(search.toLowerCase())
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
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 font-poppins text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Messages</h1>
        <p className="text-sm text-gray-400 sm:text-base">Messages de contact</p>
      </div>

      <div className="mb-5">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Rechercher un message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-dark-light py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-dark-light py-12 text-center text-gray-400">Chargement des messages...</div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-xl bg-dark-light px-4 py-12 text-center text-gray-400">
          {search ? 'Aucun message ne correspond à cette recherche.' : 'Aucun message reçu.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
            {filteredMessages.map((message) => (
              <article key={message.id} className="min-w-0 rounded-xl border border-dark-lighter bg-dark-light p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-semibold text-white">{message.name}</h2>
                    <p className="mt-1 flex min-w-0 items-start gap-2 text-sm text-gray-400"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-all">{message.email}</span></p>
                  </div>
                  <span className={`${getStatusColor(message.status)} shrink-0 rounded px-2 py-1 text-xs font-semibold text-white`}>{getStatusLabel(message.status)}</span>
                </div>
                <p className="mt-3 break-words font-medium text-white">{message.subject}</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-dark-lighter pt-3">
                  <span className="text-xs text-gray-400">{message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Date inconnue'}</span>
                  <button type="button" onClick={() => setSelectedMessage(message)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-dark" aria-label={`Voir le message de ${message.name}`}>
                    <Eye className="h-4 w-4" /> Voir
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl bg-dark-light xl:block">
            <table className="w-full min-w-[760px]">
              <thead className="bg-dark">
                <tr>
                  <th className="p-4 text-left font-semibold text-white">Expéditeur</th>
                  <th className="p-4 text-left font-semibold text-white">Sujet</th>
                  <th className="p-4 text-left font-semibold text-white">Date</th>
                  <th className="p-4 text-left font-semibold text-white">Statut</th>
                  <th className="p-4 text-right font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="border-t border-dark-lighter">
                    <td className="p-4">
                      <p className="font-semibold text-white">{message.name}</p>
                      <p className="mt-1 flex items-center gap-2 break-all text-sm text-gray-400"><Mail className="h-3 w-3 shrink-0" />{message.email}</p>
                    </td>
                    <td className="p-4 text-white">{message.subject}</td>
                    <td className="p-4 text-gray-300">{message.created_at ? new Date(message.created_at).toLocaleDateString() : '-'}</td>
                    <td className="p-4"><span className={`${getStatusColor(message.status)} rounded px-3 py-1 text-xs font-semibold text-white`}>{getStatusLabel(message.status)}</span></td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => setSelectedMessage(message)} className="rounded-lg p-2 text-primary hover:bg-dark" aria-label={`Voir le message de ${message.name}`}><Eye className="h-5 w-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-3 sm:p-4" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedMessage(null); }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-dark-light p-4 shadow-2xl sm:p-6 md:p-8" role="dialog" aria-modal="true" aria-labelledby="admin-message-title">
            <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
              <h2 id="admin-message-title" className="text-xl font-bold text-white sm:text-2xl">Message</h2>
              <button type="button" onClick={() => setSelectedMessage(null)} className="rounded-lg px-3 py-1 text-2xl text-gray-400 hover:bg-dark hover:text-white" aria-label="Fermer">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-dark p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0"><p className="text-sm text-gray-400">De</p><p className="break-words font-semibold text-white">{selectedMessage.name}</p></div>
                  <div className="min-w-0"><p className="text-sm text-gray-400">Email</p><p className="break-all text-white">{selectedMessage.email}</p></div>
                </div>
              </div>
              <div className="rounded-lg bg-dark p-4"><p className="mb-2 text-sm text-gray-400">Sujet</p><p className="break-words text-lg font-semibold text-white">{selectedMessage.subject}</p></div>
              <div className="rounded-lg bg-dark p-4"><p className="mb-2 text-sm text-gray-400">Message</p><p className="whitespace-pre-wrap break-words leading-relaxed text-white">{selectedMessage.message}</p></div>
              <div className="text-sm text-gray-400">Reçu le {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : 'Date inconnue'}</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <a href={`mailto:${selectedMessage.email}?subject=RE: ${selectedMessage.subject}`} className="rounded-lg bg-primary px-5 py-3 text-center font-bold text-dark transition hover:bg-primary-light sm:flex-1">Répondre par email</a>
                <button type="button" onClick={() => setSelectedMessage(null)} className="rounded-lg bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-lighter sm:flex-1">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
