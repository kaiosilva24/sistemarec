import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell, Home, Search, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../ui/language-switcher";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
  notifications?: Array<{ id: string; title: string }>;
}

const TopNavigation = ({
  onSearch = () => {},
  notifications = [
    { id: "1", title: "New project assigned" },
    { id: "2", title: "Meeting reminder" },
  ],
}: TopNavigationProps) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="w-full h-16 border-b border-tire-700/30 bg-factory-900/90 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 z-50 shadow-lg glass-morphism">
      <div className="flex items-center gap-4 flex-1">
        <Link
          to="/dashboard"
          className="text-neon-blue hover:text-tire-300 transition-colors"
        >
          <Home className="h-5 w-5" />
        </Link>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
          <Input
            placeholder={t("topNav.searchProjects", "Buscar projetos...")}
            className="pl-9 h-10 rounded-full bg-factory-800/50 border border-tire-600/30 text-sm text-white placeholder:text-tire-400 focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 focus-visible:ring-neon-blue/50 focus-visible:ring-offset-0 glass-morphism"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full h-9 w-9 bg-factory-800/50 hover:bg-tire-700/50 transition-colors glass-morphism"
                    >
                      <Bell className="h-4 w-4 text-tire-300" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium border border-factory-700 pulse-glow">
                          {notifications.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl overflow-hidden p-2 border border-tire-600/30 shadow-lg bg-factory-800/95 backdrop-blur-md"
                  >
                    <DropdownMenuLabel className="text-sm font-medium text-tire-200 px-2">
                      {t("topNav.notifications", "Notificações")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-tire-700/50" />
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="rounded-lg text-sm py-2 focus:bg-tire-700/50 text-tire-300 hover:text-white"
                      >
                        {t(
                          `topNav.${notification.id === "1" ? "newProjectAssigned" : "meetingReminder"}`,
                          notification.title,
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-factory-800 text-tire-200 text-xs px-3 py-1.5 border border-tire-600/30">
              <p>{t("topNav.notifications", "Notificações")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 hover:cursor-pointer ring-2 ring-neon-blue/30 hover:ring-neon-blue/60 transition-all">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.email || ""}
              />
              <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold">
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border border-tire-600/30 shadow-lg bg-factory-800/95 backdrop-blur-md"
          >
            <DropdownMenuLabel className="text-xs text-tire-400">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-tire-700/50" />
            <DropdownMenuItem className="cursor-pointer text-tire-300 hover:text-white hover:bg-tire-700/50">
              <User className="mr-2 h-4 w-4" />
              {t("topNav.profile", "Perfil")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-tire-300 hover:text-white hover:bg-tire-700/50">
              <Settings className="mr-2 h-4 w-4" />
              {t("topNav.settings", "Configurações")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-tire-700/50" />
            <DropdownMenuItem
              className="cursor-pointer text-tire-300 hover:text-white hover:bg-tire-700/50"
              onSelect={() => signOut()}
            >
              {t("topNav.logout", "Sair")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavigation;
