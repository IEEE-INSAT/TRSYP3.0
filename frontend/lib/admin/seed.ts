import type { AdminRegistrations, AdminStatus } from './types';

/**
 * Generates demo admin registrations.
 *
 * PLACEHOLDER: used only until `/registration/admin/*` is live. Pure function —
 * persistence is handled by `admin.service.ts`.
 */

const UNIVERSITIES = ['INSAT', 'ENIT', 'ENIS', 'ENSI', 'FST', 'ESPRIT', "SUP'COM", 'ENETCOM', 'ESSTHS', 'ISIMM', 'FSM', 'ISTIC'];

const FIRST_NAMES = ['Ahmed', 'Sara', 'Mohamed', 'Yasmine', 'Omar', 'Ines', 'Amine', 'Mariem', 'Youssef', 'Nour', 'Khalil', 'Fatma', 'Hamza', 'Rania', 'Ali', 'Sarra', 'Bilel', 'Amira', 'Mehdi', 'Syrine', 'Aziz', 'Hela', 'Oussama', 'Dorra', 'Fares', 'Malek', 'Rayen', 'Chaima', 'Wassim', 'Asma'];
const LAST_NAMES = ['Ben Ali', 'Trabelsi', 'Mejri', 'Bouzid', 'Hamdi', 'Gharbi', 'Saidi', 'Maalej', 'Jebali', 'Khelifi', 'Brahem', 'Dridi', 'Cherif', 'Mansouri', 'Rezgui', 'Ayari', 'Bouazizi', 'Tlili', 'Haddad', 'Ferchichi'];

const TEAM_NAMES = ['RoboWarriors', 'Circuit Breakers', 'TechTitans', 'NeuroBots', 'MechMinds', 'SynapseSquad', 'ByteForce', 'IronLogic', 'PulseRobotics', 'VoltVanguard'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randPhone(): string { return `+216 ${Math.floor(10 + Math.random() * 90)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`; }
function randIeeeId(): string { return String(Math.floor(10000000 + Math.random() * 90000000)); }
function randName(): string { return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }

function randDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(8 + Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

const STATUSES: AdminStatus[] = [
  'waiting_for_payment', 'waiting_for_payment', 'waiting_for_payment',
  'waiting_for_verification', 'waiting_for_verification',
  'approved', 'approved', 'approved',
  'rejected',
];

export function generateSeedData(): AdminRegistrations {
  const participants = Array.from({ length: 13 }, (_, i) => {
    const isIeee = Math.random() > 0.4;
    const status = pick(STATUSES);
    const regDate = randDate(14);
    const hasProof = status === 'waiting_for_verification' || status === 'approved' || (status === 'rejected' && Math.random() > 0.5);
    const proofDate = hasProof ? new Date(new Date(regDate).getTime() + Math.random() * 86400000 * 2).toISOString() : null;

    return {
      id: `p_${String(i + 1).padStart(3, '0')}`,
      fullName: randName(),
      email: `participant${i + 1}@example.com`,
      password: 'Demo1234!',
      whatsapp: randPhone(),
      university: pick(UNIVERSITIES),
      ieeeMember: isIeee,
      ieeeId: isIeee ? randIeeeId() : null,
      rasMember: isIeee ? Math.random() > 0.5 : false,
      status,
      registeredAt: regDate,
      paymentProof: hasProof ? `receipt_${i + 1}.jpg` : null,
      paymentProofSubmittedAt: proofDate,
    };
  });

  const challengers = Array.from({ length: 7 }, (_, i) => {
    const memberCount = Math.floor(1 + Math.random() * 4);
    const isIeee = Math.random() > 0.4;
    const status = pick(STATUSES);
    const regDate = randDate(14);
    const hasProof = status === 'waiting_for_verification' || status === 'approved';
    const proofDate = hasProof ? new Date(new Date(regDate).getTime() + Math.random() * 86400000 * 2).toISOString() : null;

    return {
      id: `c_${String(i + 1).padStart(3, '0')}`,
      teamName: TEAM_NAMES[i],
      leader: {
        fullName: randName(),
        email: `leader${i + 1}@example.com`,
        password: 'Demo1234!',
        whatsapp: randPhone(),
        university: pick(UNIVERSITIES),
        ieeeMember: isIeee,
        ieeeId: isIeee ? randIeeeId() : null,
        rasMember: isIeee ? Math.random() > 0.5 : false,
      },
      members: Array.from({ length: memberCount }, (_, j) => {
        const mIeee = Math.random() > 0.5;
        return {
          fullName: randName(),
          email: `team${i + 1}_member${j + 1}@example.com`,
          whatsapp: randPhone(),
          university: pick(UNIVERSITIES),
          ieeeMember: mIeee,
          ieeeId: mIeee ? randIeeeId() : null,
          rasMember: mIeee ? Math.random() > 0.5 : false,
        };
      }),
      status,
      registeredAt: regDate,
      paymentProof: hasProof ? `team_receipt_${i + 1}.jpg` : null,
      paymentProofSubmittedAt: proofDate,
    };
  });

  return { participants, challengers };
}
