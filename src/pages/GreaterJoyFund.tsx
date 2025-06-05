
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntentionSection from '../components/IntentionSection';
import ReflectionTab from '../components/ReflectionTab';
import StatsTab from '../components/StatsTab';

const GreaterJoyFund = () => {
  const [intention, setIntention] = useState('');

  const handleSaveIntention = (newIntention: string) => {
    setIntention(newIntention);
    localStorage.setItem('greaterJoyIntention', newIntention);
  };

  // Load intention on component mount
  useEffect(() => {
    const savedIntention = localStorage.getItem('greaterJoyIntention');
    if (savedIntention) {
      setIntention(savedIntention);
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center mb-6">
          <Link to="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-taupe dark:text-cream" />
          </Link>
          <h1 className="text-lg font-medium text-taupe dark:text-cream">Back to Home</h1>
        </div>

        <IntentionSection intention={intention} onSave={handleSaveIntention} />

        <Tabs defaultValue="reflection" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/60 dark:bg-white/10">
            <TabsTrigger value="reflection">Reflection</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reflection">
            <ReflectionTab />
          </TabsContent>
          
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GreaterJoyFund;
