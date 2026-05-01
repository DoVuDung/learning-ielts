import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: Readonly<ComingSoonProps>) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 border border-primary/20">
          <Icon className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Sắp ra mắt
        </span>
      </div>
    </div>
  );
}
