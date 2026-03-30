import React, { useState } from 'react'
import { motion } from 'framer-motion'

import { formatTime, moodOptions, rarityStyle, timerPresets } from './gameData'

const MotionDiv = motion.div

function getKindLabel(kind) {
  if (kind === 'weekly') return 'Semanal'
  if (kind === 'monthly') return 'Mensal'
  return 'Única'
}

function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function Card({ className = '', children }) {
  return <div className={cn('rounded-3xl border border-slate-200 bg-white shadow-sm', className)}>{children}</div>
}

export function CardHeader({ className = '', children }) {
  return <div className={cn('p-5 pb-3', className)}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return <h3 className={cn('text-xl font-semibold text-slate-900', className)}>{children}</h3>
}

export function CardContent({ className = '', children }) {
  return <div className={cn('p-5 pt-0', className)}>{children}</div>
}

export function Button({ className = '', variant = 'default', disabled = false, children, ...props }) {
  const styles = variant === 'outline'
    ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
    : variant === 'secondary'
      ? 'bg-white text-slate-900 hover:bg-slate-100'
      : 'bg-slate-900 text-white hover:bg-slate-800'

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn('inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50', styles, className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ className = '', variant = 'default', children }) {
  const styles = variant === 'outline' ? 'border border-slate-300 bg-white text-slate-700' : variant === 'secondary' ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'
  return <span className={cn('inline-flex rounded-xl px-2.5 py-1 text-xs font-medium', styles, className)}>{children}</span>
}

export function Progress({ value }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
    </div>
  )
}

