import { useState } from "react";
import { effects, categories, type EffectCategory } from "@/lib/arEffects";
import { Button } from "@/components/ui/button";

interface EffectSelectorProps {
  activeEffect: string;
  onSelect: (id: string) => void;
}

export function EffectSelector({ activeEffect, onSelect }: EffectSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<EffectCategory>("none");

  const filtered = activeCategory === "none"
    ? [effects[0]]
    : effects.filter(e => e.category === activeCategory);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Category tabs */}
      <div className="flex gap-1.5">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "effectActive" : "effect"}
            size="sm"
            onClick={() => {
              setActiveCategory(cat.id);
              if (cat.id === "none") onSelect("none");
            }}
            className="text-xs px-3 py-1.5"
          >
            <span className="mr-1">{cat.emoji}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Effect items */}
      {activeCategory !== "none" && (
        <div className="flex gap-1.5">
          {filtered.map(effect => (
            <Button
              key={effect.id}
              variant={activeEffect === effect.id ? "effectActive" : "effect"}
              size="sm"
              onClick={() => onSelect(effect.id)}
              className="text-lg px-3 py-1.5"
              title={effect.name}
            >
              {effect.emoji}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
