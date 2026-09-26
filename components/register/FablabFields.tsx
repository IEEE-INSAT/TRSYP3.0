'use client';

import Link from 'next/link';
import { FABLAB_AXES, type FablabAxis } from '@/lib/api/types';

/**
 * Axis choice for a Fablab team - one of three, picked by the leader.
 * Rendered as a stacked list rather than side-by-side tabs: the axis names are
 * long and must stay readable on a phone.
 */
export function FablabAxisPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: FablabAxis | null;
  onChange: (axis: FablabAxis) => void;
  disabled?: boolean;
}) {
  return (
    <div className="reg-field">
      <label className="reg-label" id="fablab-axis-label">Axis *</label>
      <div className="fablab-axis-group" role="radiogroup" aria-labelledby="fablab-axis-label">
        {FABLAB_AXES.map((axis) => {
          const active = value === axis.value;
          return (
            <button
              key={axis.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              className={`fablab-axis-option${active ? ' fablab-axis-option--active' : ''}`}
              onClick={() => onChange(axis.value)}
            >
              <span className="fablab-axis-num">Axis {axis.number}</span>
              <span className="fablab-axis-name">{axis.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Shown in place of the create/join forms when a participant who is not an
 * IEEE RAS member opens the Fablab tab - the backend would refuse them anyway,
 * so say why up front.
 */
export function FablabEligibilityNotice() {
  return (
    <p className="reg-account-hint">
      The Fablab challenge is open to <strong>IEEE RAS members only</strong>, for the leader and every
      teammate. If you are one, set your IEEE membership, IEEE ID and RAS membership in your{' '}
      <Link href="/dashboard/profile">profile</Link> first.
    </p>
  );
}
