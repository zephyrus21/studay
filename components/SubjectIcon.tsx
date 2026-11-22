import {
  Baby, Bone, Brain, CalendarDays, Clover, Dna, Droplet, Ear, Eye, HandHeart, HeartPulse,
  Microscope, Pill, Scale, Stethoscope, Wind, type LucideIcon,
} from 'lucide-react'

// Stored subject icons are emoji keys (lib/icons.ts); they map to Lucide icons here.
const MAP: Record<string, LucideIcon> = {
  '🫀': HeartPulse, '🦴': Bone, '🧠': Brain, '🫁': Wind, '💊': Pill, '🦠': Microscope, '🧬': Dna,
  '🩸': Droplet, '👁️': Eye, '👂': Ear, '🤰': HandHeart, '👶': Baby, '⚖️': Scale, '🩺': Stethoscope,
}

// Accessible names for the icon picker.
export const SUBJECT_LABELS: Record<string, string> = {
  '🫀': 'Heart', '🦴': 'Bones', '🧠': 'Brain', '🫁': 'Lungs', '💊': 'Medicines', '🦠': 'Microbes', '🧬': 'Genetics',
  '🩸': 'Blood', '👁️': 'Eye', '👂': 'Ear', '🤰': 'Pregnancy', '👶': 'Child', '⚖️': 'Forensics', '🩺': 'General',
}

export function SubjectIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const Icon = MAP[icon] ?? Stethoscope
  return <Icon size={size} aria-hidden />
}

export function CountdownIcon({ today, size = 12 }: { today: boolean; size?: number }) {
  const Icon = today ? Clover : CalendarDays
  return <Icon size={size} aria-hidden />
}
