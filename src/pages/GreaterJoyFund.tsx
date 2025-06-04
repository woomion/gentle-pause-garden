
import { useState } from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditIntentionModal from '../components/EditIntentionModal';

const GreaterJoyFund = () => {
  const [intention, setIntention] = useState("More peace in my day");
  const [isEditingIntention, setIsEditingIntention] = useState(false);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header with back button */}
        <header className="relative mb-8">
          <Link 
            to="/"
            className="absolute left-0 top-6 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          
          <div className="text-center">
            <Link 
              to="/"
              className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide mb-2 hover:text-taupe transition-colors"
            >
              POCKET || PAUSE
            </Link>
          </div>
        </header>

        {/* Greater Joy Fund Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-black dark:text-[#F9F5EB] mb-2">
            Your Greater Joy Fund
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A growing reflection of your mindful choices
          </p>
        </div>

        {/* Editable Intention Section */}
        <Card className="mb-8 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
                {intention}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingIntention(true)}
                className="ml-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB]"
              >
                <Edit2 size={16} />
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              A place to remember what you're reaching for
            </p>
          </CardContent>
        </Card>

        {/* Tabs for Reflection and Stats */}
        <Tabs defaultValue="reflection" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/40 dark:bg-white/5">
            <TabsTrigger 
              value="reflection" 
              className="data-[state=active]:bg-[#C8B6E2] data-[state=active]:text-black text-black dark:text-[#F9F5EB]"
            >
              Reflection
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-[#C8B6E2] data-[state=active]:text-black text-black dark:text-[#F9F5EB]"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reflection">
            <Card className="bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB] mb-4">
                  Your reason for pausing—in your own words
                </h3>
                
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  <p className="mb-2">✏️ What are you tending to instead of spending? What feeling are you hoping for? What really matters right now?</p>
                </div>

                <p className="text-black dark:text-[#F9F5EB] mb-6">
                  Write your reflection here. You can keep it short, or let it unfold.
                </p>

                <div className="bg-white/40 dark:bg-white/5 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-black dark:text-[#F9F5EB] mb-2">Prompt ideas:</h4>
                  <ul className="text-sm text-black dark:text-[#F9F5EB] space-y-1">
                    <li>• What am I truly reaching for?</li>
                    <li>• What's behind my purchasing desires?</li>
                    <li>• What do I already have?</li>
                    <li>• What's one way I can give myself peace today?</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-black dark:text-[#F9F5EB] font-medium mb-2">
                      You've paused X times this week
                    </p>
                    <p className="text-black dark:text-[#F9F5EB] font-medium">
                      X times this month
                    </p>
                  </div>

                  <div>
                    <p className="text-black dark:text-[#F9F5EB] font-medium mb-2">
                      In total, you've let go of $XX.XX
                    </p>
                    <p className="text-black dark:text-[#F9F5EB]">
                      $XX.XX this week
                    </p>
                    <p className="text-black dark:text-[#F9F5EB]">
                      $XX.XX this month
                    </p>
                  </div>

                  <div>
                    <p className="text-black dark:text-[#F9F5EB] mb-2">
                      Most of your pauses happen when you feel: <span className="font-medium">overwhelmed</span> (that's helpful to notice!)
                    </p>
                  </div>

                  <div className="pt-4">
                    <p className="text-black dark:text-[#F9F5EB] font-medium">
                      You're noticing. You're pausing. You're choosing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-16 text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
          <p>|| Pocket Pause—your conscious spending companion</p>
        </div>
      </div>

      {/* Edit Intention Modal */}
      {isEditingIntention && (
        <EditIntentionModal
          intention={intention}
          onSave={setIntention}
          onClose={() => setIsEditingIntention(false)}
        />
      )}
    </div>
  );
};

export default GreaterJoyFund;
