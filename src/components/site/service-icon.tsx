import {
  Code2,
  Database,
  Megaphone,
  Magnet,
  PenTool,
  ScanLine,
  Search,
  Smartphone,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Code2,
  Database,
  Megaphone,
  Magnet,
  PenTool,
  ScanLine,
  Search,
  Smartphone,
  Sparkles,
  Target,
};

export function ServiceIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && map[name]) || Code2;
  return <Icon className={className} aria-hidden />;
}
