import React, { useState } from 'react';
import { Zap, Car, Leaf, ShoppingBag, ArrowRight } from 'lucide-react';

interface AccordionItem {
  id: 'energy' | 'transport' | 'diet' | 'waste';
  emoji: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string;
  alt: string;
  baseline: string;
}

const ACCORDIONS: AccordionItem[] = [
  {
    id: 'energy',
    emoji: '🔌',
    title: 'Energy & Utilities',
    subtitle: '~31% of typical footprint',
    icon: <Zap className="w-5 h-5 text-[#38bdf8]" />,
    content: 'Electricity generation and home heating are the largest sources of personal carbon emissions. Traditional coal or gas grid power systems release greenhouse gases continuously to run appliances, lighting, and air conditioners.',
    alt: 'Heat Pumps / Solar power',
    baseline: '< 150 kWh / month',
  },
  {
    id: 'transport',
    emoji: '🚗',
    title: 'Transportation',
    subtitle: '~15% of typical footprint',
    icon: <Car className="w-5 h-5 text-[#ff6b6b]" />,
    content: 'Internal combustion engines burn petrol or diesel, emitting CO2 directly from vehicle tailpipes. Solo driving and commercial flights are the most carbon-intensive transport methods.',
    alt: 'Active Transit / Electric vehicles',
    baseline: 'Zero solo fossil commutes',
  },
  {
    id: 'diet',
    emoji: '🥗',
    title: 'Diet & Food',
    subtitle: '~26% of typical footprint',
    icon: <Leaf className="w-5 h-5 text-[#10b981]" />,
    content: 'Industrial livestock farming (particularly beef cattle) produces massive amounts of methane—a greenhouse gas 28x more potent than CO2. Global transport of out-of-season produce adds heavy transit carbon costs.',
    alt: 'Plant-Based / Local organic',
    baseline: 'Local, seasonal meals',
  },
  {
    id: 'waste',
    emoji: '♻️',
    title: 'Shopping & Waste',
    subtitle: '~28% of typical footprint',
    icon: <ShoppingBag className="w-5 h-5 text-[#5e6ad2]" />,
    content: 'Manufacturing of consumer goods requires significant industrial power. Organic waste in municipal landfills decays anaerobically, generating heavy methane releases without capture.',
    alt: 'Composting / Reusable goods',
    baseline: 'Zero single-use plastics',
  },
];

interface HomeTabProps {
  onNavigateToDashboard: () => void;
}

/**
 * Eco-literacy home tab providing educational content about carbon footprints,
 * emission sources, and interactive accordion breakdowns of the four impact categories.
 */
