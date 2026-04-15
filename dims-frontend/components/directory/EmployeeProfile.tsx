// TODO: Implement EmployeeProfile Component
// Props: userId: string
// - Full profile view fetched from GET /api/users/:id
// - Shows: large avatar, full name, job title, department, subsidiary, email, phone
// - "Send Mail" button opens ComposeModal pre-filled with this user
// - Back button to return to directory listing

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Building2, Users, Calendar, Briefcase, MessageSquare, Linkedin } from 'lucide-react';
import {Button} from '@/components/ui/Profilebutton';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  subsidiary: string;
  location: string;
  photoUrl: string;
  bio?: string;
  joinDate?: string;
  reportsTo?: string;
  linkedIn?: string;
  teams?: string[];
}

interface EmployeeProfileProps {
  employeeId: string;
}

export function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockEmployees: Record<string, Employee> = {
          '1': {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            phone: '+1 (555) 123-4567',
            jobTitle: 'Senior Product Manager',
            department: 'Product',
            subsidiary: 'North America',
            location: 'San Francisco, CA',
            photoUrl: '/api/placeholder/200/200',
            bio: 'Passionate about building products that users love. 8+ years of experience in tech.',
            joinDate: 'January 2019',
            reportsTo: 'VP of Product',
            linkedIn: 'linkedin.com/in/sarahjohnson',
            teams: ['Product Strategy', 'Design Systems'],
          },
          '2': {
            id: '2',
            name: 'Michael Chen',
            email: 'michael.chen@company.com',
            phone: '+1 (555) 234-5678',
            jobTitle: 'Lead Engineer',
            department: 'Engineering',
            subsidiary: 'North America',
            location: 'Seattle, WA',
            photoUrl: '/api/placeholder/200/200',
            bio: 'Full-stack engineer with expertise in cloud architecture.',
            joinDate: 'June 2020',
            reportsTo: 'Engineering Director',
            linkedIn: 'linkedin.com/in/michaelchen',
            teams: ['Backend Systems', 'DevOps'],
          },
          '3': {
            id: '3',
            name: 'Emma Wilson',
            email: 'emma.wilson@company.com',
            phone: '+1 (555) 345-6789',
            jobTitle: 'Sales Director',
            department: 'Sales',
            subsidiary: 'Europe',
            location: 'London, UK',
            photoUrl: '/api/placeholder/200/200',
            bio: 'Driving growth and building strong client relationships.',
            joinDate: 'March 2018',
            reportsTo: 'VP of Sales',
            linkedIn: 'linkedin.com/in/emmawilson',
            teams: ['Enterprise Sales', 'Account Management'],
          },
        };

        const data = mockEmployees[employeeId];
        if (!data) {
          setError('Employee not found');
          setEmployee(null);
        } else {
          setEmployee(data);
        }
      } catch (err) {
        setError('Failed to load employee profile');
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-48 w-48 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!employee) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertDescription>No employee data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            <div className="relative h-48 w-48 flex-shrink-0">
              <Image
                src={employee.photoUrl}
                alt={employee.name}
                fill
                className="rounded-lg object-cover"
                priority
              />
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {employee.name}
              </h1>
              <p className="text-lg text-blue-600 font-semibold mb-4">
                {employee.jobTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{employee.department}</Badge>
                <Badge variant="outline">{employee.subsidiary}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8 space-y-6">
          {employee.bio && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                About
              </h2>
              <p className="text-gray-700">{employee.bio}</p>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a
                  href={`mailto:${employee.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {employee.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a
                  href={`tel:${employee.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {employee.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{employee.location}</span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Job Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    DEPARTMENT
                  </p>
                  <p className="text-gray-700">{employee.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    SUBSIDIARY
                  </p>
                  <p className="text-gray-700">{employee.subsidiary}</p>
                </div>
              </div>
              {employee.reportsTo && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      REPORTS TO
                    </p>
                    <p className="text-gray-700">{employee.reportsTo}</p>
                  </div>
                </div>
              )}
              {employee.joinDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      JOINED
                    </p>
                    <p className="text-gray-700">{employee.joinDate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Teams */}
          {employee.teams && employee.teams.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Teams
              </h2>
              <div className="flex flex-wrap gap-2">
                {employee.teams.map((team, idx) => (
                  <Badge key={idx} variant="secondary">{team}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Communication Actions */}
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Connect
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <a href={`mailto:${employee.email}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <a href={`tel:${employee.phone}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
              {employee.linkedIn && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <a href={`https://${employee.linkedIn}`} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-1" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
