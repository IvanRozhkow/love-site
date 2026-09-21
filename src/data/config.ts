export const config = {
  // Дата початку стосунків, формат РРРР-ММ-ДД
  togetherSince: '2025-08-14',

  // Дата найближчої зустрічі, формат РРРР-ММ-ДД
  nextMeeting: '2027-08-14',

  // Я
  me: {
    city: 'Крісьє',
    place: 'Crissier, Switzerland', // для посилання на Google Maps
    timeZone: 'Europe/Zurich',
    lat: 46.55,
    lon: 6.58,
  },

  // Вона (Europe/Kiev це те саме, що Europe/Kyiv, але працює і в старих браузерах)
  her: {
    city: 'Вінниця',
    place: 'Vinnytsia, Ukraine',
    timeZone: 'Europe/Kiev',
    lat: 49.23,
    lon: 28.47,
  },
}