/**
 * Scenarios for the Ethical Decision Test. Each is a decision an automated
 * system has already made; the participant allows it or overrides it.
 * `detail.label` differs per scenario (the goal, the reason, the catch).
 */
export interface EthicsScenario {
  id: string;
  title: string;
  situation: string;
  detail: { label: string; text: string };
  focus: string;
}

export const ETHICS_SCENARIOS: EthicsScenario[] = [
  {
    id: 'traffic',
    title: 'AI Traffic Control',
    situation:
      'An automated traffic system redirects all city cars off a major highway and into local residential neighborhoods.',
    detail: {
      label: 'The goal',
      text: 'This saves 15 minutes of total travel time across the entire city, maximizing overall efficiency.',
    },
    focus: 'Greater overall time efficiency vs. neighborhood disruption.',
  },
  {
    id: 'triage',
    title: 'Medical Triage',
    situation: 'A hospital robot delays treatment for an elderly patient who has a lower chance of survival.',
    detail: {
      label: 'The goal',
      text: 'It frees up the last intensive care bed for a younger patient to maximize the number of life-years saved.',
    },
    focus: 'Ethics in elderly care vs. maximizing overall survival outcomes.',
  },
  {
    id: 'hiring',
    title: 'Automated Hiring',
    situation:
      'A hiring AI automatically filters out job applicants who have a gap in their work history, ignoring their actual qualifications.',
    detail: {
      label: 'The reason',
      text: 'Data indicates these applicants present a slightly higher statistical risk of turnover.',
    },
    focus: 'Individual fairness vs. statistical risk reduction.',
  },
  {
    id: 'home-security',
    title: 'Smart Home Security',
    situation:
      'A home security robot continuously records and uploads private family conversations to a cloud server.',
    detail: {
      label: 'The reason',
      text: 'The aggregate data trains its network to prevent potential break-ins across all homes.',
    },
    focus: 'Family privacy vs. collective security optimization.',
  },
  {
    id: 'insurance',
    title: 'Smart Insurance',
    situation: "An insurance algorithm doubles a driver's monthly premium based on predicted future risk profiles.",
    detail: {
      label: 'The catch',
      text: 'The driver has a clean record and has never been in an accident.',
    },
    focus: 'Preventive risk management vs. individual track record.',
  },
];
