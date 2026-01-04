import { Check, X } from 'lucide-react';

interface PasswordValidationProps {
  password: string;
  className?: string;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Contains number',
    test: (password) => /\d/.test(password)
  }
];

export const PasswordValidation = ({ password, className = '' }: PasswordValidationProps) => {
  if (!password) return null;

  return (
    <div className={`mt-3 p-3 bg-white/40 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 ${className}`}>
      <p className="text-sm font-medium text-black dark:text-[#F9F5EB] mb-2">
        Password Requirements:
      </p>
      <div className="space-y-1">
        {validationRules.map((rule, index) => {
          const isValid = rule.test(password);
          return (
            <div key={index} className="flex items-center gap-2">
              {isValid ? (
                <Check size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <X size={14} className="text-red-500 dark:text-red-400 flex-shrink-0" />
              )}
              <span className={`text-xs ${
                isValid 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};