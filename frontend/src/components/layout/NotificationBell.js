import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../../services/api';

const NotificationBell = () => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await notificationAPI.getAll();
      setItems(response.data.items || []);
      setUnread(response.data.unread_count || 0);
    } catch (error) {
      console.error('Chargement des notifications impossible:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 20000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      await refresh();
    } catch (error) {
      console.error('Impossible de marquer la notification:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      await refresh();
    } catch (error) {
      console.error('Impossible de marquer les notifications:', error);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications, ${unread} non lue(s)`}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-white transition hover:bg-dark-lighter hover:text-primary">
        <Bell className="h-6 w-6" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-dark">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-[70] mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-dark-lighter bg-dark-light p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unread > 0 && <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary"><CheckCheck className="h-4 w-4" />Tout lire</button>}
          </div>
          {items.length === 0 ? <p className="py-5 text-center text-sm text-gray-400">Aucune notification</p> : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className={`rounded-lg p-3 ${item.is_read ? 'bg-dark' : 'border border-primary/40 bg-dark'}`}>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-300">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : ''}</span>
                    {!item.is_read && <button type="button" onClick={() => markRead(item.id)} className="text-xs text-primary">Marquer comme lue</button>}
                  </div>
                  {item.link && <Link to={item.link} onClick={() => { setOpen(false); if (!item.is_read) markRead(item.id); }} className="mt-2 inline-block text-xs text-primary underline">Ouvrir</Link>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
