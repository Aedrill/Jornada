import { useEffect, useState } from 'react'

function readStoredValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return initialValue
  }

  try {
    const storedValue = window.localStorage.getItem(key)

    if (storedValue === null) {
      return initialValue
    }

    return JSON.parse(storedValue)
  } catch (error) {
    console.error(
      `Não foi possível ler "${key}" do localStorage.`,
      error,
    )

    return initialValue
  }
}

function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() =>
    readStoredValue(key, initialValue),
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(value),
      )
    } catch (error) {
      console.error(
        `Não foi possível salvar "${key}" no localStorage.`,
        error,
      )
    }
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorageState
