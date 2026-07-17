import { Wind, Flame, Droplet, Lightbulb, ShieldCheck } from 'lucide-react';
import type { Insight } from '../types';

// Descriptions are the verified Step 7 Gemini advice — same source already
// used in the notebook and src/data/knowledgeBase.ts. No `saving` field on
// any of these: none of the 5 automations has a real ₹/kWh tariff rate yet
// (see CLAUDE.md), so the badge simply doesn't render rather than showing a
// fabricated figure. Icon/color per card match that appliance's own entry in
// appliances.ts, not new colors.
export const insights: Insight[] = [
  {
    id: 1,
    title: 'AC Overnight Flat-Draw',
    desc: "Switching your AC to WindFree Sleep mode between 12am and 6am can help reduce the steady 1,040W it currently draws every night. Since this overnight cooling makes up 43.9 kWh—or 21% of your AC's total weekly energy—this simple mode change improves efficiency while keeping you comfortable.",
    icon: Wind,
    color: '#3498DB',
  },
  {
    id: 2,
    title: 'Water Heater / AC Overlap',
    desc: "Your water heater accounts for 74.99 kWh of your weekly energy, but its daily schedule currently overlaps perfectly with your AC's peak hours. By automatically shifting the water heater's schedule by just 30 to 60 minutes, we can stagger these heavy appliances and beautifully smooth out your home's energy demand.",
    icon: Flame,
    color: '#E74C3C',
  },
  {
    id: 3,
    title: 'Laundry Demand Spike',
    desc: 'Running your washing machine while the water heater was active created your home\'s two highest power surges this week, hitting 6,777W and 6,703W. By automatically pausing the washer during active water heating cycles, you will effortlessly avoid this ~40% spike above your typical household peak.',
    icon: Droplet,
    color: '#3498DB',
  },
  {
    id: 4,
    title: 'Lights Daytime Draw',
    desc: 'Your smart lights are currently drawing a steady 38-42W every day during the bright hours of 10am to 4pm. Enabling the daylight cutoff sensor during this window will help naturally trim down your 14.27 kWh weekly lighting footprint.',
    icon: Lightbulb,
    color: '#F1C40F',
  },
  {
    id: 5,
    title: 'Refrigerator Anomaly Monitor',
    desc: 'We are actively monitoring your refrigerator to learn its typical 150-180W baseline and track occasional jumps, like the 349W spike seen this week. This is strictly a diagnostic feature to ensure the compressor continues functioning normally and to alert you if the hardware ever starts drawing abnormal power.',
    icon: ShieldCheck,
    color: '#3498DB',
  },
];
