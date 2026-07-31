'use client';

import { activityPhases, type RegistrationPhase } from '@/lib/config';
import { ACTIVITY_LABELS, TEAM_ACTIVITIES, type TeamActivity } from '@/lib/api/types';

/** Registration window for one activity, from `lib/config`. */
export function phaseOf(activity: TeamActivity): RegistrationPhase {
  return activity === 'CHALLENGE' ? activityPhases.challenge : activityPhases.competition;
}

/** Whether new teams can be created or joined for this activity right now. */
export function isActivityOpen(activity: TeamActivity): boolean {
  return phaseOf(activity) === 'open';
}

const PHASE_BADGE: Record<RegistrationPhase, string | null> = {
  open: null,
  soon: 'Soon',
  closed: 'Closed',
};

/**
 * Switch between the competition and the technical challenge.
 * Both tabs always render — a tab whose window is not open is still selectable
 * so members of an existing team can manage it, and it carries a Soon/Closed
 * badge so the state is obvious before the panel explains it.
 */
export default function ActivityToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: TeamActivity;
  onChange: (activity: TeamActivity) => void;
  disabled?: boolean;
}) {
  return (
    <div className="reg-field">
      <label className="reg-label">Which one are you signing up for?</label>
      <div className="reg-toggle-group">
        {TEAM_ACTIVITIES.map((activity) => {
          const badge = PHASE_BADGE[phaseOf(activity)];
          const active = value === activity;
          const activeClass =
            activity === 'COMPETITION' ? 'reg-toggle-active-green' : 'reg-toggle-active-pink';

          return (
            <button
              key={activity}
              type="button"
              className={`reg-toggle ${active ? activeClass : ''}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(activity)}
            >
              {ACTIVITY_LABELS[activity]}
              {badge && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    opacity: 0.7,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
