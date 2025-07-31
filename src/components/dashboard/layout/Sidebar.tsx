import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  FolderKanban,
  ShoppingCart,
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

const defaultNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", isActive: true },
  { icon: <Home size={20} />, label: "Financeiro" },
  { icon: <FolderKanban size={20} />, label: "Estoque" },
  { icon: <Calendar size={20} />, label: "Produção" },
  { icon: <ShoppingCart size={20} />, label: "Vendas" },
  { icon: <Users size={20} />, label: "Cadastros" },
];

const defaultBottomItems: NavItem[] = [
  { icon: <Settings size={20} />, label: "Settings" },
  { icon: <HelpCircle size={20} />, label: "Help" },
];

const Sidebar = ({
  items = defaultNavItems,
  activeItem = "Home",
  onItemClick = () => {},
}: SidebarProps) => {
  return (
    <div className="w-[280px] h-full bg-factory-900/90 backdrop-blur-md border-r border-tire-700/30 flex flex-col glass-morphism">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-r from-neon-blue to-neon-purple neon-glow"></div>
          Remold Factory
        </h2>
        <p className="text-sm text-tire-400">Sistema de Gestão Financeira</p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {items.map((item) => (
            <Button
              key={item.label}
              variant={"ghost"}
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${item.label === activeItem ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-neon-blue hover:from-neon-blue/30 hover:to-neon-purple/30 neon-glow" : "text-tire-300 hover:bg-tire-800/50 hover:text-white"}`}
              onClick={() => onItemClick(item.label)}
            >
              <span
                className={`${item.label === activeItem ? "text-neon-blue" : "text-tire-400"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-tire-700/50" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-tire-500 uppercase tracking-wider">
            Status
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-tire-300 hover:bg-tire-800/50 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse"></span>
            Ativo
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-tire-300 hover:bg-tire-800/50 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-neon-orange animate-pulse"></span>
            Alta Prioridade
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-tire-300 hover:bg-tire-800/50 hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-neon-blue animate-pulse"></span>
            Em Produção
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-tire-700/30">
        {defaultBottomItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium text-tire-300 hover:bg-tire-800/50 hover:text-white mb-1.5 transition-all duration-200"
            onClick={() => onItemClick(item.label)}
          >
            <span className="text-tire-400">{item.icon}</span>
            {item.label === "Settings" ? "Configurações" : "Ajuda"}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
