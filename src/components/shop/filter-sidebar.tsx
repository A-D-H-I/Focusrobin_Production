"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const filters = {
  Gender: ["Men", "Women", "Kids", "Unisex"],
  Shape: ["Aviator", "Wayfarer", "Round", "Cat-Eye", "Navigator"],
  Color: ["Black", "Brown", "Gold", "Silver", "Tortoise"],
  Rim: ["Full Rim", "Semi-Rimless", "Rimless"],
  Material: ["Acetate", "Metal", "Titanium"],
};

const FilterSection = ({ title, options }: { title: string, options: string[] }) => (
  <AccordionItem value={title}>
    <AccordionTrigger className="py-4 text-lg font-semibold hover:no-underline">
      {title}
    </AccordionTrigger>
    <AccordionContent>
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox id={`${title}-${option}`} />
            <Label htmlFor={`${title}-${option}`} className="font-normal text-foreground/80">
              {option}
            </Label>
          </div>
        ))}
      </div>
    </AccordionContent>
  </AccordionItem>
);

export default function FilterSidebar() {
  return (
    <aside className="w-full">
      <Accordion type="multiple" defaultValue={["Gender", "Shape"]} className="w-full">
        {Object.entries(filters).map(([title, options]) => (
          <FilterSection key={title} title={title} options={options} />
        ))}
        <AccordionItem value="Price">
            <AccordionTrigger className="py-4 text-lg font-semibold hover:no-underline">
                Price
            </AccordionTrigger>
            <AccordionContent>
                <div className="p-2">
                    <Slider defaultValue={[150]} max={500} step={10} />
                    <div className="flex justify-between text-foreground/80 mt-2">
                        <span>$0</span>
                        <span>$500</span>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

