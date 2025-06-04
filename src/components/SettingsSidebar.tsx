
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSidebar = ({ open, onOpenChange }: SettingsSidebarProps) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-sm mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-semibold text-black dark:text-[#F9F5EB]">Settings & Info</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-6 pb-12 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* About Pocket Pause */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">About Pocket Pause</h3>
            <div className="space-y-2">
              <Link 
                to="/about"
                onClick={() => onOpenChange(false)}
                className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors block"
              >
                <span className="text-black dark:text-[#F9F5EB]">About Pocket Pause</span>
              </Link>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Legal</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors">
                <span className="text-black dark:text-[#F9F5EB]">Privacy Policy</span>
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Appearance</h3>
            <div className="bg-white/60 dark:bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-black dark:text-[#F9F5EB] font-medium">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Switch between light and dark themes</p>
                </div>
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={toggleTheme}
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Account</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors">
                <span className="text-black dark:text-[#F9F5EB]">Sign In / Sync Settings</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Sync your data across devices</p>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Pause Notifications</h3>
            <div className="bg-white/60 dark:bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-black dark:text-[#F9F5EB] font-medium">Gentle Reminders</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">We'll remind you when an item's ready for a thoughtful decision — no pressure.</p>
                </div>
                <Switch 
                  checked={remindersEnabled} 
                  onCheckedChange={setRemindersEnabled}
                  className="ml-4"
                />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SettingsSidebar;
