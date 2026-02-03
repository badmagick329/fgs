'use client'
import { useEffect, useState } from 'react'

type Registration = {
  id: number
  first_name: string
  last_name: string
  email: string
}

export default function RegistrationList() {
  const [registrations, setRegistrations] = useState<Registration[]>([])

  useEffect(() => {
    fetch('/api/register')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setRegistrations(data.data)
      })
  }, [])

  return (
    <div>
      <h2>Registrations</h2>
      <ul>
        {registrations.map((r: Registration) => (
          <li key={r.id}>
            {r.first_name} {r.last_name} ({r.email})
          </li>
        ))}
      </ul>
    </div>
  )
}
