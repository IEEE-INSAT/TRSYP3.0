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

type SortKey = 'teamName' | 'registeredAt' | 'status';

export default function AdminChallengers() {
  const challengers = useAdminStore((s) => s.challengers);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('registeredAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const list = challengers.filter((c) =>
      c.teamName.toLowerCase().includes(q) || c.leader.fullName.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      let va: string, vb: string;
      if (sortKey === 'teamName') { va = a.teamName; vb = b.teamName; }
      else if (sortKey === 'status') { va = a.status; vb = b.status; }
      else { va = a.registeredAt; vb = b.registeredAt; }
      const cmp = va.localeCompare(vb);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [challengers, search, sortKey, sortDir]);

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="adm-list-page">
      <div className="adm-list-header">
        <Link href="/admin" className="adm-back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </Link>
        <h1 className="adm-list-title">Challenger Teams <span className="adm-count-badge">{challengers.length}</span></h1>
      </div>

      <div className="adm-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder="Search by team name or leader..."
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
              <th onClick={() => toggleSort('teamName')} className="adm-th-sort">Team Name{arrow('teamName')}</th>
              <th>Team Leader</th>
              <th>Members</th>
              <th>University</th>
              <th onClick={() => toggleSort('registeredAt')} className="adm-th-sort">Registered{arrow('registeredAt')}</th>
              <th onClick={() => toggleSort('status')} className="adm-th-sort">Status{arrow('status')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const st = STATUS_COLORS[c.status] || STATUS_COLORS.waiting_for_payment;
              return (
                <tr key={c.id} className="adm-table-row" onClick={() => window.location.href = `/admin/challengers?id=${c.id}`}>
                  <td className="adm-td-num">{i + 1}</td>
                  <td className="adm-td-name">{c.teamName}</td>
                  <td>{c.leader.fullName}</td>
                  <td>{c.members.length} members</td>
                  <td>{c.leader.university}</td>
                  <td className="adm-td-date">{new Date(c.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td><span className="adm-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="adm-table-empty">No challengers found</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
