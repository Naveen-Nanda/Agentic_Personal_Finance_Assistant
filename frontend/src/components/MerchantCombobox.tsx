import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { merchants } from '../data/merchants';

interface MerchantComboboxProps {
  value: string;
  onSelect: (merchant: { name: string; code: string; category: string }) => void;
}

export function MerchantCombobox({ value, onSelect }: MerchantComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [merchantList, setMerchantList] = useState(merchants);

  useEffect(() => {

  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select merchant..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover">
        <Command>
          <CommandInput placeholder="Search merchant..." />
          <CommandList>
            <CommandEmpty>No merchant found.</CommandEmpty>
            <CommandGroup>
              {merchantList.map((merchant) => (
                <CommandItem
                  key={merchant.code}
                  value={merchant.name}
                  onSelect={(currentValue) => {
                    if (currentValue === value) {
                      onSelect({ name: "", code: "", category: "" });
                    } else {
                      onSelect(merchant);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === merchant.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div>{merchant.name}</div>
                    <div className="text-muted-foreground">
                      {merchant.category} • {merchant.code}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
