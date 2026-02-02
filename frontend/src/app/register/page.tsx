'use client'
import { registerStudent } from '@/actions/register-action'
import { useState } from 'react'
import { sendEmail } from '@/actions/email-actions'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const resetMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <main className='flex flex-col min-h-screen'>
      <div className='flex flex-col items-center gap-8'>
        <h1 className='text-4xl font-semibold'>Register</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            resetMessages()
            setIsSubmitting(true)
            console.log('is submitting')
            try {
              const result = await registerStudent({ firstName, lastName })
              if (result.ok) {
                setSuccess('Yep')
                const emailRes = await sendEmail({
                  firstName,
                  lastName,
                  message: 'New student registered',
                })
                if (!emailRes.ok) {
                  setError(
                    emailRes.error ??
                      emailRes.errors?.[0]?.message ??
                      'Email failed',
                  )
                }
              } else {
                setError(result.errors[0].message)
              }
            } finally {
              console.log('is submitting done')
              setIsSubmitting(false)
            }
          }}
        >
          <div className='flex flex-col items-center'>
            <div className='flex flex-col mb-4'>
              <label htmlFor='firstName' className='mb-2'>
                First Name
              </label>
              <input
                type='text'
                id='firstName'
                autoComplete='off'
                placeholder='set this to error for fake error'
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  resetMessages()
                }}
                className='rounded-md border border-gray-300 p-2 w-md'
              />
            </div>
            <div className='flex flex-col mb-4'>
              <label htmlFor='lastName' className='mb-2'>
                Last Name
              </label>
              <input
                type='text'
                id='lastName'
                autoComplete='off'
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  resetMessages()
                }}
                className='rounded-md border border-gray-300 p-2 w-md'
              />
            </div>
            <button
              className='mt-4 rounded-md bg-black px-4 py-2 hover:bg-gray-800 hover:cursor-pointer w-32 disabled:cursor-wait'
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : 'Register'}
            </button>
          </div>
        </form>
        <div className='text-lg font-semibold'>
          <p className={`text-red-500 ${error ? 'visible' : 'invisible'}`}>
            {error}
          </p>
          <p className={`text-green-500 ${success ? 'visible' : 'invisible'}`}>
            {success}
          </p>
        </div>
      </div>
    </main>
  )
}
