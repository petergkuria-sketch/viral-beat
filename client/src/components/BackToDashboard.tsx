import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function BackToDashboard() {
  const [, setLocation] = useLocation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocation('/')}
      className="mb-4"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Dashboard
    </Button>
  );
}