export const HomeTab: React.FC<HomeTabProps> = ({ onNavigateToDashboard }) => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('energy');

  const handleAccordionClick = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-14 pb-16" role="tabpanel" aria-label="Eco Literacy Home Page">
      {/* Editorial Hero Banner */}
      <div className="neo-card text-center p-10 bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col items-center gap-6">
        <span className="text-xs text-[#c87a53] uppercase tracking-[3px] font-bold font-sans">
          Welcome to the Pulse
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold uppercase font-serif text-[#2b3a34]">
          UNDERSTANDING YOUR <span className="italic-highlight text-[#4a6b5d]">PULSE</span>
        </h2>
        <p className="text-base md:text-lg text-[#4a6b5d] max-w-2xl font-medium leading-relaxed">
          A physical-journal-style guide to personal carbon literacy. Explore the core definition of carbon footprint, see what drives emissions, and learn how daily behaviors shape the planetary future.
        </p>
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="primary-btn flex items-center gap-2"
        >
          GO TO DASHBOARD <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scrolling Marquee Ticker */}
      <div className="text-marquee-wrapper border-y-2 border-[#2b3a34] py-3 bg-[#f5f3eb] overflow-hidden select-none flex gap-12" aria-hidden="true">
        <div className="marquee-content flex gap-12 whitespace-nowrap animate-[marqueeScroll_25s_linear_infinite]">
          <span className="marquee-text">• LEARN FOOTPRINT BASICS</span>
          <span className="marquee-text">• UNDERSTAND THE EMISSIONS MATRIX</span>
          <span className="marquee-text">• TAKE DAILY HABIT ACTIONS</span>
          <span className="marquee-text">• EVOLVE FROM SEED TO GUARDIAN</span>
        </div>
        <div className="marquee-content flex gap-12 whitespace-nowrap animate-[marqueeScroll_25s_linear_infinite]">
          <span className="marquee-text">• LEARN FOOTPRINT BASICS</span>
          <span className="marquee-text">• UNDERSTAND THE EMISSIONS MATRIX</span>
          <span className="marquee-text">• TAKE DAILY HABIT ACTIONS</span>
          <span className="marquee-text">• EVOLVE FROM SEED TO GUARDIAN</span>
        </div>
      </div>

      {/* Two-Column Concept Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-start gap-4 text-left">
          <span className="text-xs text-[#c87a53] uppercase tracking-[2px] font-bold">
            Core Concept
          </span>
          <h3 className="text-3xl font-bold font-serif text-[#2b3a34]">
            What is a <span className="italic-highlight">Carbon Footprint</span>?
          </h3>
          <p className="text-sm text-[#4a6b5d] leading-relaxed">
            A carbon footprint represents the total volume of greenhouse gases (including carbon dioxide and methane) emitted directly and indirectly by an individual's, household's, or organization's lifestyle decisions.
          </p>
          <p className="text-sm text-[#4a6b5d] leading-relaxed">
            It acts as an ecological shadow. Every fuel-burning flight, grid-powered light, and steak meal leaves a thermal footprint in the upper atmosphere. This footprint is measured in metric tons of carbon dioxide equivalent (t CO₂e) per year.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="p-2 bg-[#f5f3eb] border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] max-w-sm w-full">
            <img 
              src="/assets/carbon_footprint_concept.png?v=4.0" 
              alt="Carbon Footprint Concept" 
              className="w-full h-auto object-cover border border-[#2b3a34]"
            />
          </div>
        </div>
      </div>

      {/* Accordion causes section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Accordions (First on mobile, right on desktop) */}
        <div className="flex flex-col items-start gap-4 text-left w-full md:order-2">
          <span className="text-xs text-[#c87a53] uppercase tracking-[2px] font-bold">
            Main Contributors
          </span>
          <h3 className="text-3xl font-bold font-serif text-[#2b3a34]">
            Where does it <span className="italic-highlight">come from</span>?
          </h3>
          <p className="text-sm text-[#4a6b5d] mb-4">
            Global carbon emissions from daily actions break down into four primary categories. Click on each sector to explore details:
          </p>

          <div className="causes-matrix">
            {ACCORDIONS.map((item) => {
              const isActive = activeAccordion === item.id;
              return (
                <div
                  key={item.id}
                  className={`cause-accordion-item ${isActive ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleAccordionClick(item.id)}
                    aria-expanded={isActive}
                    className="accordion-header"
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-emoji" role="img" aria-label={item.title}>
                        {item.emoji}
                      </span>
                      <div className="accordion-title-block">
                        <h4>{item.title}</h4>
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                    <span className="accordion-arrow">▼</span>
                  </button>

                  <div className="accordion-body">
                    <div className="accordion-content">
                      <p className="text-sm">{item.content}</p>
                      <div className="accordion-metrics-grid">
                        <div className="accordion-metric-card">
                          <span>Eco Alternative</span>
                          <strong>{item.alt}</strong>
                        </div>
                        <div className="accordion-metric-card">
                          <span>Ideal Target</span>
                          <strong>{item.baseline}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Image (Second on mobile, left on desktop) */}
        <div className="flex justify-center md:order-1">
          <div className="p-2 bg-[#f5f3eb] border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] max-w-sm w-full">
            <img 
              src="/assets/ecological_balance_concept.png?v=4.0" 
              alt="Ecological Balance Concept" 
              className="w-full h-auto object-cover border border-[#2b3a34]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomeTab;
