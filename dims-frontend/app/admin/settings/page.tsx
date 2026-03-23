'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteTitle: 'Gmail Clone',
    siteDescription: 'A modern email management system',
    adminEmail: 'admin@example.com',
    notificationsEnabled: true,
    maxAttachmentSize: 25,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex w-full h-screen">
      <AdminSidebar active="settings" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-white">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system configuration</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl">
            {/* Save Notification */}
            {saved && (
              <Card className="mb-6 p-4 bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">✓ Settings saved successfully!</p>
              </Card>
            )}

            {/* Site Settings */}
            <Card className="mb-6 p-6 bg-white border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Site Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Site Title
                  </label>
                  <Input
                    value={settings.siteTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, siteTitle: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) =>
                      setSettings({ ...settings, siteDescription: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
            </Card>

            {/* Email Settings */}
            <Card className="mb-6 p-6 bg-white border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Email Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, adminEmail: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Attachment Size (MB)
                  </label>
                  <Input
                    type="number"
                    value={settings.maxAttachmentSize}
                    onChange={(e) =>
                      setSettings({ ...settings, maxAttachmentSize: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={settings.notificationsEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, notificationsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="notifications" className="text-sm font-medium text-foreground">
                    Enable Email Notifications
                  </label>
                </div>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="mb-6 p-6 bg-white border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Security</h2>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Admin Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  View Activity Logs
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive border-destructive hover:bg-red-50">
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-blue-600"
              >
                Save Settings
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
