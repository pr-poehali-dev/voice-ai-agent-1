import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export const ChatHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-8 pt-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Icon name="Sparkles" size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Receipt Agent
          </h1>
          <p className="text-sm text-muted-foreground">Екомкасса ИИ-помощник</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/history')}>
          <Icon name="History" size={20} />
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/settings')}>
          <Icon name="Settings" size={20} />
        </Button>
      </div>
    </header>
  );
};