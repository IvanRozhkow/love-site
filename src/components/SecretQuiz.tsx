import { useState } from 'react'

type Question = {
  text: string
  answers: string[]
  correct: number
}

const questions: Question[] = [
  {
    text: 'Як я люблю тебе називати?',
    answers: ['Куцунька', 'Любімочка'],
    correct: 1,
  },
  {
    text: 'Хто я для тебе?',
    answers: ['Коханнячко', 'Котьоночок'],
    correct: 0,
  },
  {
    text: 'Хто кого більше любить?',
    answers: ['Я тебе', 'Ті мене'],
    correct: 0,
  },
]

type Props = {
  onClose: () => void
  onStartGame: () => void
}

function SecretQuiz({ onClose, onStartGame }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const finished = questionIndex >= questions.length

  const question = questions[questionIndex]

  const chooseAnswer = (answerIndex: number) => {
    if (selected !== null) return
    setSelected(answerIndex)
    if (answerIndex === question.correct) setScore((value) => value + 1)
  }

  const next = () => {
    setQuestionIndex((value) => value + 1)
    setSelected(null)
  }

  return (
    <section
      className="secret-card secret-quiz"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-quiz-title"
      onClick={(event) => event.stopPropagation()}
    >
      {finished ? (
        <>
          <span className="secret-card__eyebrow">усі відповіді знайдені</span>
          <h2 id="secret-quiz-title">Ти знаєш наше серце ♥</h2>
          <p>
            {score} з {questions.length}. Але найважливіша відповідь завжди буде
            одна: я люблю тебе більше за все на світі, і ті моє найцінніше щастя. Дякую, що ті є в моєму житті, цьомк ♥
          </p>
          <div className="secret-quiz__actions">
            <button type="button" className="map-button" onClick={onStartGame}>
              Пограти разом
            </button>
            <button type="button" className="map-button" onClick={onClose}>
              Зберегти секрет
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="secret-card__eyebrow">
            питання {questionIndex + 1} з {questions.length}
          </span>
          <h2 id="secret-quiz-title">Міні-вікторина про нас</h2>
          <p className="secret-quiz__question">{question.text}</p>
          <div className="secret-quiz__answers">
            {question.answers.map((answer, answerIndex) => {
              const isSelected = selected === answerIndex
              const isCorrect = answerIndex === question.correct
              const state =
                selected === null
                  ? ''
                  : isCorrect
                    ? ' secret-quiz__answer--correct'
                    : isSelected
                      ? ' secret-quiz__answer--wrong'
                      : ''

              return (
                <button
                  key={answer}
                  type="button"
                  className={`secret-quiz__answer${state}`}
                  aria-pressed={isSelected}
                  onClick={() => chooseAnswer(answerIndex)}
                >
                  {answer}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <>
              <p className="secret-quiz__feedback">
                {selected === question.correct ? 'Правильно ♥' : 'Майже. Я підкажу правильну відповідь.'}
              </p>
              <button type="button" className="map-button" onClick={next}>
                {questionIndex === questions.length - 1 ? 'Побачити фінал' : 'Наступне питання'}
              </button>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default SecretQuiz
