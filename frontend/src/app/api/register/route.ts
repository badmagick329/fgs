import { NextResponse } from 'next/server'
import { getRegistrations, createRegistration } from '@/lib/db'

export async function GET() {
  const rows = await getRegistrations()
  return NextResponse.json({ ok: true, data: rows })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body)
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 },
    )

  const { firstName, lastName, email } = body
  if (!firstName || !email) {
    return NextResponse.json(
      { ok: false, error: 'Missing fields' },
      { status: 400 },
    )
  }

  try {
    const created = await createRegistration({ firstName, lastName, email })
    return NextResponse.json({ ok: true, data: created })
  } catch (err) {
    console.error('createRegistration error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
