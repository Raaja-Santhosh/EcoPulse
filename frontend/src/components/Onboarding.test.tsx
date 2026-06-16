import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding } from './Onboarding';
import { useEcoPulseStore } from '../store';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock lucide-react to render standard svg/element or simple text
jest.mock('lucide-react', () => ({
  Zap: () => <div data-testid="icon-zap">Zap</div>,
  Car: () => <div data-testid="icon-car">Car</div>,
  Leaf: () => <div data-testid="icon-leaf">Leaf</div>,
  ShoppingBag: () => <div data-testid="icon-shopping-bag">ShoppingBag</div>,
  ChevronRight: () => <span>Next</span>,
  ChevronLeft: () => <span>Back</span>,
}));

describe('Onboarding Component Tests', () => {
  beforeEach(() => {
    useEcoPulseStore.getState().resetAll();
  });

  test('renders onboarding title and the first step question', () => {
    render(<Onboarding />);
    
    // Check main title
    expect(screen.getByText('DISCOVER YOUR CARBON PULSE')).toBeInTheDocument();
    
    // Check first question title and options
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Home Heating & Cooling/i)).toBeInTheDocument();
    expect(screen.getByText(/Electricity \/ Heat Pump/i)).toBeInTheDocument();
    expect(screen.getByText(/Natural Gas/i)).toBeInTheDocument();
    expect(screen.getByText(/Heating Oil \/ Coal/i)).toBeInTheDocument();
  });

  test('selection is disabled by default for the continue button', () => {
    render(<Onboarding />);
    
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  test('selecting an option enables the continue button and changes steps', () => {
    render(<Onboarding />);
    
    const optionBtn = screen.getByRole('radio', { name: /electricity \/ heat pump/i });
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    
    // Select the option
    fireEvent.click(optionBtn);
    expect(continueBtn).not.toBeDisabled();
    
    // Move to next step
    fireEvent.click(continueBtn);
    
    // Step should update to 2
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Commute/i)).toBeInTheDocument();
  });

  test('onboarding completes and saves scores to store', () => {
    render(<Onboarding />);

    // Step 1: Energy
    fireEvent.click(screen.getByRole('radio', { name: /electricity \/ heat pump/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Transport
    fireEvent.click(screen.getByRole('radio', { name: /walk \/ bike/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Diet
    fireEvent.click(screen.getByRole('radio', { name: /vegan \/ plant-based/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4: Waste
    fireEvent.click(screen.getByRole('radio', { name: /zero-waste minded/i }));
    
    // The button text should change to CALCULATE on the last step
    const calculateBtn = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateBtn);

    // Verify Zustand store updated
    const state = useEcoPulseStore.getState();
    expect(state.onboarded).toBe(true);
    expect(state.categoryScores.energy).toBe(1.5);
    expect(state.categoryScores.transport).toBe(0.1);
    expect(state.categoryScores.diet).toBe(1.2);
    expect(state.categoryScores.waste).toBe(0.8);
    expect(state.score).toBe(3.6); // 1.5 + 0.1 + 1.2 + 0.8 = 3.6
  });
});
