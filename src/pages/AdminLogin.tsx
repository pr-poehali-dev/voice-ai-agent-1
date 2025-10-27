import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

export const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/9e5db515-a0fc-4981-9d4f-6f4fd56861b2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Вход выполнен');
        navigate('/admin');
      } else {
        toast.error('Неверный пароль');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
            <Icon name="Lock" size={32} className="text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="text-sm text-muted-foreground mt-1">Статистика обратной связи</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password}
          >
            {loading ? 'Проверка...' : 'Войти'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;