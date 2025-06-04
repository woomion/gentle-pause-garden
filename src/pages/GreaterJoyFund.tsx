
import { useState } from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import EditIntentionModal from '../components/EditIntentionModal';

const GreaterJoyFund = () => {
  const [intention, setIntention] = useState("More peace in my day");
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [reflection, setReflection] = useState("");

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: '#FAF6F1' }}>
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

        {/* Greater Joy Fund Header with more top margin */}
        <div className="mb-8 mt-12">
          <h1 className="text-xl font-medium text-black dark:text-[#F9F5EB] mb-2">
            Your Greater Joy Fund
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A growing reflection of your mindful choices
          </p>
        </div>

        {/* Intention Card - centerpiece with soft rounded styling */}
        <Card className="mb-8 rounded-xl border border-gray-200/60 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-bold text-black dark:text-[#F9F5EB] leading-relaxed">
                {intention}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingIntention(true)}
                className="ml-3 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8"
              >
                <Edit2 size={16} />
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              A place to remember what you're reaching for
            </p>
          </CardContent>
        </Card>

        {/* Pill-style Tabs with proper spacing */}
        <Tabs defaultValue="reflection" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full p-1 h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
            <TabsTrigger 
              value="reflection" 
              className="rounded-full font-medium data-[state=active]:text-black text-gray-600"
            >
              Reflection
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="rounded-full font-medium data-[state=active]:text-black text-gray-600"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reflection" className="mt-0">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB] mb-6">
                Your reason for pausing—in your own words
              </h3>
              
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-4">What are you tending to instead of spending? What feeling are you hoping for? What really matters right now?</p>
              </div>

              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your reflection here. You can keep it short, or let it unfold."
                className="min-h-[100px] rounded-xl border border-gray-200/60 text-black dark:text-[#F9F5EB] resize-none"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
              />

              <Card className="rounded-xl border border-gray-200/60" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-black dark:text-[#F9F5EB] mb-3 text-sm">Prompt ideas:</h4>
                  <ul className="text-sm text-black dark:text-[#F9F5EB] space-y-2">
                    <li>• What am I truly reaching for?</li>
                    <li>• What's behind my purchasing desires?</li>
                    <li>• What do I already have?</li>
                    <li>• What's one way I can give myself peace today?</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB] mb-6">
                Your pause patterns
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-black dark:text-[#F9F5EB] font-medium">
                    You've paused X times this week
                  </p>
                  <p className="text-black dark:text-[#F9F5EB] font-medium">
                    X times this month
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-black dark:text-[#F9F5EB] font-medium">
                    In total, you've let go of $XX.XX
                  </p>
                  <p className="text-black dark:text-[#F9F5EB]">
                    $XX.XX this week
                  </p>
                  <p className="text-black dark:text-[#F9F5EB]">
                    $XX.XX this month
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-black dark:text-[#F9F5EB]">
                    Most of your pauses happen when you feel:{' '}
                    <Badge 
                      className="rounded-full px-3 py-1 text-black font-medium ml-1"
                      style={{ backgroundColor: '#CAB6F7' }}
                    >
                      overwhelmed
                    </Badge>
                    {' '}(that's helpful to notice!)
                  </p>
                </div>

                <div className="pt-6 text-center">
                  <p className="text-black dark:text-[#F9F5EB] font-medium text-base leading-relaxed">
                    You're noticing. You're pausing. You're choosing.
                  </p>
                </div>
              </div>
            </div>
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
