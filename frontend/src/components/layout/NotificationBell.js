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

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest('[data-notification-root]')) setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [open]);

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
    <div className="relative" data-notification-root>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications, ${unread} non lue(s)`}
        aria-expanded={open}
        aria-controls="koffi-notifications-panel"
        className="relative rounded-lg p-2 text-white transition hover:bg-dark-lighter hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-dark">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <section
          id="koffi-notifications-panel"
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-20 z-[100] mx-auto flex max-h-[min(70vh,36rem)] w-auto max-w-md flex-col overflow-hidden rounded-xl border border-dark-lighter bg-dark-light shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))]"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dark-lighter p-3 sm:p-4">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 rounded px-2 py-2 text-xs text-primary hover:bg-dark focus:outline-none focus:ring-2 focus:ring-primary">
                  <CheckCheck className="h-4 w-4" /> Tout lire
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer les notifications" className="rounded px-2 py-1 text-gray-400 hover:bg-dark hover:text-white">✕</button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {items.length === 0 ? (
              <p className="py-5 text-center text-sm text-gray-400">Aucune notification</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className={`min-w-0 rounded-lg p-3 ${item.is_read ? 'bg-dark' : 'border border-primary/40 bg-dark'}`}>
                    <p className="break-words text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-gray-300">{item.message}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : ''}</span>
                      {!item.is_read && <button type="button" onClick={() => markRead(item.id)} className="rounded px-2 py-1 text-xs text-primary hover:bg-dark focus:outline-none focus:ring-2 focus:ring-primary">Marquer comme lue</button>}
                    </div>
                    {item.link && <Link to={item.link} onClick={() => { setOpen(false); if (!item.is_read) markRead(item.id); }} className="mt-2 inline-flex rounded px-1 py-1 text-xs text-primary underline focus:outline-none focus:ring-2 focus:ring-primary">Ouvrir</Link>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
