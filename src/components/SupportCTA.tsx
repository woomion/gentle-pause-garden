
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SupportCTA = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="text-center mb-6">
        <button 
          onClick={() => setShowDialog(true)}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#CAB6F7] dark:hover:text-[#CAB6F7] transition-colors underline decoration-dotted underline-offset-4"
        >
          Support the Pause →
        </button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md mx-4 rounded-lg bg-[#FAF6F1] dark:bg-[#200E3B] border border-gray-200 dark:border-gray-600" hideCloseButton>
          <DialogHeader className="text-center space-y-4 pt-2">
            <DialogTitle className="text-lg font-medium text-black dark:text-[#F9F5EB]">
              Support the Pause
            </DialogTitle>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                Pocket Pause is built independently — one screen, one decision, one moment at a time.
              </p>
              <p>
                It's ad-free and runs on time, care, and coffee.
              </p>
              <p>
                If it's helped you make clearer choices, and you'd like to support it, you can send a one-time gift:
              </p>
              <div className="bg-white/60 dark:bg-white/10 rounded-lg p-3 text-center">
                <p className="font-medium text-black dark:text-[#F9F5EB]">
                  Venmo: @woomi
                </p>
              </div>
              <p className="text-xs">
                Every bit helps keep this simple, useful, and growing.
              </p>
            </div>
            <button
              onClick={() => setShowDialog(false)}
              className="w-full py-2 mt-6 bg-[#CAB6F7] hover:bg-[#B8A3F5] text-black font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupportCTA;
