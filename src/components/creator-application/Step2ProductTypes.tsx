import { Label } from '@/components/ui/label';
import { CreatorApplicationFormData, PRODUCT_TYPE_OPTIONS } from './types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step2Props {
  formData: CreatorApplicationFormData;
  updateFormData: (updates: Partial<CreatorApplicationFormData>) => void;
}

export default function Step2ProductTypes({ formData, updateFormData }: Step2Props) {
  const toggleProductType = (type: string) => {
    const current = formData.productTypes;
    if (current.includes(type)) {
      updateFormData({ productTypes: current.filter(t => t !== type) });
    } else {
      updateFormData({ productTypes: [...current, type] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">What are you here to sell?</h3>
        <p className="text-sm text-muted-foreground">
          Select all the types of products you plan to create and sell.
        </p>
      </div>

      <div>
        <Label className="mb-3 block">Product Types *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRODUCT_TYPE_OPTIONS.map((option) => {
            const isSelected = formData.productTypes.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleProductType(option.value)}
                className={cn(
                  'relative flex items-center justify-center p-4 rounded-lg border-2 transition-all text-sm font-medium',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                )}
              >
                {isSelected && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
                {option.label}
              </button>
            );
          })}
        </div>

        {formData.productTypes.length === 0 && (
          <p className="text-xs text-destructive mt-3">
            Please select at least one product type
          </p>
        )}

        {formData.productTypes.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {formData.productTypes.length} selected
          </p>
        )}
      </div>
    </div>
  );
}
