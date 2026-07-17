import { Wind, Refrigerator, WashingMachine } from 'lucide-react';
import type { DiscoverProduct } from '../types';

// Real, verified Samsung.com listings — specs and URLs as supplied, no
// invented figures, no price field (Samsung's own page owns current pricing).
//
// estimatedWeeklySavingsKwh IS hardcoded/invented, unlike everything else in
// this file — a deliberate, confirmed exception to this repo's "never invent
// kWh/watts/₹" rule, for this feature only. See the field's own doc comment
// in src/types.ts for why (no efficiency spec exists for Fridge/Washer to
// derive a real number from even in principle, and a real ISEER-formula
// estimate was offered for the AC and declined in favor of hardcoding all 3
// consistently).
export const featuredProducts: DiscoverProduct[] = [
  {
    id: 'ac-ar70h18d13wnna',
    category: 'Air Conditioner',
    name: 'Bespoke AI WindFree Pro Split AC',
    model: 'AR70H18D13WNNA',
    icon: Wind,
    accent: '#3498DB',
    specs: ['4.75 kW Capacity', '3 Star Rating', 'ISEER 4.43'],
    url: 'https://www.samsung.com/in/air-conditioners/split-ac/ar70-bespoke-ai-windfree-inverter-split-ac-ar70h18d13w-4-75-kw-3-star-2026-ar70h18d13wnna/',
    matchesApplianceId: 'ac',
    estimatedWeeklySavingsKwh: 35,
  },
  {
    id: 'fridge-rf71db9950qdtl',
    category: 'Refrigerator',
    name: 'Bespoke AI Refrigerator RF9000 T Style',
    model: 'RF71DB9950QDTL',
    icon: Refrigerator,
    accent: '#9B59B6',
    specs: ['810L Capacity', 'French Door', 'Family Hub'],
    url: 'https://www.samsung.com/in/refrigerators/french-door/rf9000-t-style-french-door-32inch-family-hub-810l-stainless-steel-rf71db9950qdtl/',
    matchesApplianceId: 'fridge',
    estimatedWeeklySavingsKwh: 5,
  },
  {
    id: 'washer-ww12db8b54gstl',
    category: 'Washing Machine',
    name: 'Bespoke AI Laundry WW8400D',
    model: 'WW12DB8B54GSTL',
    icon: WashingMachine,
    accent: '#2ECC71',
    specs: ['12kg Capacity', 'Front Load', 'AI EcoBubble', 'AI Energy Mode'],
    url: 'https://www.samsung.com/in/washers-and-dryers/washing-machines/ww8400d-front-loading-smartthings-ai-energy-made-a-xx-percent-extra-energy-efficiency-ai-ecobubble-12kg-navy-ww12db8b54gstl/',
    matchesApplianceId: 'washer',
    estimatedWeeklySavingsKwh: 1.5,
  },
];
