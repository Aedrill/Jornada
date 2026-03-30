import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import {
  STORAGE_KEY,
  DEFAULT_TIMER_SECONDS,
  normalMissions,
  tpmMissions,
  rewardShop,
  avatarClasses,
  defaultAvatar,
  defaultMonthlyGoal,
  getLevel,
} from './gameData'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HistoryPanel,
  IconLabel,
  MissionRow,
  Progress,
  ScrollArea,
  ShopItemCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TimerPanel,
} from './ui'

const MotionDiv = motion.div
const emptyMissionForm = {
  id: '',
  title: '',
  description: '',
  xp: 5,
  category: 'trabalho',
  kind: 'single',
  date: '',
  weekday: '',
  time: '',
}

const emptyGoalForm = {
  id: '',
  title: '',
  target: 1,
  progress: 0,
  rewardEssence: 50,
  rewardName: '',
  category: 'trabalho',
}

const avatarVisualMap = {
  base: '🧍',
  outfits: {
    'Traje Inicial': '🧍',
    '🧥 Traje de Exploradora': '🤠',
    '✨ Traje da Heroína': '🦸‍♀️',
  },
  accessories: {
    'Pingente Simples': '',
    '👑 Coroa de Estrelas': '👑',
  },
  pets: {
    'Sem companheiro': '',
    '🦊 Raposinha Lunar': '🦊',
    '🦉 Corujinha Guardiã': '🦉',
  },
}

