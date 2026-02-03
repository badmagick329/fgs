'use client'
import { useEffect, useState } from 'react'

export type Registration = {
  id: number
  first_name: string
  last_name: string
  email: string
  registration_message: string
  registered_at: string
  updated_at: string | null
  email_status: string
  retry_count: number
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
      <h2 className='text-3xl font-bold p-2 bg-amber-800'>Registrations</h2>
      <table className='w-full'>
        <thead className='bg-amber-700'>
          <tr>
            <th className='p-2 text-left'>ID</th>
            <th className='p-2 text-left'>First Name</th>
            <th className='p-2 text-left'>Last Name</th>
            <th className='p-2 text-left'>Email</th>
            <th className='p-2 text-left'>Message</th>
            <th className='p-2 text-left'>Registered At</th>
            <th className='p-2 text-left'>Updated At</th>
            <th className='p-2 text-left'>Email Status</th>
            <th className='p-2 text-left'>Retry Count</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r: Registration) => (
            <tr key={r.id} className='even:bg-amber-700 odd:bg-amber-600'>
              <td className='p-2'>{r.id}</td>
              <td className='p-2'>{r.first_name}</td>
              <td className='p-2'>{r.last_name}</td>
              <td className='p-2'>{r.email}</td>
              <td className='p-2'>{r.registration_message}</td>
              <td className='p-2'>
                {r.registered_at && new Date(r.registered_at).toLocaleString()}
              </td>
              <td className='p-2'>
                {(r.updated_at && new Date(r.updated_at).toLocaleString()) ??
                  'N/A'}
              </td>
              <td className='p-2'>{r.email_status}</td>
              <td className='p-2'>{r.retry_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
