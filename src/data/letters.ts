import { config } from './config'

export type Letter = {
  id: string
  when: string // продовження фрази «Відкрий, коли ...»
  text: string // абзаци відокремлюй порожнім рядком: \n\n
  accent?: string // колір картки й листа
  unlockOn?: string // необов'язково: лист відкриється лише з цієї дати (РРРР-ММ-ДД)
}

export const letters: Letter[] = [
  {
    id: 'miss',
    when: 'ти сумуєш за мною',
    accent: 'var(--coral)',
    text: "Ні сумуй любімочка моя, оть оть і ми вже зустрінемось, треба чут чут почекати :3",
  },
  {
    id: 'sleep',
    when: 'тобі не спиться',
    accent: 'var(--lilac)',
    text: "Хотю щоб тобі снились найсолодші сни, і щоб я там був з тобою",
  },
  {
    id: 'badday',
    when: 'у тебе поганий день',
    accent: 'var(--dusty-pink)',
    text: "Погані дні пройдуть, а я завжди буду поруч, щоб підтримати тебе !",
  },
  {
    id: 'smile',
    when: 'тобі потрібна усмішка',
    accent: 'var(--purple)',
    text: "Я хочу щоб ти завжди посміхалась, бо твоя усмішка так потрібна мені і вона найкраща у світі !",
  },
  {
    id: 'doubt',
    when: 'ти сумніваєшся в собі',
    accent: 'var(--lilac)',
    text: "Ти в мене розумашка і найумні киця у світі !",
  },
  {
    id: 'meet',
    when: 'ми нарешті зустрінемось',
    accent: 'var(--acid-green)',
    unlockOn: config.nextMeeting, // відкриється в день зустрічі з config.ts
    text: "Я тебе люблю <3",
  },
]