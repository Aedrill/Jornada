export const STORAGE_KEY = 'jornada-vida-adulta-save'
export const DEFAULT_TIMER_SECONDS = 50 * 60

export const normalMissions = [
  { id: 1, title: '🌤️ Despertar Consciente', time: '08:00', xp: 5, category: 'mente', description: 'Abrir a janela, luz natural e água.' },
  { id: 2, title: '💧 Carregar Energia Base', time: '08:10', xp: 5, category: 'corpo', description: 'Tomar café da manhã simples.' },
  { id: 3, title: '🔄 Ativar Corpo', time: '08:30', xp: 10, category: 'corpo', description: '10 minutos de movimento leve.' },
  { id: 7, title: '🎯 Missão Principal I', time: '11:00', xp: 20, category: 'trabalho', description: 'Bloco de foco em amigurumi.' },
  { id: 8, title: '🎯 Missão Principal II', time: '12:00', xp: 20, category: 'trabalho', description: 'Segundo bloco de foco.' },
  { id: 10, title: '🧾 Operação Caco', time: '14:00', xp: 10, category: 'trabalho', description: 'Responder e organizar o essencial.' },
  { id: 12, title: '🏠 Base Organizada', time: '16:00', xp: 15, category: 'ambiente', description: 'Cuidar da casa sem perfeccionismo.' },
  { id: 14, title: '🌿 Reset Mental', time: '16:30', xp: 10, category: 'mente', description: 'Pausa breve de regulação.' },
  { id: 15, title: '💪 Upgrade Físico', time: '18:00', xp: 15, category: 'corpo', description: 'Treino leve ou alongamento.' },
  { id: 16, title: '🛁 Ritual de Desligamento', time: '21:30', xp: 10, category: 'mente', description: 'Redução de estímulos e autocuidado.' },
]

export const tpmMissions = [
  { id: 101, title: '🌧️ Despertar Suave', time: '08:00', xp: 10, category: 'corpo', description: 'Acordar sem pressa.' },
  { id: 103, title: '🧶 Missão Essencial', time: '11:00', xp: 25, category: 'trabalho', description: 'Um bloco leve de amigurumi.' },
  { id: 104, title: '🧾 Manter o Básico', time: '14:00', xp: 20, category: 'trabalho', description: 'Só o essencial da Caco.' },
  { id: 105, title: '🏠 Manutenção Leve', time: '16:00', xp: 20, category: 'ambiente', description: '30 minutos de manutenção.' },
  { id: 106, title: '🌿 Reset Mental', time: '10:00', xp: 15, category: 'mente', description: 'Pausa obrigatória de regulação.' },
  { id: 107, title: '🔥 Cuidado Corporal', time: '18:00', xp: 20, category: 'corpo', description: 'Calor, descanso ou alongamento.' },
]

export const rewardShop = [
  { id: 1, name: '🎮 1h de jogo', cost: 50, rarity: 'Comum', type: 'consumivel' },
  { id: 2, name: '🍿 3h de série', cost: 80, rarity: 'Comum', type: 'consumivel' },
  { id: 3, name: '☕ Café especial', cost: 120, rarity: 'Incomum', type: 'consumivel' },
  { id: 4, name: '🧥 Traje de Exploradora', cost: 180, rarity: 'Raro', type: 'roupa' },
  { id: 5, name: '👑 Coroa de Estrelas', cost: 220, rarity: 'Raro', type: 'acessorio' },
  { id: 6, name: '🦊 Raposinha Lunar', cost: 250, rarity: 'Épico', type: 'pet' },
  { id: 7, name: '🎒 Mochila Arcana', cost: 280, rarity: 'Épico', type: 'acessorio' },
  { id: 8, name: '🍔 iFood favorito', cost: 300, rarity: 'Épico', type: 'consumivel' },
  { id: 9, name: '✨ Traje da Heroína', cost: 400, rarity: 'Lendário', type: 'roupa' },
  { id: 10, name: '🦉 Corujinha Guardiã', cost: 450, rarity: 'Lendário', type: 'pet' },
  { id: 11, name: '🌿 Dia livre', cost: 500, rarity: 'Lendário', type: 'consumivel' },
  { id: 12, name: '💎 Assinatura premium', cost: 1000, rarity: 'Mítico', type: 'consumivel' },
]

export const levelTitles = [
  'Plebeia Determinada', 'Escudeira da Rotina', 'Aprendiz do Cotidiano', 'Patrulheira da Manhã',
  'Ladina da Disciplina', 'Clériga da Constância', 'Guardiã da Base', 'Artífice do Progresso',
  'Estrategista do Foco', 'Heroína do Dia a Dia', 'Mestra da Manutenção', 'Feiticeira da Organização',
  'Comandante da Agenda', 'Caçadora de Metas', 'Campeã da Persistência', 'Arcanista da Calma',
  'Senhora da Jornada', 'Lenda da Constância', 'Guardiã da Vida Adulta', 'Mítica Mestra da Jornada',
]

export const avatarClasses = ['Artífice', 'Ladina', 'Clériga', 'Feiticeira']
export const moodOptions = ['ótima', 'estável', 'cansada', 'sobrecarregada']
export const timerPresets = [
  { label: 'Foco Profundo', minutes: 50 },
  { label: 'Pausa Estratégica', minutes: 10 },
  { label: 'Reset Mental', minutes: 5 },
  { label: 'Upgrade Físico', minutes: 20 },
]

export const defaultAvatar = {
  baseClass: 'Artífice',
  outfit: 'Traje Inicial',
  accessory: 'Pingente Simples',
  pet: 'Sem companheiro',
}

export const defaultMonthlyGoal = {
  title: 'Vender 3000 em amigurumi',
  target: 3000,
  progress: 0,
  rewardEssence: 150,
  rewardName: 'iFood da comida favorita',
}

export function getLevel(totalXp) {
  const level = Math.min(20, Math.floor(totalXp / 100) + 1)
  return { level, rank: levelTitles[level - 1], nextXp: level >= 20 ? 0 : level * 100 - totalXp }
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function rarityStyle(rarity) {
  switch (rarity) {
    case 'Incomum': return 'bg-green-100 text-green-700'
    case 'Raro': return 'bg-sky-100 text-sky-700'
    case 'Épico': return 'bg-fuchsia-100 text-fuchsia-700'
    case 'Lendário': return 'bg-amber-100 text-amber-700'
    case 'Mítico': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

console.assert(getLevel(0).nextXp === 100, 'getLevel deve informar XP restante no nível inicial')
console.assert(typeof rewardShop[0].name === 'string', 'rewardShop deve continuar acessível')
