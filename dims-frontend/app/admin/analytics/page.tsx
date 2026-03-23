'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useEmailStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const store = useEmailStore()

  // Mock analytics data
  const dailyData = [
    { day: 'Mon', emails: 12 },
    { day: 'Tue', emails: 19 },
    { day: 'Wed', emails: 3 },
    { day: 'Thu', emails: 5 },
    { day: 'Fri', emails: 2 },
    { day: 'Sat', emails: 22 },
    { day: 'Sun', emails: 29 },
  ]

  const senderData = store.emails
    .reduce(
      (acc, email) => {
        const existing = acc.find((item) => item.sender === email.from.fullName)
        if (existing) {
          existing.count += 1
        } else {
          acc.push({ sender: email.from.fullName, count: 1 })
        }
        return acc
      },
      [] as { sender: string; count: number }[]
    )
    .slice(0, 6)

  return (
    <div className="flex w-full h-screen">
      <AdminSidebar active="analytics" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-white">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Email system statistics</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Email Count */}
            <Card className="p-6 bg-white border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Daily Email Activity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="emails"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Senders */}
            <Card className="p-6 bg-white border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Top Senders</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={senderData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="sender" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Statistics */}
            <Card className="p-6 bg-white border border-border lg:col-span-2">
              <h2 className="text-lg font-bold text-foreground mb-4">Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center py-4 px-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Emails</p>
                  <p className="text-2xl font-bold text-primary mt-2">{store.emails.length}</p>
                </div>
                <div className="text-center py-4 px-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Read Emails</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {store.emails.filter((e) => e.isRead).length}
                  </p>
                </div>
                <div className="text-center py-4 px-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {store.emails.filter((e) => !e.isRead).length}
                  </p>
                </div>
                <div className="text-center py-4 px-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Spam</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {store.emails.filter((e) => e.isSpam).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
