import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Slider } from '@/components/ui/slider';

type GameState = 'menu' | 'playing' | 'leaderboard' | 'settings';

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  speed: number;
}

interface Player {
  x: number;
  y: number;
  health: number;
  ammo: number;
}

interface Score {
  name: string;
  score: number;
  date: string;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [player, setPlayer] = useState<Player>({ x: 400, y: 500, health: 100, ammo: 30 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [leaderboard, setLeaderboard] = useState<Score[]>([
    { name: "Снайпер", score: 1250, date: "2025-10-15" },
    { name: "Боец", score: 980, date: "2025-10-14" },
    { name: "Новичок", score: 750, date: "2025-10-13" }
  ]);
  const [volume, setVolume] = useState([75]);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();

  useEffect(() => {
    if (gameState === 'playing') {
      startGame();
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setPlayer({ x: 400, y: 500, health: 100, ammo: 30 });
    setEnemies([]);
    spawnEnemy();
  };

  const spawnEnemy = () => {
    const newEnemy: Enemy = {
      id: Date.now(),
      x: Math.random() * 750 + 25,
      y: -50,
      health: difficulty === 'easy' ? 50 : difficulty === 'normal' ? 100 : 150,
      speed: difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3
    };
    setEnemies(prev => [...prev, newEnemy]);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        spawnEnemy();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [gameState, difficulty]);

  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        setEnemies(prev => {
          const updated = prev.map(enemy => ({
            ...enemy,
            y: enemy.y + enemy.speed
          })).filter(enemy => {
            if (enemy.y > 600) {
              setPlayer(p => ({ ...p, health: p.health - 10 }));
              return false;
            }
            return enemy.health > 0;
          });
          return updated;
        });

        if (player.health <= 0) {
          setGameState('menu');
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, player.health]);

  const handleShoot = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (player.ammo <= 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setPlayer(p => ({ ...p, ammo: p.ammo - 1 }));

    setEnemies(prev => prev.map(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.x - clickX, 2) + Math.pow(enemy.y - clickY, 2)
      );
      if (distance < 30) {
        const newHealth = enemy.health - 50;
        if (newHealth <= 0) {
          setScore(s => s + 100);
        }
        return { ...enemy, health: newHealth };
      }
      return enemy;
    }));

    setTimeout(() => {
      setPlayer(p => ({ ...p, ammo: Math.min(p.ammo + 1, 30) }));
    }, 500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 800, 600);

    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#2C2C2C');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    enemies.forEach(enemy => {
      if (enemy.health > 0) {
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF0000';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00FF00';
        ctx.fillRect(enemy.x - 20, enemy.y - 35, (enemy.health / (difficulty === 'easy' ? 50 : difficulty === 'normal' ? 100 : 150)) * 40, 4);
      }
    });

    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFD700';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 35, mousePos.y);
    ctx.lineTo(mousePos.x + 35, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 35);
    ctx.lineTo(mousePos.x, mousePos.y + 35);
    ctx.stroke();
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-['Roboto']">
      {gameState === 'menu' && (
        <div className="flex items-center justify-center min-h-screen p-8">
          <Card className="p-12 bg-card border-border max-w-2xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-7xl font-bold mb-4 font-['Rajdhani'] tracking-wider text-primary">
                SHOOTER GAME
              </h1>
              <p className="text-muted-foreground text-lg font-['Rajdhani']">
                Одиночная кампания с сюжетом и уровнями
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setGameState('playing')}
                className="w-full h-16 text-2xl font-['Rajdhani'] font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Icon name="Crosshair" size={28} className="mr-3" />
                START
              </Button>

              <Button
                onClick={() => setGameState('leaderboard')}
                className="w-full h-16 text-2xl font-['Rajdhani'] font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                <Icon name="Trophy" size={28} className="mr-3" />
                LEADERBOARD
              </Button>

              <Button
                onClick={() => setGameState('settings')}
                className="w-full h-16 text-2xl font-['Rajdhani'] font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                <Icon name="Settings" size={28} className="mr-3" />
                SETTINGS
              </Button>
            </div>
          </Card>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6">
          <div className="flex justify-between w-[800px] mb-4">
            <div className="flex gap-6 font-['Rajdhani'] text-xl">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={24} className="text-primary" />
                <span className="font-bold">{player.health}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Zap" size={24} className="text-accent" />
                <span className="font-bold">{player.ammo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Target" size={24} className="text-accent" />
                <span className="font-bold">{score}</span>
              </div>
            </div>
            <Button
              onClick={() => setGameState('menu')}
              variant="destructive"
              className="font-['Rajdhani'] font-bold"
            >
              <Icon name="X" size={20} className="mr-2" />
              ВЫХОД
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleShoot}
            onMouseMove={handleMouseMove}
            className="border-4 border-border cursor-crosshair bg-black"
          />
        </div>
      )}

      {gameState === 'leaderboard' && (
        <div className="flex items-center justify-center min-h-screen p-8">
          <Card className="p-12 bg-card border-border max-w-2xl w-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-5xl font-bold font-['Rajdhani'] text-accent">
                <Icon name="Trophy" size={48} className="inline mr-4" />
                LEADERBOARD
              </h2>
              <Button onClick={() => setGameState('menu')} variant="outline" className="font-['Rajdhani']">
                <Icon name="ArrowLeft" size={20} className="mr-2" />
                НАЗАД
              </Button>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted rounded border border-border"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold font-['Rajdhani'] text-accent w-12">
                      #{index + 1}
                    </span>
                    <span className="text-xl font-['Rajdhani'] font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-['Rajdhani'] text-primary">
                      {entry.score}
                    </div>
                    <div className="text-sm text-muted-foreground">{entry.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {gameState === 'settings' && (
        <div className="flex items-center justify-center min-h-screen p-8">
          <Card className="p-12 bg-card border-border max-w-2xl w-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-5xl font-bold font-['Rajdhani']">
                <Icon name="Settings" size={48} className="inline mr-4" />
                SETTINGS
              </h2>
              <Button onClick={() => setGameState('menu')} variant="outline" className="font-['Rajdhani']">
                <Icon name="ArrowLeft" size={20} className="mr-2" />
                НАЗАД
              </Button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-xl font-['Rajdhani'] font-bold mb-4 block">
                  <Icon name="Volume2" size={24} className="inline mr-2" />
                  Громкость: {volume[0]}%
                </label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xl font-['Rajdhani'] font-bold mb-4 block">
                  <Icon name="Gauge" size={24} className="inline mr-2" />
                  Сложность
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => setDifficulty('easy')}
                    variant={difficulty === 'easy' ? 'default' : 'outline'}
                    className="font-['Rajdhani'] font-bold"
                  >
                    ЛЕГКО
                  </Button>
                  <Button
                    onClick={() => setDifficulty('normal')}
                    variant={difficulty === 'normal' ? 'default' : 'outline'}
                    className="font-['Rajdhani'] font-bold"
                  >
                    НОРМАЛЬНО
                  </Button>
                  <Button
                    onClick={() => setDifficulty('hard')}
                    variant={difficulty === 'hard' ? 'default' : 'outline'}
                    className="font-['Rajdhani'] font-bold"
                  >
                    СЛОЖНО
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
