import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export const ChatHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-4 md:mb-8">
      <div className="flex items-center gap-2 md:gap-3">
        <img 
          src="https://cdn.poehali.dev/files/cea89001-8a3d-474d-9920-28440564650b.png" 
          alt="ИИ кассир" 
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl"
        />
        <div>
          <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ИИ кассир
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Заряжено в <a href="https://ecomkassa.ru" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">ecomkassa.ru</a>
          </p>
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