import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../theme/themeProvider';

interface AnswerInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}

export function AnswerInput({ value, onChange, disabled }: AnswerInputProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with prop
  useEffect(() => {
    if (value === null) {
      setInputValue('');
    } else {
      setInputValue(String(value));
    }
  }, [value]);

  // Auto-focus when component mounts or becomes enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty input
    if (newValue === '') {
      setInputValue('');
      onChange(null);
      return;
    }

    // Allow only numbers and optional negative sign
    if (!/^-?\d*$/.test(newValue)) {
      return;
    }

    setInputValue(newValue);
    
    // Parse to number if valid
    const parsed = parseInt(newValue, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (newValue === '-') {
      // Allow typing negative sign
      onChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer:</label>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Enter your answer"
          className="w-full px-4 py-3 text-2xl font-bold text-center rounded-lg border-2 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: theme.colors.cardBorder,
            focusRingColor: theme.colors.accent,
          }}
        />
      </div>
    </div>
  );
}