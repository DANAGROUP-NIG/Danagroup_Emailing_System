import { NextRequest, NextResponse } from 'next/server'

// This is a mock API endpoint. In production, you would connect to a real database.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folder = searchParams.get('folder') || 'inbox'
    const search = searchParams.get('search')

    // Mock data response
    const emails = [
      {
        id: '1',
        folder: 'inbox',
        sender: {
          name: 'Sarah Mitchell',
          email: 'sarah.mitchell@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        },
        subject: 'Project update: Q1 roadmap',
        preview: 'Project update: Q1 roadmap - I wanted to follow up on the Q1...',
        timestamp: '2024-03-17T14:45:00Z',
        starred: false,
        read: false,
      },
    ]

    return NextResponse.json({ success: true, data: emails })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch emails' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mock email creation
    const newEmail = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      timestamp: new Date().toISOString(),
      read: true,
    }

    return NextResponse.json({ success: true, data: newEmail }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create email' },
      { status: 500 }
    )
  }
}
