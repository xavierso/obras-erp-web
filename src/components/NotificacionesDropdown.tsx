'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificacionesApi, NotificacionOut } from '@/lib/notificacionesApi';
function formatDistanceToNow(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export function NotificacionesDropdown() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionOut[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const data = await notificacionesApi.obtener();
      setNotificaciones(data);
    } catch (error) {
      console.error('Error fetching notificaciones', error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const handleMarcarLeida = async (id: number) => {
    await notificacionesApi.marcarLeida(id);
    setNotificaciones(prev => 
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotificaciones();
        }}
        className="relative p-2 text-text-muted hover:text-text-main transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-surface-2">
            <h3 className="font-semibold text-text-main text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-brand-blue font-medium bg-brand-blue/10 px-2 py-0.5 rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                No tienes notificaciones
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notificaciones.map(notif => (
                  <li 
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${notif.leida ? 'opacity-60' : 'bg-brand-blue/5'}`}
                    onClick={() => !notif.leida && handleMarcarLeida(notif.id)}
                  >
                    <p className="text-sm text-text-main leading-tight mb-1">
                      {notif.mensaje}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDistanceToNow(notif.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
