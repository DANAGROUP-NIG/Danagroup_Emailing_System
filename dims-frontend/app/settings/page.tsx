'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SettingsIcon, BellIcon, LockIcon, HelpCircleIcon } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input defaultValue="John" className="mt-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input defaultValue="Doe" className="mt-2" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    defaultValue="john@email.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <Separator className="my-4" />

                <div className="flex gap-3">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline">Cancel</Button>
                  {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'new-emails', label: 'New emails', description: 'Get notified when you receive new emails' },
                      { id: 'replies', label: 'Replies', description: 'Get notified when someone replies to your email' },
                      { id: 'mentions', label: 'Mentions', description: 'Get notified when you are mentioned' },
                      { id: 'attachments', label: 'New attachments', description: 'Get notified when emails with attachments arrive' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Push Notifications</h3>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-medium text-sm">Enable push notifications</p>
                      <p className="text-xs text-muted-foreground">Receive notifications on your device</p>
                    </div>
                  </label>
                </div>

                <Separator className="my-4" />

                <Button onClick={handleSave}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockIcon className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Password</h3>
                  <Button variant="outline">Change Password</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={twoFactor}
                      onChange={(e) => setTwoFactor(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-medium text-sm">Enable 2FA</p>
                      <p className="text-xs text-muted-foreground">Use authenticator app or SMS</p>
                    </div>
                  </label>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Active Sessions</h3>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm">Current Device</p>
                    <p className="text-xs text-muted-foreground">Last active now</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button onClick={handleSave}>Save Security Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircleIcon className="w-5 h-5" />
                  SEO & Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Page Title</label>
                  <Input
                    defaultValue="Gmail - Email Dashboard"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Appears in search results and browser tab
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Meta Description</label>
                  <Textarea
                    defaultValue="Professional email management dashboard with real-time updates, search, and admin controls"
                    className="mt-2"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep it under 160 characters for optimal display
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Keywords</label>
                  <Input
                    defaultValue="email, gmail, dashboard, mail, communication"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated list of keywords
                  </p>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-semibold mb-3">Open Graph</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">OG Title</label>
                      <Input defaultValue="Gmail" className="mt-2" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">OG Description</label>
                      <Textarea
                        defaultValue="Professional email management dashboard"
                        className="mt-2"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button onClick={handleSave}>Save SEO Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
