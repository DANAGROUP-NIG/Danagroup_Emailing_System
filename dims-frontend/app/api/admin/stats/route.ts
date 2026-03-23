import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock admin statistics
    const stats = {
      totalEmails: 24582,
      activeUsers: 1248,
      avgResponseTime: '2.4h',
      systemUptime: 99.9,
      emailsSentToday: 2345,
      emailsReceivedToday: 1892,
      newUsersToday: 32,
      supportTickets: 8,
      monthlyGrowth: {
        emails: 12,
        users: 8,
      },
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
