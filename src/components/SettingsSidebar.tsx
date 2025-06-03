
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface SettingsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSidebar = ({ open, onOpenChange }: SettingsSidebarProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 bg-cream">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-black">Settings</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black">Account</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Profile Settings</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Notifications</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black">Preferences</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Theme</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Language</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black">Support</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Help Center</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Contact Us</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                <span className="text-black">Privacy Policy</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSidebar;
