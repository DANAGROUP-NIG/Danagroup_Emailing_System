'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { mockUsers } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { TrashIcon, EditIcon, PlusIcon } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="flex w-full h-screen">
      <AdminSidebar active="users" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-white flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage system users</p>
          </div>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-blue-600">
            <PlusIcon size={18} />
            Add User
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-muted-foreground">
                    Emails Sent
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-3 px-6 font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {user.avatar}
                        </div>
                        <span className="font-medium text-foreground">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{user.email}</td>
                    <td className="py-4 px-6 text-foreground font-medium">
                      {Math.floor(Math.random() * 50)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <EditIcon size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
