'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useEmailStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { MailIcon, UsersIcon, BarChart3Icon, SettingsIcon } from 'lucide-react'

export default function AdminPage() {
  const store = useEmailStore()
  const totalEmails = store.emails.length
  const totalUsers = 6
  const unreadEmails = store.emails.filter((e) => !e.isRead).length
  const spamEmails = store.emails.filter((e) => e.isSpam).length

  const stats = [
    {
      title: 'Total Emails',
      value: totalEmails,
      icon: MailIcon,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Unread',
      value: unreadEmails,
      icon: MailIcon,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: UsersIcon,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Spam',
      value: spamEmails,
      icon: BarChart3Icon,
      color: 'bg-red-100 text-red-600',
    },
  ]

  return (
    <div className="flex w-full h-screen">
      <AdminSidebar active="dashboard" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-white">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to the admin dashboard</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const IconComponent = stat.icon
              return (
                <Card
                  key={stat.title}
                  className="p-6 bg-white border border-border hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <IconComponent size={24} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Recent Emails</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                      From
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                      Subject
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {store.emails.slice(0, 5).map((email) => (
                    <tr key={email.id} className="border-b border-border hover:bg-gray-50">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {email.from.fullName}
                      </td>
                      <td className="py-3 px-4 text-foreground truncate">
                        {email.subject}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(email.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            email.isRead
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {email.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
