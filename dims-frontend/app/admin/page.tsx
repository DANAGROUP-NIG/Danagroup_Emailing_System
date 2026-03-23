'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import {
  SettingsIcon,
  UsersIcon,
  MailIcon,
  TrendingUpIcon,
  LogOutIcon,
} from 'lucide-react'
import Link from 'next/link'

const chartData = [
  { month: 'Jan', emails: 400, users: 240 },
  { month: 'Feb', emails: 520, users: 280 },
  { month: 'Mar', emails: 680, users: 320 },
  { month: 'Apr', emails: 750, users: 380 },
  { month: 'May', emails: 890, users: 420 },
  { month: 'Jun', emails: 1020, users: 480 },
]

const userDistribution = [
  { name: 'Active', value: 65 },
  { name: 'Inactive', value: 25 },
  { name: 'Pending', value: 10 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Email Dashboard Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Back to Email</Button>
            </Link>
            <Button variant="destructive" size="sm" className="gap-2">
              <LogOutIcon className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24,582</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,248</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4h</div>
                  <p className="text-xs text-muted-foreground">-15% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.9%</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="emails"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Stats Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Emails sent</span>
                      <span className="font-semibold">2,345</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Emails received</span>
                      <span className="font-semibold">1,892</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>New users today</span>
                      <span className="font-semibold">32</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span>Support tickets</span>
                      <span className="font-semibold text-orange-500">8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">Email</th>
                          <th className="text-left py-2 px-4 font-medium">Status</th>
                          <th className="text-left py-2 px-4 font-medium">Joined</th>
                          <th className="text-left py-2 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { email: 'john@email.com', status: 'Active', joined: '2024-01-15' },
                          { email: 'sarah@company.com', status: 'Active', joined: '2024-02-10' },
                          { email: 'james@company.com', status: 'Pending', joined: '2024-03-10' },
                          { email: 'emily@company.com', status: 'Active', joined: '2024-02-20' },
                        ].map((user) => (
                          <tr key={user.email} className="border-b hover:bg-muted">
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {user.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">{user.joined}</td>
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Email Configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Max email size</span>
                      <span className="text-muted-foreground">25 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage per user</span>
                      <span className="text-muted-foreground">15 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retention period</span>
                      <span className="text-muted-foreground">90 days</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Two-factor authentication</span>
                      <Button size="sm" variant="outline">
                        Enable
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SSL/TLS</span>
                      <span className="text-green-600 font-medium">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Encryption</span>
                      <span className="text-green-600 font-medium">AES-256</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Integrations</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Connect to Slack
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Connect to Calendar
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      API Documentation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
