import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getBalance } from '@/lib/gateway-tokens'

export async function GET() {
  const user = await getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const balance = await getBalance(user.id)

  if (!balance) {
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    plan: balance.plan,
    balance: balance.balance,
    lifetimePurchased: balance.lifetime_purchased,
    lifetimeUsed: balance.lifetime_used,
    // Back-compat alias: some clients read `used` directly
    used: balance.lifetime_used,
  })
}
