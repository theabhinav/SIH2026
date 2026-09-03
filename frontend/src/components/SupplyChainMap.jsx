import React from 'react';
import { ArrowRight, Factory, PackageOpen, Truck, Users, Sprout } from 'lucide-react';

const ICONS = { source: Sprout, produce: Factory, store: PackageOpen, distribute: Truck, customer: Users };

export default function SupplyChainMap({ supplyChain }) {
  const stages = supplyChain?.stages || [];
  if (!stages.length) return null;
  return (
    <div className="overflow-x-auto" data-testid="supply-chain-map">
      <div className="flex items-stretch gap-2 min-w-[720px]">
        {stages.map((s, i) => {
          const Icon = ICONS[s.key] || Sprout;
          return (
            <React.Fragment key={s.key}>
              <div className="flex-1 border border-border bg-background p-4 flex flex-col" data-testid={`chain-stage-${s.key}`}>
                <div className="w-9 h-9 bg-primary text-primary-foreground flex items-center justify-center mb-3">
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Stage {i + 1}</div>
                <div className="font-display font-bold text-primary mt-0.5">{s.title}</div>
                <p className="text-xs text-muted-foreground mt-1 mb-3 leading-snug">{s.detail}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {(s.nodes || []).map((n, j) => (
                    <span key={j} className="border border-border bg-muted/40 px-2 py-1 text-[11px] leading-tight">{n}</span>
                  ))}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="flex items-center text-accent flex-shrink-0">
                  <ArrowRight size={20} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
