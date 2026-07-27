import { useState, useEffect } from 'react'

interface TypewriterProps {
  words: string[]
  typeSpeed?: number
  deleteSpeed?: number
  delay?: number
}

export function Typewriter({
  words,
  typeSpeed = 100,
  deleteSpeed = 50,
  delay = 2000,
}: TypewriterProps) {
  const [text, setText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex]

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.substring(0, text.length + 1))
          if (text === currentWord) {
            setTimeout(() => setIsDeleting(true), delay)
          }
        } else {
          setText(currentWord.substring(0, text.length - 1))
          if (text === '') {
            setIsDeleting(false)
            setWordIndex((prev) => (prev + 1) % words.length)
          }
        }
      },
      isDeleting ? deleteSpeed : typeSpeed
    )

    return () => clearTimeout(timeout)
  }, [text, isDeleting, wordIndex, words, typeSpeed, deleteSpeed, delay])

  return (
    <span className="text-gradient font-semibold">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  )
}
