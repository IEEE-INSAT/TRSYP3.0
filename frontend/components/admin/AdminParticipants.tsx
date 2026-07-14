'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  waiting_for_payment: { bg: '#f59e0b18', color: '#f59e0b', label: 'Waiting for Payment' },
  waiting_for_verification: { bg: '#3b82f618', color: '#3b82f6', label: 'Waiting for Verification' },
  approved: { bg: '#00E87A18', color: '#00E87A', label: 'Approved' },
  rejected: { bg: '#ef444418', color: '#ef4444', label: 'Rejected' },
};

type SortKey = 'fullName' | 'registeredAt' | 'status' | 'university';

export default function AdminParticipants() {
  const participants = useAdminStore((s) => s.participants);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('registeredAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const list = participants.filter((p) =>
      p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [participants, search, sortKey, sortDir]);

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="adm-list-page">
      <div className="adm-list-header">
        <Link href="/admin" className="adm-back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </Link>
        <h1 className="adm-list-title">Participants <span className="adm-count-badge">{participants.length}</span></h1>
      </div>

      <div className="adm-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-search-input"
        />
      </div>

      <motion.div className="adm-table-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => toggleSort('fullName')} className="adm-th-sort">Full Name{arrow('fullName')}</th>
              <th>Email</th>
              <th onClick={() => toggleSort('university')} className="adm-th-sort">University{arrow('university')}</th>
              <th>IEEE</th>
              <th onClick={() => toggleSort('registeredAt')} className="adm-th-sort">Registered{arrow('registeredAt')}</th>
              <th onClick={() => toggleSort('status')} className="adm-th-sort">Status{arrow('status')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const st = STATUS_COLORS[p.status] || STATUS_COLORS.waiting_for_payment;
              return (
                <tr key={p.id} className="adm-table-row" onClick={() => window.location.href = `/admin/participants?id=${p.id}`}>
                  <td className="adm-td-num">{i + 1}</td>
                  <td className="adm-td-name">{p.fullName}</td>
                  <td className="adm-td-email">{p.email}</td>
                  <td>{p.university}</td>
                  <td>{p.ieeeMember ? <span className="adm-ieee-yes">Yes</span> : <span className="adm-ieee-no">No</span>}</td>
                  <td className="adm-td-date">{new Date(p.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td><span className="adm-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="adm-table-empty">No participants found</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
