'use client'

import { DailyProvider, DailyAudio, DailyVideo, useDaily, useDailyEvent } from '@daily-co/daily-react'
import { useEffect, useState } from 'react'

const ROOM_URL = 'https://menvo.daily.co/engenharia'

function VideoCall() {
  const callFrame = useDaily()
  const [joined, setJoined] = useState(false)

  useDailyEvent('joined-meeting', () => {
    console.log('Joined the call')
    setJoined(true)
  })

  useDailyEvent('left-meeting', () => {
    console.log('Left the call')
    setJoined(false)
  })

  useEffect(() => {
    if (!callFrame) return
    callFrame.join({ url: ROOM_URL })
  }, [callFrame])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <DailyVideo className="w-full h-full max-w-[960px] max-h-[540px] rounded-xl shadow-xl" />
      <DailyAudio />
      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        onClick={() => callFrame?.leave()}
      >
        Sair da sala
      </button>
    </div>
  )
}

export default function Page() {
  return (
    <DailyProvider>
      <VideoCall />
    </DailyProvider>
  )
}
