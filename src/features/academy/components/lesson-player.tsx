import { Captions, Maximize2, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Slider } from '@/shared/ui/slider';

import { clock } from '../lib/format';

const SPEEDS = ['0.75', '1', '1.25', '1.5', '2'];

/**
 * Video player stand-in: no media file, but real controls. Playback is a
 * timer, so the transcript and notes can follow the current position.
 */
export function LessonPlayer({
  title,
  color,
  durationSec,
  position,
  onPositionChange,
  caption,
}: {
  title: string;
  color: string;
  durationSec: number;
  position: number;
  onPositionChange: (sec: number) => void;
  caption?: string;
}) {
  const { t } = useTranslation('academy');
  const [playRequested, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');
  const [captions, setCaptions] = useState(true);
  const ended = position >= durationSec;
  // Playback stops by itself at the end; no effect needed to sync it.
  const playing = playRequested && !ended;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      onPositionChange(Math.min(durationSec, position + Number(speed)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, position, speed, durationSec, onPositionChange]);

  return (
    <div className="overflow-hidden rounded-xl border bg-overlay text-overlay-foreground shadow-sm">
      <div
        className="relative flex aspect-video items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, color-mix(in srgb, ${color} 45%, transparent), transparent 60%), radial-gradient(ellipse at 80% 90%, color-mix(in srgb, ${color} 25%, transparent), transparent 55%)`,
        }}
      >
        <p className="absolute top-4 left-5 max-w-[70%] truncate text-sm font-medium text-overlay-foreground/80">
          {title}
        </p>
        <button
          type="button"
          onClick={() => (ended ? (onPositionChange(0), setPlaying(true)) : setPlaying((p) => !p))}
          className="flex size-16 items-center justify-center rounded-full bg-overlay-foreground/15 backdrop-blur transition hover:scale-105 hover:bg-overlay-foreground/25 focus-visible:ring-2 focus-visible:ring-overlay-foreground/60 focus-visible:outline-none"
          aria-label={playing ? t('lesson.player.pause') : t('lesson.player.play')}
        >
          {ended ? (
            <RotateCcw className="size-7" />
          ) : playing ? (
            <Pause className="size-7" />
          ) : (
            <Play className="ml-1 size-7" />
          )}
        </button>
        {captions && caption && (
          <p className="absolute inset-x-8 bottom-5 mx-auto w-fit max-w-2xl rounded-md bg-overlay/60 px-3 py-1.5 text-center text-sm leading-relaxed">
            {caption}
          </p>
        )}
      </div>
      <div className="space-y-2 px-4 pt-3 pb-3">
        <Slider
          value={[position]}
          max={durationSec}
          step={1}
          onValueChange={([value]) => onPositionChange(value ?? 0)}
          aria-label={t('lesson.player.seek')}
          className="[&_[data-slot=slider-range]]:bg-overlay-foreground [&_[data-slot=slider-track]]:bg-overlay-foreground/20"
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-overlay-foreground hover:bg-overlay-foreground/10 hover:text-overlay-foreground"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? t('lesson.player.pause') : t('lesson.player.play')}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-overlay-foreground hover:bg-overlay-foreground/10 hover:text-overlay-foreground"
            aria-label={t('lesson.player.volume')}
          >
            <Volume2 />
          </Button>
          <span className="ml-1 text-xs text-overlay-foreground/70 tabular-nums">
            {clock(position)} / {clock(durationSec)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger
                size="sm"
                className="h-7 w-auto border-overlay-foreground/20 bg-transparent text-xs text-overlay-foreground dark:bg-transparent [&_svg]:text-overlay-foreground/70"
                aria-label={t('lesson.player.speed')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEEDS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}×
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                'text-overlay-foreground hover:bg-overlay-foreground/10 hover:text-overlay-foreground',
                !captions && 'text-overlay-foreground/50',
              )}
              aria-pressed={captions}
              onClick={() => setCaptions((c) => !c)}
              aria-label={t('lesson.player.captions')}
            >
              <Captions />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-overlay-foreground hover:bg-overlay-foreground/10 hover:text-overlay-foreground"
              aria-label={t('lesson.player.fullscreen')}
            >
              <Maximize2 />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
