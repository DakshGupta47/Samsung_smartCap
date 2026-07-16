// ─────────────────────────────────────────────────────────────
// SmartCap RAG Knowledge Base
// Each chunk represents a discrete piece of knowledge about the
// app. The RAG engine retrieves the top-K chunks most relevant
// to a user query and synthesises an answer from them.
// ─────────────────────────────────────────────────────────────
//
// STATIC PLACEHOLDER: stands in for the "Coach Agent" described in CLAUDE.md's
// Planned Architecture (a live Gemini-prompted agent, not yet built). Every
// figure below is sourced from this app's own real data files (appliances.ts,
// automations.ts, insights.ts, EnergyRank.tsx, Dashboard.tsx) — never invented.
// Expect this file to be replaced wholesale once the live Coach Agent is wired
// up in a future session.

export type KnowledgeTopic =
  | 'overview'
  | 'navigation'
  | 'dashboard'
  | 'appliance'
  | 'automation'
  | 'insight'
  | '3dhome'
  | 'rank'
  | 'modal'
  | 'faq';

export interface KnowledgeChunk {
  id: string;
  topic: KnowledgeTopic;
  title: string;
  content: string;
  /** Short-form keywords that boost relevance when present in the query */
  keywords: string[];
}

export const knowledgeBase: KnowledgeChunk[] = [

  // ──────────────────── APP OVERVIEW ────────────────────
  {
    id: 'overview_main',
    topic: 'overview',
    title: 'What is Samsung SmartCap?',
    content:
      'Samsung SmartCap is a smart home energy management dashboard. It lets you monitor live power consumption, control connected appliances, visualise your apartment in 3D, and earn rewards for saving electricity. The app is built on the Samsung SmartThings concept and targets Indian households.',
    keywords: ['what', 'smartcap', 'samsung', 'app', 'overview', 'about', 'purpose', 'manage', 'monitor', 'control', 'energy', 'home', 'smart', 'dashboard'],
  },
  {
    id: 'overview_tabs',
    topic: 'navigation',
    title: 'App Sections & Navigation',
    content:
      'SmartCap has five main sections accessible from the bottom navigation bar: Dashboard (energy monitoring and appliance control), Energy Rank (XP rewards and achievements), 3D Home (interactive WebGL apartment view), Kiri Scan (photo-to-3D room scanning), and SmartCap AI (this chatbot assistant). Tap any icon to switch between sections instantly.',
    keywords: ['navigate', 'navigation', 'tabs', 'sections', 'pages', 'bottom', 'bar', 'menu', 'switch', 'go', 'where'],
  },

  // ──────────────────── DASHBOARD ────────────────────
  {
    id: 'dashboard_overview',
    topic: 'dashboard',
    title: 'Dashboard Overview',
    content:
      'The Dashboard is the main screen of SmartCap. It shows a Live Power Draw panel at the top, followed by Connected Appliances cards, Smart Automations, and Smart Insights. All energy numbers update in real time as you toggle appliances on or off.',
    keywords: ['dashboard', 'main', 'screen', 'home', 'page', 'overview', 'sections', 'live'],
  },
  {
    id: 'dashboard_power',
    topic: 'dashboard',
    title: 'Live Power Draw',
    content:
      'The Live Power Draw panel shows the current total wattage being consumed across all ON appliances. The animated gradient bar fills proportionally up to a 5,000 W maximum. Below that you see Today\'s Usage in kWh and the Estimated Monthly Cost in Indian Rupees (₹). Both figures update live whenever you toggle an appliance.',
    keywords: ['live', 'power', 'draw', 'watt', 'watts', 'current', 'consumption', 'bar', 'kwh', 'today', 'monthly', 'cost', 'rupee', 'rs', 'inr'],
  },
  {
    id: 'dashboard_cost',
    topic: 'dashboard',
    title: 'Monthly Cost Calculation',
    content:
      'The estimated monthly cost shown on the dashboard is the sum of costMonthly values across all five appliances. The current total is approximately ₹4,229 per month (these per-appliance figures are still placeholders pending a real ₹/kWh tariff rate). Turning appliances off does not change this figure — it reflects each appliance\'s typical usage pattern, not just its current toggle state.',
    keywords: ['cost', 'monthly', 'money', 'rupee', 'price', 'bill', 'estimate', 'spending', 'save', 'total'],
  },

  // ──────────────────── APPLIANCES ────────────────────
  {
    id: 'appliances_list',
    topic: 'appliance',
    title: 'Connected Appliances List',
    content:
      'SmartCap monitors five home appliances: Samsung WindFree AI AC (flat ~1,040 W overnight, ★★★★★), Smart Water Heater (~2,770 W morning peak / ~1,777 W evening peak, ★★★), Bespoke AI Washing Machine (~2,200 W measured average, ★★★★★), Bespoke Family Hub™ refrigerator (150-180 W baseline, ★★★★), and Smart LED Ecosystem lights (38-42 W, ★★★★★).',
    keywords: ['appliances', 'devices', 'connected', 'list', 'all', 'which', 'how many', 'ac', 'heater', 'washer', 'fridge', 'lights'],
  },
  {
    id: 'appliance_ac',
    topic: 'appliance',
    title: 'Samsung WindFree AI AC',
    content:
      'The Samsung WindFree AI AC draws a flat ~1,040 W every night during its 6-hour overnight window — 208.48 kWh/week (59.5% of the household total, the single biggest consumer). It has a 5-star efficiency rating. Today it has consumed about 29.78 kWh, costing ₹2,140/month (placeholder, pending real tariff rate) and producing 182 kg CO₂/month (placeholder, pending real emissions factor). The AI recommends switching it to WindFree/Sleep mode during this overnight window, since it currently runs at full, unmodulated power all night — saving ₹240/month (same placeholder caveat). It runs at 230 V and is currently ON by default.',
    keywords: ['ac', 'air', 'conditioner', 'aircon', 'windfree', 'cooling', 'temperature', '1040', 'cool', 'air conditioning'],
  },
  {
    id: 'appliance_heater',
    topic: 'appliance',
    title: 'Smart Water Heater',
    content:
      'The Smart Water Heater peaks daily at ~2,770 W in the morning (2 hours) and ~1,777 W in the evening (2 hours), plus an extra 2 hours on days it overlaps the washing machine. It has a 3-star efficiency rating — the lowest of the five appliances. It consumes about 10.71 kWh today (74.99 kWh/week total), costing ₹1,033/month and producing 88 kg CO₂/month (both placeholders pending real tariff/emissions data). The AI recommendation is to shift its cycles 30-60 minutes off the AC\'s peak hours, since they currently hit their daily peaks at the exact same times. This reduces peak-hour overlap rather than total kWh, so the ₹180/month figure is a placeholder not directly tied to this specific mechanism. It runs at 230 V and is OFF by default.',
    keywords: ['heater', 'water', 'geyser', 'hot water', '2770', 'shower', 'heating', 'boiler'],
  },
  {
    id: 'appliance_washer',
    topic: 'appliance',
    title: 'Bespoke AI Washing Machine',
    content:
      'The Bespoke AI Washing Machine draws ~2,200 W on average when running (measured samples: 2,220/2,227/2,186/2,169 W) and has a 5-star efficiency rating. It only runs twice a week — May 8 (11am-12pm) and May 11 (9-10am) — both overlapping the water heater\'s peak hours, producing the week\'s two highest demand spikes (6,777 W / 6,703 W vs ~4,700 W typical). It totals 8.80 kWh/week, costing ₹270/month and producing 23 kg CO₂/month (both placeholders). The AI recommends scheduling laundry outside the water heater\'s active hours to avoid this overlap spike, rather than running at a fixed time of day. It runs at 220 V and is OFF by default.',
    keywords: ['washer', 'washing', 'machine', 'laundry', 'clothes', 'bespoke', '2200', 'wash'],
  },
  {
    id: 'appliance_fridge',
    topic: 'appliance',
    title: 'Bespoke Family Hub™ Refrigerator',
    content:
      'The Bespoke Family Hub™ refrigerator runs continuously at a 150-180 W baseline with a 4-star efficiency rating. It consumes about 4.98 kWh today (34.85 kWh/week total), costing ₹688/month and producing 58 kg CO₂/month (both placeholders pending real tariff/emissions data). The AI recommendation is to monitor for abnormal draw spikes above this baseline — fault detection, not a scheduling or savings action — alongside an estimated ₹45/month savings figure shown in its detail modal (placeholder). It runs at 220 V and is always ON — SmartCap never proposes fully shutting off the refrigerator, only efficiency checks like this.',
    keywords: ['fridge', 'refrigerator', 'family', 'hub', 'bespoke', 'cold', 'cooling', '150', 'food'],
  },
  {
    id: 'appliance_lights',
    topic: 'appliance',
    title: 'Smart LED Ecosystem',
    content:
      'The Smart LED Ecosystem draws a steady 38-42 W from 10am-4pm daily (6 hours), with a 5-star efficiency rating. It uses about 2.04 kWh today (14.27 kWh/week total), costing ₹98/month and producing 8 kg CO₂/month (both placeholders). The AI recommendation is to add a daylight/motion sensor to cut unnecessary lighting during these full-daylight hours, saving ₹30/month (placeholder). It runs at 220 V and is ON by default.',
    keywords: ['lights', 'led', 'lighting', 'lamp', 'bulb', 'smart', '40', 'ecosystem', 'dim', 'bright'],
  },
  {
    id: 'appliance_toggle',
    topic: 'appliance',
    title: 'How to Toggle an Appliance ON or OFF',
    content:
      'To toggle an appliance, tap the green or grey toggle switch in the top-right corner of its card on the Dashboard. Green = ON, Grey = OFF. You can also open the appliance detail modal by tapping anywhere else on the card, and use the big "Turn On" or "Turn Off" button at the bottom of the modal.',
    keywords: ['toggle', 'turn', 'on', 'off', 'switch', 'control', 'enable', 'disable', 'start', 'stop', 'power'],
  },
  {
    id: 'appliance_efficiency',
    topic: 'appliance',
    title: 'Efficiency Star Rating',
    content:
      'Each appliance card shows a 1-5 star efficiency rating in the top-left corner. 5 stars (green) means the device is highly energy efficient. 3 stars means average. The Smart Water Heater has the lowest rating (3 stars), while the AC, Washing Machine, and LED Ecosystem all have 5 stars, and the Refrigerator has 4 stars.',
    keywords: ['efficiency', 'star', 'rating', 'stars', 'eco', 'green', 'energy', 'efficient', 'score'],
  },

  // ──────────────────── APPLIANCE MODAL ────────────────────
  {
    id: 'modal_overview',
    topic: 'modal',
    title: 'Appliance Detail Modal',
    content:
      'Tapping an appliance card (not the toggle) opens a full-screen detail modal. It shows the appliance icon, running/standby status badge, a data grid with Power Draw, Voltage, Today\'s kWh, Monthly kWh, Est. Cost, Runtime today, and Carbon Footprint. Below that is the AI Recommendation panel with the potential savings amount. The bottom has a large Turn On / Turn Off action button.',
    keywords: ['modal', 'details', 'detail', 'popup', 'inspect', 'open', 'card', 'tap', 'click', 'info', 'information'],
  },
  {
    id: 'modal_carbon',
    topic: 'modal',
    title: 'Carbon Footprint Data',
    content:
      'Inside each appliance\'s detail modal you can see the monthly carbon footprint in kg CO₂ (still a placeholder pending a real emissions factor). The AC produces the most at 182 kg CO₂/month, followed by the Water Heater at 88 kg, the Refrigerator at 58 kg, the Washing Machine at 23 kg, and the LED lights the least at 8 kg CO₂/month. Total household carbon from all five appliances is approximately 359 kg CO₂/month.',
    keywords: ['carbon', 'co2', 'footprint', 'emission', 'environment', 'greenhouse', 'planet', 'green', 'eco'],
  },

  // ──────────────────── AUTOMATIONS ────────────────────
  {
    id: 'automations_overview',
    topic: 'automation',
    title: 'Smart Automations Overview',
    content:
      'The Dashboard\'s Smart Automations section shows five automation rules you can toggle on or off, each grounded in a pattern observed in the household\'s 7-day data. All five are inactive (OFF) by default. None of them propose fully shutting off the AC or refrigerator — only mode/schedule changes.',
    keywords: ['automation', 'automations', 'automatic', 'rules', 'smart', 'schedule', 'trigger'],
  },
  {
    id: 'automation_ac_sleep',
    topic: 'automation',
    title: 'Switch AC to WindFree/Sleep Mode overnight',
    content:
      'This automation switches the AC to WindFree/Sleep mode during its flat, unmodulated overnight draw window, because overnight cooling currently runs at full power with no adjustment for reduced nighttime cooling needs. Evidence: a flat ~1,040 W draw every night, 12am-6am, all 7 nights — 43.9 kWh/week, 21% of the AC\'s total weekly use. Confidence is 100% (consistent across all 7 nights). This is a mode change, not a shutoff — it maintains safe cooling for Indian summer heat.',
    keywords: ['ac', 'sleep', 'windfree', 'overnight', 'automation', 'night'],
  },
  {
    id: 'automation_heater_stagger',
    topic: 'automation',
    title: 'Shift water heater 30-60 min off AC\'s peak hours',
    content:
      'This automation shifts water heater cycles 30-60 minutes away from the AC\'s peak hours, because the water heater and AC currently hit their daily peaks in the exact same hours every day. Evidence: the heater fires 6-8am (~2,770 W) and 7-9pm (~1,777 W) daily — the same windows as the AC\'s own peak draw. Confidence is 100% (same pattern all 7 days). The tradeoff is a minor shift in hot water availability timing.',
    keywords: ['heater', 'stagger', 'peak', 'water', 'automation', 'schedule'],
  },
  {
    id: 'automation_laundry_stagger',
    topic: 'automation',
    title: 'Schedule laundry outside active water heater hours',
    content:
      'This automation avoids scheduling laundry loads during active water heater cycles, because the week\'s two highest simultaneous demand spikes both came from this exact overlap. Evidence: on May 8 and May 11, laundry loads overlapped an active heater cycle, producing 6,777 W and 6,703 W demand versus a typical peak of ~4,700 W — roughly a 40% spike. Confidence is based on 2 of 2 observed laundry days — a small sample, but the mechanism (direct load-stacking) is direct, not correlational.',
    keywords: ['laundry', 'stagger', 'washing', 'water', 'heater', 'overlap', 'spike', 'automation'],
  },
  {
    id: 'automation_lights_daylight',
    topic: 'automation',
    title: 'Add daylight/motion sensor for 10am-4pm',
    content:
      'This automation adds a daylight/motion sensor to cut unnecessary lighting during full-daylight hours, because lights currently draw steadily through daylight hours with no adjustment for available natural light. Evidence: a steady 38-42 W every day, 10am-4pm — 14.27 kWh/week of exposure. Confidence is 100% (same pattern all 7 days). It is a small individual saving, but a low-cost, easy automation.',
    keywords: ['lights', 'daylight', 'motion', 'sensor', 'automation'],
  },
  {
    id: 'automation_fridge_alert',
    topic: 'automation',
    title: 'Monitor for abnormal refrigerator draw',
    content:
      'This automation monitors refrigerator draw for spikes above its normal 150-180 W baseline. It is fault detection, not scheduling or a savings claim — an occasional spike (e.g. 349 W) is plausibly just a normal defrost cycle, not a confirmed fault, so confidence is currently low. It never proposes shutting off the refrigerator.',
    keywords: ['fridge', 'refrigerator', 'alert', 'monitor', 'abnormal', 'spike', 'automation'],
  },
  {
    id: 'automation_toggle',
    topic: 'automation',
    title: 'How to Toggle an Automation',
    content:
      'On the Dashboard, scroll down to the Smart Automations section. Each automation card has a toggle switch on its right side — blue means active, light grey means inactive. Tap the toggle to turn an automation on or off. Active automations have a slight upward lift animation.',
    keywords: ['toggle', 'automation', 'enable', 'disable', 'turn', 'on', 'off', 'switch', 'activate'],
  },

  // ──────────────────── AI INSIGHTS ────────────────────
  {
    id: 'insights_overview',
    topic: 'insight',
    title: 'Smart Insights Overview',
    content:
      'The Smart Insights section at the bottom of the Dashboard shows AI-generated tips to reduce your energy bill. Each insight card has a title, description, and potential monthly saving amount (still a placeholder pending a real ₹/kWh tariff rate). Currently there are two insights: AC Overnight Flat-Draw and Lights Daytime Draw.',
    keywords: ['insight', 'insights', 'tip', 'tips', 'recommendation', 'advice', 'ai', 'suggestion', 'optimize', 'save'],
  },
  {
    id: 'insight_ac_overnight',
    topic: 'insight',
    title: 'AC Overnight Flat-Draw Insight',
    content:
      'The AC Overnight Flat-Draw insight shows that your AC draws a flat ~1,040 W every night during its 6-hour overnight window — 43.9 kWh/week, 21% of its 208.48 kWh weekly total. The estimated saving of ₹240/month is a placeholder pending a real tariff rate.',
    keywords: ['ac', 'overnight', 'flat', 'draw', 'insight', '1040', '43.9'],
  },
  {
    id: 'insight_lights_daytime',
    topic: 'insight',
    title: 'Lights Daytime Draw Insight',
    content:
      'The Lights Daytime Draw insight shows that your lights draw a steady 38-42 W every day from 10am-4pm (daylight hours) — 14.27 kWh/week total. The estimated saving of ₹30/month is a placeholder pending a real tariff rate.',
    keywords: ['lights', 'daytime', 'draw', 'insight', '38', '42', '14.27'],
  },

  // ──────────────────── 3D HOME VIEW ────────────────────
  {
    id: '3dhome_overview',
    topic: '3dhome',
    title: '3D Home View Overview',
    content:
      'The 3D Home view renders an interactive real-time WebGL apartment model using Three.js. You can orbit (drag), pan, and zoom (scroll) around the full apartment, and switch between three scene-lighting presets: Midnight, Sunrise, and Grey. Below the 3D canvas is a row of tappable appliance icons — tap one to open its detail modal, the same one you\'d get from the Dashboard.',
    keywords: ['3d', 'home', 'view', 'three', 'model', 'apartment', 'room', 'webgl', 'rotate', 'orbit', 'zoom', 'pan', 'drag', 'interactive'],
  },
  {
    id: '3dhome_night',
    topic: '3dhome',
    title: 'Night Mode in 3D Home',
    content:
      'The Night Mode toggle is the moon/sun button in the top-right of the 3D Home view. Turning it on darkens the scene\'s appearance. Press the sun icon to switch back to daytime mode. This is separate from the Midnight/Sunrise/Grey scene-theme buttons, which change the lighting preset rather than toggling night mode on or off.',
    keywords: ['night', 'mode', 'dark', 'moon', 'sun', 'toggle', 'day', 'light', 'dim', 'overlay', 'atmosphere'],
  },
  {
    id: '3dhome_legend',
    topic: '3dhome',
    title: '3D Home Appliance Row',
    content:
      'Below the 3D canvas there is a legend dot (pulsing green, labelled "Our House") and a row of appliance icon buttons. Tap any appliance icon to open its full detail modal, the same inspection view available from the Dashboard. Appliances that are OFF appear dimmed in this row.',
    keywords: ['legend', 'colour', 'color', 'green', 'appliance', 'row', 'icon', 'indicator', 'key'],
  },
  {
    id: '3dhome_upload',
    topic: '3dhome',
    title: 'Custom 3D Model Upload',
    content:
      'The 3D Home view supports uploading your own apartment model via a hidden file input (id: zipUpload). Prepare a ZIP archive containing your .glb or .gltf model file plus any texture files. The app uses JSZip to unpack the archive in-browser and load your custom model without any server upload.',
    keywords: ['upload', 'custom', 'model', 'zip', 'gltf', 'glb', 'own', 'personal', 'file', 'texture'],
  },
  {
    id: '3dhome_controls',
    topic: '3dhome',
    title: '3D Home Controls',
    content:
      'To navigate the 3D apartment: Click and drag to orbit around the scene. Scroll (or pinch on mobile) to zoom in and out. The camera is locked at a maximum polar angle so you cannot flip the view upside down. OrbitControls with damping makes the movement feel smooth and inertial.',
    keywords: ['control', 'controls', 'rotate', 'orbit', 'zoom', 'scroll', 'drag', 'navigate', 'move', 'camera', 'pan', 'pinch'],
  },

  // ──────────────────── ENERGY RANK ────────────────────
  {
    id: 'rank_overview',
    topic: 'rank',
    title: 'Energy Rank & Rewards Overview',
    content:
      'The Energy Rank tab is Samsung\'s gamified rewards system. Earn XP (experience points) by saving electricity, completing energy challenges, and upgrading to efficient appliances. Your current level is "Eco Champion" with 7,420 XP earned. You need 9,000 XP to unlock "Smart Living Expert". (These XP/rewards figures are a known placeholder, not yet derived from real weekly kWh saved.)',
    keywords: ['rank', 'reward', 'rewards', 'xp', 'experience', 'points', 'level', 'gamification', 'eco', 'champion', 'samsung'],
  },
  {
    id: 'rank_stats',
    topic: 'rank',
    title: 'Current Rank Stats',
    content:
      'Your current Samsung Rewards stats are: 7,420 XP earned, 150 kWh of energy saved, 112 kg of CO₂ reduced, and ₹1,240 money saved. The XP progress bar is at 82% toward the next level (Smart Living Expert at 9,000 XP), with 1,580 XP remaining. (These figures are a known placeholder, not yet derived from real weekly kWh saved.)',
    keywords: ['stats', 'statistics', 'xp', 'kwh', 'saved', 'co2', 'money', '7420', '150', '112', '1240', 'progress'],
  },
  {
    id: 'rank_achievements',
    topic: 'rank',
    title: 'Achievements',
    content:
      'The Recent Achievements section shows four milestones. Three are completed (green): "Completed Energy Challenge" (maintained low usage for 7 days), "AI Energy Mode Fan" (used AI Mode for 20 days straight), and "Reduced Standby Leak" (automated standby power off for an idle appliance). One is pending: "Appliance Upgrader" (replace 2 old appliances).',
    keywords: ['achievement', 'achievements', 'milestone', 'badge', 'complete', 'done', 'pending', 'unlock', 'challenge'],
  },
  {
    id: 'rank_upgrade',
    topic: 'rank',
    title: 'Upgrade & Earn XP',
    content:
      'The "Upgrade & Earn XP" section recommends replacing your Old Split AC (1,850 W) with the Samsung WindFree™ AI AC (1,180 W). This upgrade earns +500 XP, saves ₹520/month, and reduces consumption by 42 kWh/month. The upgrade recommendation is shown in the Energy Rank tab.',
    keywords: ['upgrade', 'earn', 'xp', 'old', 'split', 'ac', 'windfree', 'replace', 'save', '500', '520', '42'],
  },

  // ──────────────────── FAQ ────────────────────
  {
    id: 'faq_total_energy',
    topic: 'faq',
    title: 'How much energy does the house use in total?',
    content:
      'Averaged across the week, daily usage is around 48.8 kWh (AC ~29.78, Water Heater ~10.71, Washing Machine ~1.26, Refrigerator ~4.98, Lights ~2.04 kWh/day). Monthly across all five appliances the total is roughly 1,463 kWh. The Live Power Draw panel on the Dashboard shows the real-time wattage — currently around 1,245 W when the AC, Refrigerator, and Lights are ON (their default states; the Water Heater and Washing Machine are OFF by default).',
    keywords: ['total', 'how much', 'energy', 'house', 'home', 'kwh', 'monthly', 'daily', 'all', 'combined', 'together'],
  },
  {
    id: 'faq_save_money',
    topic: 'faq',
    title: 'How can I save money on my bill?',
    content:
      'The best ways to save energy using SmartCap, in order of how well-evidenced they are: 1) Switch the AC to WindFree/Sleep mode overnight (avoids 43.9 kWh/week of flat, unmodulated draw). 2) Shift the water heater 30-60 minutes off the AC\'s peak hours. 3) Schedule laundry outside active water heater hours (avoids the week\'s two biggest demand spikes). 4) Add a daylight/motion sensor for the lights, 10am-4pm (14.27 kWh/week exposure). ₹-amount savings are still placeholders pending a real tariff rate — see each automation\'s card for details.',
    keywords: ['save', 'money', 'bill', 'reduce', 'cost', 'cheaper', 'tips', 'how', 'cut', 'lower'],
  },
  {
    id: 'faq_most_power',
    topic: 'faq',
    title: 'Which appliance uses the most power?',
    content:
      'The Washing Machine has the highest instantaneous peaks (6,777 W / 6,703 W on the two days it overlaps the water heater), and the water heater has the highest routine peak (~2,770 W each morning). But the AC is by far the biggest energy consumer overall — 208.48 kWh/week, 59.5% of the household total — because its ~1,040 W draw runs for a 6-hour window every single night. If you want to reduce your bill the most, focus on the AC.',
    keywords: ['most', 'highest', 'power', 'watt', 'consumption', 'biggest', 'which', 'top', 'expensive'],
  },
  {
    id: 'faq_3d_not_loading',
    topic: 'faq',
    title: 'The 3D model is taking a long time to load',
    content:
      'The default 3D apartment model (appartement.glb) is about 35 MB, so loading time depends on your device speed. A loading spinner with status messages ("Compiling interior space layout...") will appear during loading. For faster loads, a Draco-compressed version of the model would reduce it by ~90%. This is planned for a future update.',
    keywords: ['loading', 'slow', 'model', '3d', 'time', 'spinner', 'wait', 'glb', 'load', 'lag'],
  },
  {
    id: 'faq_chatbot',
    topic: 'faq',
    title: 'What can the SmartCap AI chatbot help with?',
    content:
      'The SmartCap AI assistant can answer questions about: your connected appliances and their energy stats, how to use the dashboard, automation rules, AI insights, the 3D Home view and controls, the Energy Rank/rewards system, how to save energy and money, and general navigation tips. It cannot answer questions unrelated to the SmartCap app.',
    keywords: ['chatbot', 'ai', 'assistant', 'bot', 'help', 'answer', 'can', 'what', 'smartcap', 'questions'],
  },
  {
    id: 'faq_night_vs_automation',
    topic: 'faq',
    title: 'Difference between Night Mode and automations',
    content:
      'Night Mode (3D Home toggle) only affects the visual appearance of the 3D apartment. The Smart Automations on the Dashboard (like "Switch AC to WindFree/Sleep Mode overnight") actually control your appliances\' behavior. They are independent features: you can use one without the other.',
    keywords: ['difference', 'night', 'mode', 'automation', 'visual', 'actual', 'vs', 'versus', '3d', 'dark'],
  },
  {
    id: 'faq_voltage',
    topic: 'faq',
    title: 'Voltage of connected appliances',
    content:
      'The voltage ratings of each appliance in SmartCap are: AC = 230 V, Water Heater = 230 V, Washing Machine = 220 V, Refrigerator = 220 V, LED Lights = 220 V. You can view the voltage for any specific appliance by tapping its card to open the detail modal.',
    keywords: ['voltage', 'volt', 'power', 'electrical', 'supply', 'current', '220', '230', 'rating'],
  },
];
