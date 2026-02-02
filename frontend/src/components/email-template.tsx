import * as React from 'react'

export interface EmailTemplateProps {
  firstName?: string
  lastName?: string
  message?: string
}

export function EmailTemplate({
  firstName,
  lastName,
  message,
}: EmailTemplateProps) {
  return (
    <div>
      <h1>New Student Registration</h1>
      <p>A new student has registered with the following details:</p>
      <ul>
        <li>
          <strong>First Name:</strong> {firstName}
        </li>
        <li>
          <strong>Last Name:</strong> {lastName}
        </li>
      </ul>
      <p>{message}</p>
    </div>
  )
}