export function Checkbox({ checked, onCheckedChange }) {
  return <input type="checkbox" checked={checked} onChange={() => onCheckedChange(!checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
}

export function ScrollArea({ className = '', children }) {
  return <div className={cn('overflow-auto', className)}>{children}</div>
}

export function Tabs({ defaultValue, children }) {
  const validChildren = React.Children.toArray(children).filter(Boolean)
  const [value, setValue] = useState(defaultValue)
  return <div>{validChildren.map((child) => React.isValidElement(child) ? React.cloneElement(child, { tabValue: value, setTabValue: setValue }) : child)}</div>
}

export function TabsList({ className = '', children, setTabValue, tabValue }) {
  return <div className={cn('grid gap-2', className)}>{React.Children.map(children, (child) => React.isValidElement(child) ? React.cloneElement(child, { setTabValue, tabValue }) : child)}</div>
}

export function TabsTrigger({ value, children, setTabValue, tabValue }) {
  const active = value === tabValue
  return <button type="button" onClick={() => setTabValue(value)} className={cn('rounded-2xl px-3 py-2 text-sm font-medium transition', active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>{children}</button>
}

export function TabsContent({ value, children, tabValue }) {
  if (value !== tabValue) return null
  return <div className="mt-4">{children}</div>
}

export function IconLabel({ emoji, text }) {
  return <span className="inline-flex items-center gap-2">{emoji}<span>{text}</span></span>
}

export function StatCard({ label, value, helper, progress }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-widest text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {typeof progress === 'number' ? <div className="mt-3"><Progress value={progress} /></div> : null}
      {helper ? <p className="mt-2 text-xs text-slate-300">{helper}</p> : null}
    </div>
  )
}

export function MissionRow({ mission, done, onToggle }) {
  return (
    <MotionDiv initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-2xl border p-4 transition', done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white')}>
      <div className="flex items-start gap-3">
        <Checkbox checked={done} onCheckedChange={() => onToggle(mission.id)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{mission.title}</h3>
                {mission.isCustom ? <Badge className="bg-amber-100 text-amber-800">Personalizada</Badge> : null}
                {mission.isCustom ? <Badge variant="outline">{getKindLabel(mission.kind)}</Badge> : null}
                {mission.weekday ? <Badge variant="secondary">{mission.weekday}</Badge> : null}
                {mission.date ? <Badge variant="secondary">{mission.date}</Badge> : null}
              </div>
              <p className="text-sm text-slate-600">{mission.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{mission.time}</Badge>
              <Badge>+{mission.xp} XP</Badge>
              <Badge variant="outline">{mission.category}</Badge>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}

export function ShopItemCard({ item, essence, onRedeem }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="mt-1 text-sm text-slate-500">Custo: {item.cost} Essência</p>
            <div className="mt-2 flex gap-2">
              <Badge className={rarityStyle(item.rarity)}>{item.rarity}</Badge>
              <Badge variant="outline">{item.type}</Badge>
            </div>
          </div>
          <Button disabled={essence < item.cost} onClick={() => onRedeem(item)}>Resgatar</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function TimerPanel(props) {
  const { timerLabel, timerSecondsLeft, timerRunning, timerSoundEnabled, setTimerPreset, setTimerRunning, setTimerSecondsLeft, setTimerSoundEnabled } = props

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>⏱️ Timer da Jornada</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl bg-slate-900 p-6 text-center text-white shadow-inner">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">{timerLabel}</p>
            <div className="mt-3 text-5xl font-bold tabular-nums">{formatTime(timerSecondsLeft)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {timerPresets.map((preset) => <Button key={preset.label} variant="outline" onClick={() => setTimerPreset(preset.minutes, preset.label)}>{preset.minutes} min</Button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="flex-1" onClick={() => setTimerRunning(true)}>Iniciar</Button>
            <Button variant="outline" className="flex-1" onClick={() => setTimerRunning(false)}>Pausar</Button>
            <Button variant="outline" className="flex-1" onClick={() => setTimerSecondsLeft((prev) => Math.max(prev - 60, 0))}>-1 min</Button>
            <Button variant="outline" className="flex-1" onClick={() => setTimerSecondsLeft((prev) => prev + 60)}>+1 min</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Configurações do Timer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-medium">Som do timer</p>
              <p className="text-xs text-slate-500">Toque ao final da missão.</p>
            </div>
            <Button variant={timerSoundEnabled ? 'default' : 'outline'} onClick={() => setTimerSoundEnabled((prev) => !prev)}>{timerSoundEnabled ? 'Ligado' : 'Desligado'}</Button>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Estado</p>
            <p className="mt-1 font-semibold">{timerRunning ? 'Em andamento' : 'Parado'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function HistoryPanel({
  dailyMood,
  setDailyMood,
  saveDailySnapshot,
  achievements,
  history,
  dailyLog,
  setDailyLog,
  copyReport,
  downloadReportPdf,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>🏆 Checkpoint Diário</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600">Humor de hoje</p>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((mood) => <Button key={mood} variant={dailyMood === mood ? 'default' : 'outline'} onClick={() => setDailyMood(mood)}>{mood}</Button>)}
            </div>
          </div>
          <textarea
            value={dailyLog}
            onChange={(e) => setDailyLog(e.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
            placeholder="Anote os principais acontecimentos do dia, sintomas, gatilhos, consultas, reuniões e observações importantes..."
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="w-full" onClick={saveDailySnapshot}>
              Salvar resumo de hoje
            </Button>

            <Button className="w-full" variant="outline" disabled={history.length === 0} onClick={() => copyReport(7)}>
              Copiar 7 dias
            </Button>

            <Button className="w-full" variant="outline" disabled={history.length === 0} onClick={() => copyReport(30)}>
              Copiar 30 dias
            </Button>

            <Button className="w-full" variant="outline" disabled={history.length === 0} onClick={() => downloadReportPdf(30)}>
              Baixar PDF 30 dias
            </Button>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Conquistas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {achievements.length === 0 ? <p className="text-sm text-slate-500">Nenhuma ainda.</p> : achievements.map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Histórico recente</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px] pr-1">
            <div className="space-y-3">
              {history.length === 0 ? <p className="text-sm text-slate-500">Nenhum checkpoint salvo ainda.</p> : history.map((entry) => (
                <div key={entry.date} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.date}</p>
                    <Badge variant="outline">{entry.mood}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-slate-600">
                    <div>XP: <span className="font-semibold text-slate-900">{entry.xp}</span></div>
                    <div>Essência: <span className="font-semibold text-slate-900">{entry.essence}</span></div>
                    <div>Missões: <span className="font-semibold text-slate-900">{entry.completed}</span></div>
                  </div>
                  {entry.notes ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      {entry.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
