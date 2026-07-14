'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { useToast } from './AdminToast';

const MotionLink = motion.create(Link);

function useCountUp(end: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(p * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration]);
  return val;
}

function StatCard({ icon, value, subtitle, color, delay }: { icon: string; value: number; subtitle: string; color: string; delay: number }) {
  const count = useCountUp(value);
  return (
    <motion.div className="adm-stat-card" style={{ borderTop: `3px solid ${color}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <span className="adm-stat-icon" style={{ background: `${color}15`, color }}>{icon}</span>
      <div className="adm-stat-value">{count}</div>
      <div className="adm-stat-label">{subtitle}</div>
    </motion.div>
  );
}

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const participants = useAdminStore((s) => s.participants);
  const challengers = useAdminStore((s) => s.challengers);
  const loaded = useAdminStore((s) => s.loaded);
  const { toast } = useToast();

  if (!loaded) return null;
  const totalIndividuals = participants.length + challengers.reduce((s, c) => s + 1 + c.members.length, 0);
  const all = [
    ...participants.map((p) => ({ status: p.status })),
    ...challengers.map((c) => ({ status: c.status })),
  ];
  const statusCounts = {
    waiting_for_payment: all.filter((r) => r.status === 'waiting_for_payment').length,
    waiting_for_verification: all.filter((r) => r.status === 'waiting_for_verification').length,
    approved: all.filter((r) => r.status === 'approved').length,
    rejected: all.filter((r) => r.status === 'rejected').length,
  };
  const total = all.length || 1;

  const statusMeta = [
    { key: 'waiting_for_payment' as const, label: 'Waiting for Payment', color: '#f59e0b' },
    { key: 'waiting_for_verification' as const, label: 'Waiting for Verification', color: '#3b82f6' },
    { key: 'approved' as const, label: 'Approved', color: '#00E87A' },
    { key: 'rejected' as const, label: 'Rejected', color: '#ef4444' },
  ];

  const recentActivity = [
    ...participants.map((p) => ({ name: p.fullName, type: 'Participant' as const, date: p.registeredAt, team: null as string | null })),
    ...challengers.map((c) => ({ name: c.leader.fullName, type: 'Challenger' as const, date: c.registeredAt, team: c.teamName })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const pRows = participants.map((p) => ({
      'Full Name': p.fullName,
      'Email': p.email,
      'WhatsApp': p.whatsapp,
      'University/SB': p.university,
      'IEEE Member': p.ieeeMember ? 'Yes' : 'No',
      'IEEE ID': p.ieeeId || 'N/A',
      'RAS Member': p.rasMember ? 'Yes' : 'No',
      'Status': p.status.replace(/_/g, ' '),
      'Registration Date': new Date(p.registeredAt).toLocaleString(),
      'Payment Proof': p.paymentProof ? 'Yes' : 'No',
    }));
    const ws1 = XLSX.utils.json_to_sheet(pRows);
    ws1['!cols'] = Object.keys(pRows[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws1, 'Participants');

    const cRows = challengers.map((c) => {
      const row: Record<string, string> = {
        'Team Name': c.teamName,
        'Leader Name': c.leader.fullName,
        'Leader Email': c.leader.email,
        'Leader WhatsApp': c.leader.whatsapp,
        'Leader University': c.leader.university,
        'Leader IEEE': c.leader.ieeeMember ? 'Yes' : 'No',
        'Leader IEEE ID': c.leader.ieeeId || 'N/A',
        'Leader RAS': c.leader.rasMember ? 'Yes' : 'No',
        'Team Size': String(c.members.length + 1),
      };
      c.members.forEach((m, i) => {
        const n = i + 1;
        row[`Member ${n} Name`] = m.fullName;
        row[`Member ${n} Email`] = m.email;
        row[`Member ${n} WhatsApp`] = m.whatsapp;
        row[`Member ${n} University`] = m.university;
        row[`Member ${n} IEEE`] = m.ieeeMember ? 'Yes' : 'No';
        row[`Member ${n} IEEE ID`] = m.ieeeId || 'N/A';
        row[`Member ${n} RAS`] = m.rasMember ? 'Yes' : 'No';
      });
      row['Status'] = c.status.replace(/_/g, ' ');
      row['Registration Date'] = new Date(c.registeredAt).toLocaleString();
      row['Payment Proof'] = c.paymentProof ? 'Yes' : 'No';
      return row;
    });
    const ws2 = XLSX.utils.json_to_sheet(cRows);
    ws2['!cols'] = Array(30).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, ws2, 'Challengers');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `TRSYP3_Registrations_${dateStr}.xlsx`);
    toast('Export complete!');
  };

  return (
    <div className="adm-dashboard">
      <div className="adm-dash-header">
        <h1 className="adm-dash-title">Dashboard Overview</h1>
        <button className="adm-export-btn" onClick={handleExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export Spreadsheet
        </button>
      </div>

      {/* Stats */}
      <div className="adm-stats-row">
        <StatCard icon="&#128101;" value={participants.length + challengers.length} subtitle="Total Registrations" color="#8b5cf6" delay={0} />
        <StatCard icon="&#127891;" value={participants.length} subtitle="Participants" color="#3b82f6" delay={0.05} />
        <StatCard icon="&#127942;" value={challengers.length} subtitle="Challenger Teams" color="#f59e0b" delay={0.1} />
        <StatCard icon="&#128100;" value={totalIndividuals} subtitle="Total Individuals" color="#00E87A" delay={0.15} />
      </div>

      {/* Status chart + Nav cards row */}
      <div className="adm-mid-row">
        {/* Status breakdown */}
        <motion.div className="adm-card adm-status-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="adm-card-title">Status Breakdown</div>
          <div className="adm-status-chart-wrap">
            <div className="adm-stacked-bar">
              {statusMeta.map((s) => {
                const pct = (statusCounts[s.key] / total) * 100;
                return pct > 0 ? (
                  <motion.div
                    key={s.key}
                    className="adm-stacked-seg"
                    style={{ background: s.color, width: `${pct}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    title={`${s.label}: ${statusCounts[s.key]}`}
                  />
                ) : null;
              })}
            </div>
            <div className="adm-status-legend">
              {statusMeta.map((s) => (
                <div key={s.key} className="adm-legend-item">
                  <span className="adm-legend-dot" style={{ background: s.color }} />
                  <span className="adm-legend-label">{s.label}</span>
                  <span className="adm-legend-count">{statusCounts[s.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Nav cards */}
        <div className="adm-nav-cards">
          <MotionLink className="adm-nav-card" href="/admin/participants" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
            <div className="adm-nav-card-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            <div className="adm-nav-card-body">
              <div className="adm-nav-card-label">Participants</div>
              <div className="adm-nav-card-sub">{participants.length} registered</div>
            </div>
            <svg className="adm-nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </MotionLink>
          <MotionLink className="adm-nav-card" href="/admin/challengers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="adm-nav-card-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <div className="adm-nav-card-body">
              <div className="adm-nav-card-label">Challengers</div>
              <div className="adm-nav-card-sub">{challengers.length} teams registered</div>
            </div>
            <svg className="adm-nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </MotionLink>
        </div>
      </div>

      {/* Recent activity */}
      <motion.div className="adm-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
        <div className="adm-card-title">Recent Activity</div>
        <div className="adm-activity-list">
          {recentActivity.map((a, i) => (
            <div key={i} className="adm-activity-item">
              <span className={`adm-activity-dot ${a.type === 'Participant' ? 'adm-activity-dot-blue' : 'adm-activity-dot-amber'}`} />
              <span className="adm-activity-text">
                <strong>{a.type === 'Challenger' ? `Team ${a.team}` : a.name}</strong>
                {' registered as '}
                {a.type === 'Challenger' ? 'a Challenger team' : 'a Participant'}
              </span>
              <span className="adm-activity-time">{formatRelTime(a.date)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
