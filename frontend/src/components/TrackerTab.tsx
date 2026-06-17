import React, { useState } from 'react';
import { useEcoPulseStore } from '../store';
import { PlusCircle, Trash } from 'lucide-react';
import { CarbonMath } from '../utils/carbonMath';

export const TrackerTab: React.FC = () => {
  const { logs, addLog, deleteLog, clearLogs } = useEcoPulseStore();

  const [category, setCategory] = useState<'transport' | 'diet' | 'energy' | 'waste'>('transport');
  const [title, setTitle] = useState('');
  
  // Transport inputs
  const [miles, setMiles] = useState('');
  const [commuteType, setCommuteType] = useState('petrol');

  // Diet inputs
  const [servings, setServings] = useState('1');
  const [dietType, setDietType] = useState('beef');

  // Energy inputs
  const [kwh, setKwh] = useState('');

  // Waste inputs
  const [wasteKg, setWasteKg] = useState('');

  // Action direction: emitting carbon (standard activity) or saving carbon (eco action)
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState('');

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let calculatedCarbon = 0;
    let computedValue = 0;
    let defaultTitle = title;

    if (category === 'transport') {
      const val = parseFloat(miles);
      if (isNaN(val) || val <= 0) {
        setError('Please enter a valid positive distance in miles.');
        return;
      }
      computedValue = val;

      const coeff = CarbonMath.calculateTransportEmissions(1, commuteType);
      let typeLabel = 'Petrol Car';
      if (commuteType === 'electric') {
        typeLabel = 'Electric Vehicle';
      } else if (commuteType === 'transit') {
        typeLabel = 'Public Transit';
      }

      calculatedCarbon = val * coeff;
      if (!defaultTitle) {
        defaultTitle = `${typeLabel} commute of ${val} miles`;
      }
    } else if (category === 'diet') {
      const val = parseInt(servings);
      if (isNaN(val) || val <= 0) {
        setError('Please enter a valid positive number of servings.');
        return;
      }
      computedValue = val;

      const coeff = CarbonMath.calculateDietEmissions(dietType);
      let typeLabel = 'Beef Combo';
      if (dietType === 'chicken') {
        typeLabel = 'Poultry/Fish';
      } else if (dietType === 'veggie') {
        typeLabel = 'Vegetarian Meal';
      } else if (dietType === 'vegan') {
        typeLabel = 'Vegan Meal';
      }

      calculatedCarbon = val * coeff;
      if (!defaultTitle) {
        defaultTitle = `${val} serving(s) of ${typeLabel}`;
      }
    } else if (category === 'energy') {
      const val = parseFloat(kwh);
      if (isNaN(val) || val <= 0) {
        setError('Please enter a valid positive energy consumption (kWh).');
        return;
      }
      computedValue = val;
      calculatedCarbon = CarbonMath.calculateEnergyEmissions(val);
      if (!defaultTitle) {
        defaultTitle = `Consumed ${val} kWh of grid power`;
      }
    } else if (category === 'waste') {
      const val = parseFloat(wasteKg);
      if (isNaN(val) || val <= 0) {
        setError('Please enter a valid positive waste weight (kg).');
        return;
      }
      computedValue = val;
      calculatedCarbon = val * 1.5; // fallback to generic landfill if type not specified
      if (!defaultTitle) {
        defaultTitle = `Disposed ${val} kg of household waste`;
      }
    }

    // Call Zustand action
    addLog(category, computedValue, calculatedCarbon, isSaving, defaultTitle);

    // Reset inputs
    setTitle('');
    setMiles('');
    setKwh('');
    setWasteKg('');
    setServings('1');
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'transport': return '🚗';
      case 'diet': return '🥗';
      case 'energy': return '🔌';
      case 'waste': return '♻️';
      default: return '📝';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" role="tabpanel" aria-label="Carbon Logger Activity Log">
      
      {/* LEFT FORM COLUMN */}
      <div className="lg:col-span-1">
        <div className="neo-card bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] p-6">
          <h3 className="text-xl font-serif font-bold text-[#2b3a34] uppercase border-b-2 border-[#2b3a34] pb-2 mb-4">
            LOG NEW ACTIVITY
          </h3>

          <form onSubmit={handleLogSubmit} className="flex flex-col gap-4">
            
            {/* Category Select */}
            <div className="form-group">
              <label htmlFor="log-category">Category</label>
              <select
                id="log-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as 'transport' | 'diet' | 'energy' | 'waste');
                  setError('');
                }}
              >
                <option value="transport">Transportation 🚗</option>
                <option value="diet">Diet & Meals 🥗</option>
                <option value="energy">Household Energy 🔌</option>
                <option value="waste">Shopping & Waste ♻️</option>
              </select>
            </div>

            {/* Sub-inputs dependent on category selection */}
            {category === 'transport' && (
              <>
                <div className="form-group">
                  <label htmlFor="log-miles">Distance (Miles)</label>
                  <input
                    id="log-miles"
                    type="number"
                    step="any"
                    placeholder="e.g. 15.5"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="log-commute-type">Commute Mode</label>
                  <select
                    id="log-commute-type"
                    value={commuteType}
                    onChange={(e) => setCommuteType(e.target.value)}
                  >
                    <option value="petrol">Petrol Car (0.411 kg/mi)</option>
                    <option value="electric">Electric Vehicle (EV) (0.12 kg/mi)</option>
                    <option value="transit">Public Train/Bus (0.08 kg/mi)</option>
                  </select>
                </div>
              </>
            )}

            {category === 'diet' && (
              <>
                <div className="form-group">
                  <label htmlFor="log-diet-type">Meal Choice</label>
                  <select
                    id="log-diet-type"
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                  >
                    <option value="beef">Beef Combo (7.2 kg/serving)</option>
                    <option value="chicken">Poultry / Fish (2.4 kg/serving)</option>
                    <option value="veggie">Vegetarian Meal (1.1 kg/serving)</option>
                    <option value="vegan">Vegan Meal (0.5 kg/serving)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="log-servings">Servings</label>
                  <input
                    id="log-servings"
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {category === 'energy' && (
              <div className="form-group">
                <label htmlFor="log-kwh">Power Consumption (kWh)</label>
                <input
                  id="log-kwh"
                  type="number"
                  step="any"
                  placeholder="e.g. 45"
                  value={kwh}
                  onChange={(e) => setKwh(e.target.value)}
                  required
                />
                <span className="text-[10px] text-[#4a6b5d] italic">Grid coefficient: 0.385 kg CO₂e/kWh</span>
              </div>
            )}

            {category === 'waste' && (
              <div className="form-group">
                <label htmlFor="log-waste">Waste Weight (kg)</label>
                <input
                  id="log-waste"
                  type="number"
                  step="any"
                  placeholder="e.g. 2.4"
                  value={wasteKg}
                  onChange={(e) => setWasteKg(e.target.value)}
                  required
                />
                <span className="text-[10px] text-[#4a6b5d] italic">Waste coefficient: 1.5 kg CO₂e/kg (landfill default)</span>
              </div>
            )}

            {/* Custom log title */}
            <div className="form-group">
              <label htmlFor="log-title">Custom Description (Optional)</label>
              <input
                id="log-title"
                type="text"
                placeholder="e.g. Weekly grocery trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Emission vs Saving selector */}
            <div className="flex items-center gap-4 py-2 border-y border-[#f5f3eb]" role="group" aria-label="Action Direction">
              <span className="text-xs font-bold text-[#2b3a34]">TYPE:</span>
              <label className="flex items-center gap-2 text-xs font-bold text-[#c87a53] cursor-pointer">
                <input
                  type="radio"
                  name="log-type"
                  checked={!isSaving}
                  onChange={() => setIsSaving(false)}
                  className="accent-[#c87a53]"
                />
                EMITTED CO₂e
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-[#4a6b5d] cursor-pointer">
                <input
                  type="radio"
                  name="log-type"
                  checked={isSaving}
                  onChange={() => setIsSaving(true)}
                  className="accent-[#4a6b5d]"
                />
                SAVED CO₂e
              </label>
            </div>

            {error && (
              <p className="text-xs text-[#c87a53] font-bold uppercase tracking-wider">{error}</p>
            )}

            <button type="submit" className="primary-btn mt-2 flex items-center justify-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> ADD LOG ENTRY
            </button>

          </form>
        </div>
      </div>

      {/* RIGHT LOGS HISTORY COLUMN */}
      <div className="lg:col-span-2">
        <div className="neo-card bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-2 border-[#2b3a34] pb-2">
            <h3 className="text-xl font-serif font-bold text-[#2b3a34] uppercase">
              ACTIVITY LOG HISTORY
            </h3>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={clearLogs}
                className="secondary-btn border-[#c87a53] text-[#c87a53] text-xs py-1 px-3"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-20 bg-[#f5f3eb] border-2 border-dashed border-[#2b3a34]">
              <p className="text-sm text-[#4a6b5d]">Your activity log is currently empty. Input values on the left to start logging!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2" role="log" aria-label="Activity logs list">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border-2 border-[#2b3a34] bg-[#f5f3eb]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1.5 bg-white border-2 border-[#2b3a34]">
                      {getCategoryEmoji(log.category)}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#2b3a34] leading-snug">{log.title}</h4>
                      <span className="text-[10px] text-[#4a6b5d] uppercase tracking-wider font-bold">
                        {log.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-sm font-mono font-bold ${
                        log.isSaving ? 'text-[#4a6b5d]' : 'text-[#c87a53]'
                      }`}
                    >
                      {log.isSaving ? '-' : '+'}{Math.abs(log.carbon)} kg CO₂e
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteLog(log.id)}
                      aria-label={`Delete log entry ${log.title}`}
                      className="text-[#c87a53] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
export default TrackerTab;
