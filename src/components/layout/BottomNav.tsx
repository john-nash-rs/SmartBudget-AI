import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, FolderOpen, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/input", label: "Add Budget", icon: PlusCircle, primary: true },
  { to: "/planning", label: "Planning", icon: Compass },
  { to: "/saved", label: "Saved", icon: FolderOpen },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
                item.primary
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 -mt-4 px-6"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", item.primary && "w-6 h-6")} />
              <span className={cn("text-xs font-medium", item.primary && "text-[10px]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