export default function App() {
  const [mode, setMode] = useState('normal')
  const [checked, setChecked] = useState({})
  const [customMissions, setCustomMissions] = useState([])
  const [missionForm, setMissionForm] = useState(emptyMissionForm)
  const [customGoals, setCustomGoals] = useState([])
  const [goalForm, setGoalForm] = useState(emptyGoalForm)
  const [essence, setEssence] = useState(0)
  const [inventory, setInventory] = useState([])
  const [avatar, setAvatar] = useState(defaultAvatar)
  const [monthlyGoal, setMonthlyGoal] = useState(defaultMonthlyGoal)
  const [eventText, setEventText] = useState('Sua jornada está pronta para começar.')
  const [levelUpMessage, setLevelUpMessage] = useState('')
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(DEFAULT_TIMER_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerLabel, setTimerLabel] = useState('Foco Profundo')
  const [timerSoundEnabled, setTimerSoundEnabled] = useState(true)
  const [dailyMood, setDailyMood] = useState('estável')
  const [dailyLog, setDailyLog] = useState('')
  const [history, setHistory] = useState([])
  const [achievements, setAchievements] = useState([])
  const previousLevelRef = useRef(1)
  const hydratedRef = useRef(false)

  const baseMissions = mode === 'normal' ? normalMissions : tpmMissions
  const missions = useMemo(() => [...baseMissions, ...customMissions], [baseMissions, customMissions])
  const totalXp = useMemo(() => missions.filter((mission) => checked[mission.id]).reduce((sum, mission) => sum + mission.xp, 0), [missions, checked])
  const levelInfo = getLevel(totalXp)
  const xpProgress = levelInfo.level >= 20 ? 100 : ((totalXp % 100) / 100) * 100
  const goalProgress = Math.min((monthlyGoal.progress / monthlyGoal.target) * 100, 100)

  const stats = useMemo(() => {
    const base = { mente: 0, corpo: 0, ambiente: 0, trabalho: 0 }
    missions.forEach((mission) => {
      if (checked[mission.id]) base[mission.category] += mission.xp
    })
    return base
  }, [missions, checked])

  const readyGoalsCount = useMemo(
    () => customGoals.filter((goal) => goal.progress >= goal.target).length,
    [customGoals],
  )
  const avatarVisual = useMemo(() => ({
    base: avatarVisualMap.outfits[avatar.outfit] || avatarVisualMap.base,
    accessory: avatarVisualMap.accessories[avatar.accessory] || '',
    pet: avatarVisualMap.pets[avatar.pet] || '',
  }), [avatar.accessory, avatar.outfit, avatar.pet])
  const equippableInventory = useMemo(() => {
    return inventory
      .map((entry) => {
        const cleanName = entry.replace(/\s\[(.*?)\]$/, '')
        return rewardShop.find((item) => item.name === cleanName)
      })
      .filter((item) => item && ['roupa', 'acessorio', 'pet'].includes(item.type))
  }, [inventory])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        hydratedRef.current = true
        return
      }

      const parsed = JSON.parse(raw)
      setMode(parsed.mode ?? 'normal')
      setChecked(parsed.checked ?? {})
      setCustomMissions(parsed.customMissions ?? [])
      setCustomGoals(parsed.customGoals ?? [])
      setEssence(parsed.essence ?? 0)
      setInventory(parsed.inventory ?? [])
      setAvatar(parsed.avatar ?? defaultAvatar)
      setMonthlyGoal(parsed.monthlyGoal ?? defaultMonthlyGoal)
      setEventText(parsed.eventText ?? 'Seu progresso foi restaurado com sucesso.')
      setTimerSecondsLeft(parsed.timerSecondsLeft ?? DEFAULT_TIMER_SECONDS)
      setTimerLabel(parsed.timerLabel ?? 'Foco Profundo')
      setTimerSoundEnabled(parsed.timerSoundEnabled ?? true)
      setDailyMood(parsed.dailyMood ?? 'estável')
      setDailyLog(parsed.dailyLog ?? '')
      setHistory(parsed.history ?? [])
      setAchievements(parsed.achievements ?? [])
    } catch (error) {
      console.error('Falha ao carregar progresso salvo', error)
    } finally {
      hydratedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode,
        checked,
        customMissions,
        customGoals,
        essence,
        inventory,
        avatar,
        monthlyGoal,
        eventText,
        timerSecondsLeft,
        timerLabel,
        timerSoundEnabled,
        dailyMood,
        dailyLog,
        history,
        achievements,
      }))
    } catch (error) {
      console.error('Falha ao salvar progresso', error)
    }
  }, [mode, checked, customMissions, customGoals, essence, inventory, avatar, monthlyGoal, eventText, timerSecondsLeft, timerLabel, timerSoundEnabled, dailyMood, dailyLog, history, achievements])

  useEffect(() => {
    const previousLevel = previousLevelRef.current
    if (levelInfo.level <= previousLevel) {
      previousLevelRef.current = levelInfo.level
      return undefined
    }

    const reward = 25 + levelInfo.level * 5
    setEssence((current) => current + reward)
    setInventory((prev) => [...prev, `Título desbloqueado: ${levelInfo.rank}`, `Bônus de level up: ${reward} Essência`])
    setAchievements((prev) => (prev.includes(`Nível ${levelInfo.level}`) ? prev : [...prev, `Nível ${levelInfo.level}`]))
    setLevelUpMessage(`LEVEL UP! Você alcançou o nível ${levelInfo.level} e agora é ${levelInfo.rank}. +${reward} Essência.`)
    setEventText(`Subiu de nível! ${levelInfo.rank} desbloqueado.`)
    previousLevelRef.current = levelInfo.level

    const timeout = window.setTimeout(() => setLevelUpMessage(''), 4200)
    return () => window.clearTimeout(timeout)
  }, [levelInfo.level, levelInfo.rank])

  useEffect(() => {
    if (!timerRunning) return undefined
    if (timerSecondsLeft <= 0) {
      setTimerRunning(false)
      setEventText(`Timer concluído: ${timerLabel}.`)
      if (timerSoundEnabled) playTimerSound()
      return undefined
    }

    const interval = window.setInterval(() => {
      setTimerSecondsLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [timerRunning, timerSecondsLeft, timerLabel, timerSoundEnabled])

  useEffect(() => {
    const completed = Object.values(checked).filter(Boolean).length
    setAchievements((prev) => {
      const next = [...prev]
      if (completed >= 3 && !next.includes('Primeiro Passo')) next.push('Primeiro Passo')
      if (essence >= 300 && !next.includes('Acumuladora de Essência')) next.push('Acumuladora de Essência')
      if (monthlyGoal.progress >= monthlyGoal.target && !next.includes('Meta Mensal Cumprida')) next.push('Meta Mensal Cumprida')
      return next
    })
  }, [checked, essence, monthlyGoal.progress, monthlyGoal.target])

  const toggleMission = (id) => {
    const mission = missions.find((item) => item.id === id)
    if (!mission) return

    setChecked((prev) => {
      const done = !!prev[id]
      if (!done) {
        const gain = Math.max(1, Math.floor(mission.xp / 2))
        setEssence((current) => current + gain)
        setEventText(`Você derrotou a Procrastinação e concluiu ${mission.title}. +${mission.xp} XP, +${gain} Essência.`)
      } else {
        const loss = Math.max(1, Math.floor(mission.xp / 2))
        setEssence((current) => Math.max(0, current - loss))
        setEventText(`Missão revertida: ${mission.title}. O tempo voltou a ficar instável.`)
      }
      return { ...prev, [id]: !done }
    })
  }

  const addCustomMission = () => {
    const title = missionForm.title.trim()
    if (!title) {
      setEventText('Informe um título para criar a missão personalizada.')
      return
    }

    const customMission = {
      ...missionForm,
      id: crypto.randomUUID(),
      title,
      description: missionForm.description.trim(),
      xp: Number(missionForm.xp) || 5,
      time: missionForm.time || '',
      isCustom: true,
    }

    setCustomMissions((prev) => [...prev, customMission])
    setMissionForm(emptyMissionForm)
    setEventText(`Missão personalizada criada: ${customMission.title}.`)
  }

  const removeCustomMission = (id) => {
    const missionToRemove = customMissions.find((mission) => mission.id === id)
    setCustomMissions((prev) => prev.filter((mission) => mission.id !== id))
    setChecked((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (missionToRemove) {
      setEventText(`Missão personalizada removida: ${missionToRemove.title}.`)
    }
  }

  const redeemReward = (item) => {
    if (essence < item.cost) {
      setEventText(`Essência insuficiente para resgatar ${item.name}.`)
      return
    }

    setEssence((current) => current - item.cost)
    setInventory((prev) => [...prev, `${item.name} [${item.rarity}]`])
    setEventText(`Recompensa resgatada: ${item.name}.`)
    if (item.type === 'roupa') setAvatar((prev) => ({ ...prev, outfit: item.name }))
    if (item.type === 'acessorio') setAvatar((prev) => ({ ...prev, accessory: item.name }))
    if (item.type === 'pet') setAvatar((prev) => ({ ...prev, pet: item.name }))
  }

  const equipInventoryItem = (itemName) => {
    const shopItem = rewardShop.find((item) => item.name === itemName || `${item.name} [${item.rarity}]` === itemName)
    if (!shopItem) return

    if (shopItem.type === 'roupa') {
      setAvatar((prev) => ({ ...prev, outfit: shopItem.name }))
      setEventText(`${shopItem.name} equipado(a) no avatar.`)
    }

    if (shopItem.type === 'acessorio') {
      setAvatar((prev) => ({ ...prev, accessory: shopItem.name }))
      setEventText(`${shopItem.name} equipado(a) no avatar.`)
    }

    if (shopItem.type === 'pet') {
      setAvatar((prev) => ({ ...prev, pet: shopItem.name }))
      setEventText(`${shopItem.name} agora acompanha sua jornada.`)
    }
  }

  const unequipAvatarItem = (type) => {
    if (type === 'roupa') {
      setAvatar((prev) => ({ ...prev, outfit: 'Traje Inicial' }))
      setEventText('Roupa removida.')
    }

    if (type === 'acessorio') {
      setAvatar((prev) => ({ ...prev, accessory: 'Pingente Simples' }))
      setEventText('Acessório removido.')
    }

    if (type === 'pet') {
      setAvatar((prev) => ({ ...prev, pet: 'Sem companheiro' }))
      setEventText('Companheiro removido.')
    }
  }

  const addCustomGoal = () => {
    if (!goalForm.title.trim()) {
      setEventText('Informe um título para criar a meta manual.')
      return
    }

    const newGoal = {
      ...goalForm,
      id: crypto.randomUUID(),
      title: goalForm.title.trim(),
      target: Number(goalForm.target) || 1,
      progress: Number(goalForm.progress) || 0,
      rewardEssence: Number(goalForm.rewardEssence) || 0,
      rewardName: goalForm.rewardName.trim(),
    }

    setCustomGoals((prev) => [...prev, newGoal])
    setGoalForm(emptyGoalForm)
    setEventText(`Nova meta criada: ${newGoal.title}.`)
  }

  const updateCustomGoalProgress = (id, amount) => {
    setCustomGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? { ...goal, progress: Math.min(goal.target, goal.progress + amount) }
          : goal,
      ),
    )
  }

  const claimCustomGoalReward = (id) => {
    let claimedGoal = null

    setCustomGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== id) return goal
        if (goal.progress < goal.target) return goal

        claimedGoal = goal
        return { ...goal, progress: 0 }
      }),
    )

    if (!claimedGoal) {
      setEventText('Essa meta ainda não está pronta para resgate.')
      return
    }

    setEssence((current) => current + claimedGoal.rewardEssence)
    setInventory((current) => [...current, `Meta concluída: ${claimedGoal.rewardName || claimedGoal.title}`])
    setEventText(`Meta concluída: ${claimedGoal.title}. +${claimedGoal.rewardEssence} Essência.`)
  }

  const deleteCustomGoal = (id) => {
    const goalToRemove = customGoals.find((goal) => goal.id === id)
    setCustomGoals((prev) => prev.filter((goal) => goal.id !== id))
    if (goalToRemove) {
      setEventText(`Meta removida: ${goalToRemove.title}.`)
    }
  }

  const addMonthlyProgress = (amount) => {
    setMonthlyGoal((prev) => ({ ...prev, progress: Math.min(prev.target, prev.progress + amount) }))
    setEventText(`Meta mensal avançou em +${amount}. Continue farmando dinheiro.`)
  }

  const claimMonthlyReward = () => {
    if (monthlyGoal.progress < monthlyGoal.target) {
      setEventText('A meta mensal ainda não foi concluída.')
      return
    }

    setEssence((current) => current + monthlyGoal.rewardEssence)
    setInventory((prev) => [...prev, `Meta concluída: ${monthlyGoal.rewardName}`])
    setMonthlyGoal((prev) => ({ ...prev, progress: 0 }))
    setEventText(`Meta mensal concluída. Recompensa liberada: ${monthlyGoal.rewardName} +${monthlyGoal.rewardEssence} Essência.`)
  }

  const resetProgress = () => {
    setMode('normal')
    setChecked({})
    setCustomMissions([])
    setMissionForm(emptyMissionForm)
    setCustomGoals([])
    setGoalForm(emptyGoalForm)
    setEssence(0)
    setInventory([])
    setAvatar(defaultAvatar)
    setMonthlyGoal(defaultMonthlyGoal)
    setEventText('Seu progresso foi reiniciado. Uma nova jornada começou.')
    setLevelUpMessage('')
    setTimerSecondsLeft(DEFAULT_TIMER_SECONDS)
    setTimerRunning(false)
    setTimerLabel('Foco Profundo')
    setTimerSoundEnabled(true)
    setDailyMood('estável')
    setDailyLog('')
    setHistory([])
    setAchievements([])
    previousLevelRef.current = 1
    window.localStorage.removeItem(STORAGE_KEY)
  }

  const setTimerPreset = (minutes, label) => {
    setTimerSecondsLeft(minutes * 60)
    setTimerLabel(label)
    setTimerRunning(false)
  }

  const saveDailySnapshot = () => {
    const today = new Date().toLocaleDateString('pt-BR')
    const snapshot = {
      date: today,
      xp: totalXp,
      essence,
      mood: dailyMood,
      completed: Object.values(checked).filter(Boolean).length,
      notes: dailyLog,
    }

    setHistory((prev) => [
      snapshot,
      ...prev.filter((item) => item.date !== today),
    ].slice(0, 365))
    setDailyLog('')
    setEventText(`Resumo diário salvo com humor ${dailyMood}.`)
  }

  const generateReport = (days = 7) => {
    const recent = history.slice(0, days)

    let report = `Relatório dos últimos ${days} dias\n\n`

    recent.forEach((day) => {
      report += `Data: ${day.date}\n`
      report += `Humor: ${day.mood}\n`
      report += `XP: ${day.xp}\n`
      report += `Missões concluídas: ${day.completed}\n`

      if (day.notes) {
        report += `Notas: ${day.notes}\n`
      }

      report += '\n----------------------\n\n'
    })

    return report
  }

  const copyReport = (days) => {
    const report = generateReport(days)
    navigator.clipboard.writeText(report)
      .then(() => {
        setEventText(`Relatório de ${days} dias copiado.`)
      })
      .catch(() => {
        setEventText('Não foi possível copiar o relatório.')
      })
  }

  const downloadReportPdf = (days) => {
    const report = generateReport(days)

    const escaped = report
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Relatório Jornada</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 32px; line-height: 1.5;">
          <h1>Jornada: Relatório de ${days} dias</h1>
          <div>${escaped}</div>
        </body>
      </html>
    `

    const win = window.open('', '_blank')

    if (!win) {
      setEventText('Não foi possível abrir a janela de impressão do PDF.')
      return
    }

    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()

    setEventText(`Relatório de ${days} dias pronto para salvar em PDF.`)
  }

  const dayRating = totalXp >= (mode === 'normal' ? 90 : 60)
    ? 'Em fluxo heróico'
    : totalXp >= (mode === 'normal' ? 60 : 40)
      ? 'Ritmo sólido'
      : totalXp >= 30
        ? 'Progresso consistente'
        : mode === 'tpm'
          ? 'Modo cautela ativado'
          : 'Preparando a aventura'

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-100 via-slate-50 to-indigo-100 p-4 md:p-8">
      {levelUpMessage ? (
        <MotionDiv initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="fixed top-6 left-1/2 z-50 w-[92%] max-w-2xl -translate-x-1/2 rounded-3xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 p-5 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/20 p-3 text-2xl">✨</div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-fuchsia-100">Level Up</p>
              <p className="mt-1 text-lg font-bold">{levelUpMessage}</p>
            </div>
          </div>
        </MotionDiv>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">Jornada: A Vida Adulta</h1>
                  <p className="mt-2 text-sm text-slate-200">Transforme sua rotina em uma aventura possível.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant={mode === 'normal' ? 'secondary' : 'outline'} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setMode('normal')}><IconLabel emoji="☀️" text="Normal" /></Button>
                  <Button variant={mode === 'tpm' ? 'secondary' : 'outline'} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setMode('tpm')}><IconLabel emoji="🌙" text="TPM" /></Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <StatCard label="XP" value={totalXp} progress={xpProgress} />
                <StatCard label="Essência" value={essence} helper="Moeda da jornada" />
                <StatCard label="Nível" value={levelInfo.level} helper={levelInfo.rank} />
                <StatCard label="Status" value={dayRating} helper={`Próximo nível em ${levelInfo.nextXp} XP`} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={resetProgress}>Reiniciar jornada</Button>
                <Badge className="bg-white/15 text-white">Auto-save ativo</Badge>
                <Badge className="bg-white/15 text-white">{customGoals.length} metas manuais</Badge>
                <Badge className="bg-emerald-400/20 text-emerald-100">{readyGoalsCount} prontas para resgate</Badge>
              </div>
            </div>

            <CardContent className="p-6">
              <Tabs defaultValue="missions">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl md:grid-cols-4 xl:grid-cols-7">
                  <TabsTrigger value="missions">Missões</TabsTrigger>
                  <TabsTrigger value="stats">Atributos</TabsTrigger>
                  <TabsTrigger value="shop">Loja</TabsTrigger>
                  <TabsTrigger value="avatar">Avatar</TabsTrigger>
                  <TabsTrigger value="goal">Meta</TabsTrigger>
                  <TabsTrigger value="timer">Timer</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="missions">
                  <Card className="rounded-2xl">
                    <CardHeader><CardTitle>⚔️ Quadro de Missões</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-slate-900">Criar missão manual</p>
                          <p className="text-sm text-slate-500">Adicione compromissos únicos, semanais ou mensais à sua jornada.</p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">Título</span>
                            <input
                              value={missionForm.title}
                              onChange={(event) => setMissionForm((prev) => ({ ...prev, title: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                              placeholder="Ex.: Reunião com Alexandre"
                            />
                          </label>

                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">Descrição</span>
                            <input
                              value={missionForm.description}
                              onChange={(event) => setMissionForm((prev) => ({ ...prev, description: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                              placeholder="Detalhes da missão"
                            />
                          </label>

                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">XP</span>
                            <input
                              type="number"
                              min="1"
                              value={missionForm.xp}
                              onChange={(event) => setMissionForm((prev) => ({ ...prev, xp: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                            />
                          </label>

                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">Categoria</span>
                            <select
                              value={missionForm.category}
                              onChange={(event) => setMissionForm((prev) => ({ ...prev, category: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                            >
                              <option value="trabalho">trabalho</option>
                              <option value="corpo">corpo</option>
                              <option value="mente">mente</option>
                              <option value="ambiente">ambiente</option>
                            </select>
                          </label>

                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">Tipo</span>
                            <select
                              value={missionForm.kind}
                              onChange={(event) => setMissionForm((prev) => ({ ...prev, kind: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                            >
                              <option value="single">single</option>
                              <option value="weekly">weekly</option>
                              <option value="monthly">monthly</option>
                            </select>
                          </label>

                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">Horário</span>
                            <input
                              type="time"
                              value={missionForm.time}
                              onChange={(event) => setMissionForm((prev) => ({ ...prev, time: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                            />
                          </label>

                          {missionForm.kind === 'weekly' ? (
                            <label className="text-sm text-slate-600">
                              <span className="mb-1 block">Dia da semana</span>
                              <select
                                value={missionForm.weekday}
                                onChange={(event) => setMissionForm((prev) => ({ ...prev, weekday: event.target.value, date: '' }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                              >
                                <option value="">Selecione</option>
                                <option value="segunda">segunda</option>
                                <option value="terça">terça</option>
                                <option value="quarta">quarta</option>
                                <option value="quinta">quinta</option>
                                <option value="sexta">sexta</option>
                                <option value="sábado">sábado</option>
                                <option value="domingo">domingo</option>
                              </select>
                            </label>
                          ) : null}

                          {missionForm.kind === 'monthly' ? (
                            <label className="text-sm text-slate-600">
                              <span className="mb-1 block">Data</span>
                              <input
                                type="date"
                                value={missionForm.date}
                                onChange={(event) => setMissionForm((prev) => ({ ...prev, date: event.target.value, weekday: '' }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                              />
                            </label>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={addCustomMission}>Adicionar missão</Button>
                          <Button variant="outline" onClick={() => setMissionForm(emptyMissionForm)}>Limpar</Button>
                        </div>
                      </div>

                      {customMissions.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">Missões personalizadas</p>
                            <Badge variant="secondary">{customMissions.length} criada(s)</Badge>
                          </div>

                          <div className="space-y-3">
                            {customMissions.map((mission) => (
                              <div key={mission.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-slate-900">{mission.title}</p>
                                      <Badge variant="outline">{mission.kind}</Badge>
                                      {mission.weekday ? <Badge variant="secondary">{mission.weekday}</Badge> : null}
                                      {mission.date ? <Badge variant="secondary">{mission.date}</Badge> : null}
                                    </div>
                                    {mission.description ? <p className="mt-1 text-sm text-slate-600">{mission.description}</p> : null}
                                  </div>
                                  <Button variant="outline" onClick={() => removeCustomMission(mission.id)}>Excluir</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <ScrollArea className="h-[520px] pr-1">
                        <div className="space-y-3">
                          {missions.map((mission) => <MissionRow key={mission.id} mission={mission} done={!!checked[mission.id]} onToggle={toggleMission} />)}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(stats).map(([key, value]) => <Card key={key} className="rounded-2xl"><CardContent className="p-5"><p className="text-sm capitalize text-slate-500">{key}</p><p className="mt-2 text-xl font-semibold">{value} XP</p></CardContent></Card>)}
                  </div>
                </TabsContent>

                <TabsContent value="shop">
                  <div className="grid gap-4 md:grid-cols-2">{rewardShop.map((item) => <ShopItemCard key={item.id} item={item} essence={essence} onRedeem={redeemReward} />)}</div>
                </TabsContent>

                <TabsContent value="avatar">
                  <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle>🧙‍♀️ Ficha do Avatar</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-3xl bg-gradient-to-br from-indigo-100 to-sky-100 p-6 text-center">
                          <MotionDiv
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white p-4 shadow relative"
                          >
                            <div className="absolute -top-2 text-2xl">
                              {avatarVisual.accessory}
                            </div>
                            <div className="text-4xl">
                              {avatarVisual.base}
                            </div>
                            <div className="absolute -bottom-3 text-2xl">
                              {avatarVisual.pet}
                            </div>
                          </MotionDiv>
                          <p className="mt-4 text-lg font-semibold">{avatar.baseClass}</p>
                          <p className="text-sm text-slate-600">{avatar.outfit}</p>
                          <p className="text-sm text-slate-600">{avatar.accessory}</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">Companheiro: {avatar.pet}</p>
                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <p><span className="font-medium">Roupa:</span> {avatar.outfit}</p>
                            <p><span className="font-medium">Acessório:</span> {avatar.accessory}</p>
                            <p><span className="font-medium">Companheiro:</span> {avatar.pet}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <Card className="rounded-2xl">
                        <CardHeader><CardTitle>Personalização</CardTitle></CardHeader>
                        <CardContent><div className="flex flex-wrap gap-2">{avatarClasses.map((item) => <Button key={item} variant={avatar.baseClass === item ? 'default' : 'outline'} onClick={() => setAvatar((prev) => ({ ...prev, baseClass: item }))}>{item}</Button>)}</div></CardContent>
                      </Card>

                      <Card className="rounded-2xl">
                        <CardHeader>
                          <CardTitle>Inventário Equipável</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {equippableInventory.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              Você ainda não possui itens equipáveis.
                            </p>
                          ) : (
                            equippableInventory.map((item) => {
                              const equipped =
                                avatar.outfit === item.name ||
                                avatar.accessory === item.name ||
                                avatar.pet === item.name

                              return (
                                <div
                                  key={item.id}
                                  className="rounded-2xl border border-slate-200 bg-white p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold">{item.name}</p>
                                      <div className="mt-2 flex gap-2">
                                        <Badge className={item.rarity === 'Incomum' ? 'bg-green-100 text-green-700' : item.rarity === 'Raro' ? 'bg-sky-100 text-sky-700' : item.rarity === 'Épico' ? 'bg-fuchsia-100 text-fuchsia-700' : item.rarity === 'Lendário' ? 'bg-amber-100 text-amber-700' : item.rarity === 'Mítico' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}>{item.rarity}</Badge>
                                        <Badge variant="outline">{item.type}</Badge>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {!equipped ? (
                                        <Button onClick={() => equipInventoryItem(item.name)}>
                                          Equipar
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          onClick={() => unequipAvatarItem(item.type)}
                                        >
                                          Desequipar
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="goal">
                  <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle>🎯 Meta Mensal</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-lg font-semibold">{monthlyGoal.title}</p>
                          <p className="mt-1 text-sm text-slate-600">Recompensa: {monthlyGoal.rewardName} + {monthlyGoal.rewardEssence} Essência</p>
                          <div className="mt-4"><Progress value={goalProgress} /></div>
                          <p className="mt-2 text-sm text-slate-600">{monthlyGoal.progress} / {monthlyGoal.target}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[100, 250, 500].map((amount) => <Button key={amount} variant="outline" onClick={() => addMonthlyProgress(amount)}>+{amount}</Button>)}
                          <Button onClick={claimMonthlyReward}>Resgatar meta</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle>➕ Nova Meta</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <input
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          placeholder="Título da meta"
                          value={goalForm.title}
                          onChange={(event) => setGoalForm((prev) => ({ ...prev, title: event.target.value }))}
                        />

                        <input
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          type="number"
                          min="1"
                          placeholder="Meta final"
                          value={goalForm.target}
                          onChange={(event) => setGoalForm((prev) => ({ ...prev, target: event.target.value }))}
                        />

                        <input
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          type="number"
                          min="0"
                          placeholder="Progresso atual"
                          value={goalForm.progress}
                          onChange={(event) => setGoalForm((prev) => ({ ...prev, progress: event.target.value }))}
                        />

                        <input
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          type="number"
                          min="0"
                          placeholder="Recompensa em Essência"
                          value={goalForm.rewardEssence}
                          onChange={(event) => setGoalForm((prev) => ({ ...prev, rewardEssence: event.target.value }))}
                        />

                        <input
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          placeholder="Recompensa descritiva"
                          value={goalForm.rewardName}
                          onChange={(event) => setGoalForm((prev) => ({ ...prev, rewardName: event.target.value }))}
                        />

                        <select
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          value={goalForm.category}
                          onChange={(event) => setGoalForm((prev) => ({ ...prev, category: event.target.value }))}
                        >
                          <option value="trabalho">Trabalho</option>
                          <option value="corpo">Corpo</option>
                          <option value="mente">Mente</option>
                          <option value="ambiente">Ambiente</option>
                        </select>

                        <Button onClick={addCustomGoal}>Salvar meta</Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle>Metas Manuais</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[320px] pr-1">
                          <div className="space-y-3">
                            {customGoals.length === 0 ? (
                              <p className="text-sm text-slate-500">Nenhuma meta manual criada ainda.</p>
                            ) : (
                              customGoals.map((goal) => {
                                const progressPercent = Math.min((goal.progress / goal.target) * 100, 100)

                                return (
                                  <Card key={goal.id} className="rounded-2xl">
                                    <CardContent className="space-y-3 p-5">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="font-semibold">{goal.title}</p>
                                          <p className="text-sm text-slate-500">{goal.progress} / {goal.target}</p>
                                          <p className="text-sm text-slate-500">
                                            Recompensa: {goal.rewardName || 'Sem descrição'} (+{goal.rewardEssence} Essência)
                                          </p>
                                        </div>
                                        <Badge variant="outline">{goal.category}</Badge>
                                      </div>

                                      <Progress value={progressPercent} />

                                      <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" onClick={() => updateCustomGoalProgress(goal.id, 1)}>+1</Button>
                                        <Button variant="outline" onClick={() => updateCustomGoalProgress(goal.id, 5)}>+5</Button>
                                        <Button onClick={() => claimCustomGoalReward(goal.id)} disabled={goal.progress < goal.target}>Resgatar</Button>
                                        <Button variant="outline" onClick={() => deleteCustomGoal(goal.id)}>Excluir</Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle>Inventário</CardTitle></CardHeader>
                      <CardContent><ScrollArea className="h-[320px] pr-1"><div className="space-y-2">{inventory.length === 0 ? <p className="text-sm text-slate-500">Nenhum item desbloqueado ainda.</p> : inventory.map((entry, index) => <div key={`${entry}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">{entry}</div>)}</div></ScrollArea></CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="timer">
                  <TimerPanel timerLabel={timerLabel} timerSecondsLeft={timerSecondsLeft} timerRunning={timerRunning} timerSoundEnabled={timerSoundEnabled} setTimerPreset={setTimerPreset} setTimerRunning={setTimerRunning} setTimerSecondsLeft={setTimerSecondsLeft} setTimerSoundEnabled={setTimerSoundEnabled} />
                </TabsContent>

                <TabsContent value="history">
                  <HistoryPanel
                    dailyMood={dailyMood}
                    setDailyMood={setDailyMood}
                    saveDailySnapshot={saveDailySnapshot}
                    achievements={achievements}
                    history={history}
                    dailyLog={dailyLog}
                    setDailyLog={setDailyLog}
                    copyReport={copyReport}
                    downloadReportPdf={downloadReportPdf}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader><CardTitle>Painel da Jornada</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Evento atual</p><p className="mt-1 font-semibold">{eventText}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Objetivo de hoje</p><p className="mt-1 font-semibold">{mode === 'normal' ? 'Farmar XP, Essência e dinheiro real com gentileza.' : 'Preservar energia e manter o básico.'}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Metas manuais</p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-slate-500">Ativas</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{customGoals.length}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-slate-500">Resgatáveis</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{readyGoalsCount}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Regras do jogo</p><ul className="mt-2 space-y-2 text-sm text-slate-700"><li>• Missão feita de forma imperfeita ainda rende progresso.</li><li>• Cosméticos equipáveis são parte da recompensa.</li><li>• Meta mensal vira boss fight econômica.</li><li>• Você não precisa zerar o jogo. Só continuar.</li><li>• O timer e o histórico ajudam a transformar caos em ritmo.</li></ul></div>
            </CardContent>
          </Card>
        </MotionDiv>
      </div>
    </div>
  )
}

function playTimerSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    ;[880, 660, 880].forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)

      const start = ctx.currentTime + index * 0.22
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
      osc.start(start)
      osc.stop(start + 0.2)
    })
  } catch (error) {
    console.error('Falha ao tocar som do timer', error)
  }
}
