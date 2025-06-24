
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (phone: string, countryCode: string) => void;
}

const PhoneInput = ({ value, countryCode, onChange }: PhoneInputProps) => {
  const countryCodes = [
    { code: '+1', label: 'US +1' },
    { code: '+44', label: 'UK +44' },
    { code: '+49', label: 'DE +49' },
    { code: '+33', label: 'FR +33' },
    { code: '+34', label: 'ES +34' },
    { code: '+39', label: 'IT +39' },
    { code: '+81', label: 'JP +81' },
    { code: '+86', label: 'CN +86' },
    { code: '+91', label: 'IN +91' },
    { code: '+61', label: 'AU +61' },
    { code: '+55', label: 'BR +55' },
    { code: '+52', label: 'MX +52' },
    { code: '+27', label: 'ZA +27' },
    { code: '+234', label: 'NG +234' },
  ];

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={(value) => onChange(value, value)}>
        <SelectTrigger className="w-32 bg-white/50 border-white/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value, countryCode)}
          placeholder="(555) 123-4567"
          className="bg-white/50 border-white/20 pl-10"
        />
      </div>
    </div>
  );
};

export default PhoneInput;
