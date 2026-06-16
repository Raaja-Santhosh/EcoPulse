import React, { useState, useRef, useEffect } from 'react';
import { useEcoPulseStore } from '../store';
import { Bot, Send, Key, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  isError?: boolean;
}

const SUGGESTIONS = [
  { label: 'Suggest eco recipes', query: 'Suggest some low-carbon vegetarian/vegan dinner recipes with carbon calculations.' },
  { label: 'How to save energy?', query: 'What are the best ways to reduce my household energy usage and vampire draw?' },
  { label: 'Transport carbon tips', query: 'Compare the carbon emissions of petrol, electric, and shared public transit commuting.' },
  { label: 'Explain carbon score', query: 'What does a carbon score of 4 tons mean, and how does it compare globally?' },
];

export const AssistantTab: React.FC = () => {
  const { score, addLog } = useEcoPulseStore();
  const [messages, setMessages] = useState<ChatMessage[]>( [
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your EcoPulse Assistant. Paste your Google Gemini API Key in the config panel below to enable live conversational intelligence, or chat with me offline. Ask me about travel, food recipes, or home energy reduction!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ecopulse_gemini_key') || '');
  const [isApiKeySaved, setIsApiKeySaved] = useState(() => !!localStorage.getItem('ecopulse_gemini_key'));
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem('ecopulse_gemini_key', trimmed);
      setIsApiKeySaved(true);
      alert('Gemini API Key saved locally. Live conversational intelligence activated!');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('ecopulse_gemini_key');
    setApiKey('');
    setIsApiKeySaved(false);
    alert('Gemini key cleared. Swapping to offline simulation mode.');
  };

  const getSimulatedResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('transport') || q.includes('car') || q.includes('commute') || q.includes('transit') || q.includes('fly')) {
      return `🚗 **Transportation Insights:** Commuting is typically the largest slice of an individual's carbon footprint. 
      Replacing petrol driving with a bike or public transit saves roughly 0.41 kg of CO2 *per mile*. If you commute 15 miles daily, switching to transit reduces your annual footprint by almost **1.5 tons of CO2**!`;
    }
    if (q.includes('diet') || q.includes('recipe') || q.includes('food') || q.includes('eat') || q.includes('meal') || q.includes('vegan') || q.includes('vegetarian')) {
      return `🥗 **Low-Carbon Diet Tips:** Beef produces about **27 kg of CO2e** per kilogram of meat, whereas plant-based foods like lentils, beans, and tofu produce less than **1.5 kg**. 
      Here is a quick eco-friendly recipe:
      
      **Lentil & Coconut Dahl (Serves 4):**
      * Heat 1 tbsp oil, sauté 1 chopped onion, 2 garlic cloves, and 1 tbsp ginger.
      * Add 1 tbsp curry powder, 1 cup red lentils, 1 can coconut milk, and 2 cups vegetable broth.
      * Simmer for 20 mins until lentils are soft. Stir in baby spinach.
      * Carbon impact: **~0.3 kg CO2e per serving** (vs. ~6.5 kg for a beef burger!).`;
    }
    if (q.includes('energy') || q.includes('bill') || q.includes('electricity') || q.includes('heat') || q.includes('solar') || q.includes('power')) {
      return `💡 **Home Energy Efficiency:** Heating and cooling accounts for nearly half of household utility energy.
      * **Thermostat Control:** Dropping your heating thermostat by just 1°C saves around **10%** on your energy usage (equal to ~450 kg CO2/year).
      * **LED Transition:** Replacing traditional bulbs with LEDs reduces light energy consumption by **75%**.
      * **Standby Draw:** Unplugging chargers and TV standby units saves around $50-$100 and ~150 kg CO2 annually!`;
    }
    if (q.includes('badge') || q.includes('level') || q.includes('xp') || q.includes('rank')) {
      return `🏆 **EcoPulse Gamification & Rewards:**
      * Log logs daily (+10 XP) and commit to daily habits (+20 to +80 XP).
      * **Levels:**
        * Level 1: Seed (0 - 149 XP)
        * Level 2: Eco Seedling (150 - 399 XP)
        * Level 3: Active Sprout (400 - 799 XP)
        * Level 4: Forest Protector (800 - 1499 XP)
        * Level 5: Eco Guardian (1500+ XP)
      Keep making sustainable choices to level up!`;
    }
    return `🌱 I'm your eco-assistant! Ask me details about diet recipes, utility calculations, transport footprints, or our badges. Try asking: *'Suggest some diet recipes'* or *'How can I save transport emissions?'*`;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Add user message
    const userMsgId = Math.random().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: textToSend }]);
    setInputValue('');
    setIsLoading(true);

    const savedToken = localStorage.getItem('ecopulse_gemini_key');

    // Auto-log parser simulation (matching legacy auto-log)
    const lowerMsg = textToSend.toLowerCase();
    let autoLogged = false;
    let autoLogCategory: 'diet' | 'transport' | 'energy' | 'waste' = 'diet';
    let autoLogVal = 0;
    let autoLogCarbon = 0;
    let autoLogDesc = '';

    if (lowerMsg.includes('bike') || lowerMsg.includes('ride') || lowerMsg.includes('cycle')) {
      autoLogged = true;
      autoLogCategory = 'transport';
      autoLogVal = 5; // miles
      autoLogCarbon = 0.12 * 5; // EV/bike saving
      autoLogDesc = 'Eco bike ride (auto-logged)';
    } else if (lowerMsg.includes('salad') || lowerMsg.includes('vegan') || lowerMsg.includes('vegetable')) {
      autoLogged = true;
      autoLogCategory = 'diet';
      autoLogVal = 1;
      autoLogCarbon = 0.5; // Vegan meal
      autoLogDesc = 'Vegan meal (auto-logged)';
    }

    if (autoLogged) {
      addLog(autoLogCategory, autoLogVal, autoLogCarbon, true, autoLogDesc);
      confetti( {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    if (savedToken) {
      const promptContext = `You are EcoPulse Assistant, a personal carbon intelligence coach. The user currently emits ${score} tons of CO2e per year. Answer this ecological question concisely using Markdown: "${textToSend}"`;
      const payload = {
        contents: [{
          parts: [{ text: promptContext }]
        }]
      };

      const makeRequest = (version: string, model: string) => {
        return fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${savedToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      };

      try {
        let response = await makeRequest('v1beta', 'gemini-1.5-flash');
        if (response.status === 404) {
          response = await makeRequest('v1', 'gemini-1.5-flash');
        }
        if (response.status === 404) {
          response = await makeRequest('v1beta', 'gemini-1.5-pro');
        }
        if (response.status === 404) {
          response = await makeRequest('v1', 'gemini-pro');
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ( {}));
          const errMsg = errData.error?.message || `HTTP ${response.status}`;
          throw new Error(errMsg);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (replyText) {
          setMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), sender: 'assistant', text: replyText }
          ]);
          if (autoLogged) {
            setMessages((prev) => [
              ...prev,
              { id: Math.random().toString(), sender: 'system', text: `🌱 Auto-logged: ${autoLogDesc} (-${autoLogCarbon.toFixed(2)} kg CO2e)` }
            ]);
          }
        } else {
          throw new Error('Empty response received from Gemini API.');
        }
      } catch (err: any) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'assistant',
            text: `⚠️ Gemini API Request Failed: ${err.message}. Falling back temporarily to simulated offline response below:`,
            isError: true
          },
          {
            id: Math.random().toString(),
            sender: 'assistant',
            text: getSimulatedResponse(textToSend)
          }
        ]);
        if (autoLogged) {
          setMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), sender: 'system', text: `🌱 Auto-logged: ${autoLogDesc} (-${autoLogCarbon.toFixed(2)} kg CO2e)` }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        let text = getSimulatedResponse(textToSend);
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(), sender: 'assistant', text: text }
        ]);
        if (autoLogged) {
          setMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), sender: 'system', text: `🌱 Auto-logged: ${autoLogDesc} (-${autoLogCarbon.toFixed(2)} kg CO2e)` }
          ]);
        }
        setIsLoading(false);
      }, 700);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto" role="tabpanel" aria-label="Pluggable GenAI Assistant">
      <div className="border-b-2 border-[#2b3a34] pb-4">
        <h2 className="text-3xl font-bold font-serif text-[#2b3a34] uppercase">Eco-Assistant</h2>
        <p className="text-sm text-[#4a6b5d] mt-1">
          Chat with the conversational assistant powered by Google Gemini API, or consult local offline insights.
        </p>
      </div>

      <div className="neo-card bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col h-[500px] p-0 overflow-hidden">
        <div className="bg-[#f5f3eb] border-b-2 border-[#2b3a34] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white border-2 border-[#2b3a34] text-[#4a6b5d]">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <strong className="text-sm text-[#2b3a34]">EcoPulse Coach</strong>
              <span className="text-[10px] text-[#4a6b5d] block uppercase font-bold tracking-wider">
                {isApiKeySaved ? 'Mode: Gemini API Active' : 'Mode: Offline Simulation'}
              </span>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-[#d4a359]" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] p-3.5 border-2 border-[#2b3a34] text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'self-end bg-[#4a6b5d] text-white shadow-[2px_2px_0px_#2b3a34]'
                  : msg.sender === 'system'
                  ? 'self-center bg-[#fdfaf6] border-2 border-dashed border-[#4a6b5d] text-[#2b3a34] font-bold text-xs py-1.5 px-3'
                  : msg.isError
                  ? 'self-start bg-[#fff5f5] text-[#c87a53] border-[#c87a53] shadow-[2px_2px_0px_#c87a53]'
                  : 'self-start bg-[#f5f3eb] text-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]'
              }`}
            >
              <div className="markdown-render whitespace-pre-wrap">{msg.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start bg-[#f5f3eb] border-2 border-[#2b3a34] p-3 shadow-[2px_2px_0px_#2b3a34] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#4a6b5d] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#4a6b5d] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#4a6b5d] rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-[#f5f3eb] border-t-2 border-[#2b3a34] flex gap-2 overflow-x-auto select-none">
          {SUGGESTIONS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSendMessage(chip.query)}
              className="bg-white border-2 border-[#2b3a34] text-xs font-bold text-[#4a6b5d] px-2.5 py-1 whitespace-nowrap hover:bg-[#faf9f5]"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="flex border-t-2 border-[#2b3a34] p-3 bg-white">
          <input
            type="text"
            placeholder="Ask about recipes, energy audits, transport offsets..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-[#f5f3eb] border-2 border-[#2b3a34] px-4 py-2 text-sm outline-none focus:border-[#4a6b5d]"
          />
          <button
            type="submit"
            className="primary-btn px-4 py-2 border-[#2b3a34] bg-[#4a6b5d] text-white flex items-center justify-center ml-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="neo-card bg-[#f5f3eb] border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] p-6 flex flex-col gap-4">
        <h3 className="text-md font-serif font-bold text-[#2b3a34] flex items-center gap-2 border-b-2 border-[#2b3a34] pb-2">
          <Key className="w-5 h-5 text-[#d4a359]" /> GEMINI API CONFIGURATION
        </h3>
        <p className="text-xs text-[#4a6b5d] leading-relaxed">
          Provide your own Gemini API Key to enable dynamic answers incorporating your active carbon stats. The key is stored purely client-side in your local browser storage.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Paste your Google Gemini AI Key here..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isApiKeySaved}
            className="flex-1 bg-white border-2 border-[#2b3a34] px-3 py-2 text-xs outline-none"
          />
          {isApiKeySaved ? (
            <button
              type="button"
              onClick={handleClearKey}
              className="primary-btn bg-[#c87a53] border-[#2b3a34] text-xs py-2"
            >
              CLEAR KEY
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveKey}
              className="primary-btn bg-[#4a6b5d] border-[#2b3a34] text-xs py-2"
            >
              ACTIVATE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default AssistantTab;
