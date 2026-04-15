import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BreadcrumbNav } from '@/components/directory/BreadcrumbNav';

const mockEmployees = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Senior Product Manager',
    department: 'Product',
    subsidiary: 'North America',
    location: 'San Francisco, CA',
    photoUrl: '/api/placeholder/150/150',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    phone: '+1 (555) 234-5678',
    jobTitle: 'Lead Engineer',
    department: 'Engineering',
    subsidiary: 'North America',
    location: 'Seattle, WA',
    photoUrl: '/api/placeholder/150/150',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    phone: '+1 (555) 345-6789',
    jobTitle: 'Sales Director',
    department: 'Sales',
    subsidiary: 'Europe',
    location: 'London, UK',
    photoUrl: '/api/placeholder/150/150',
  },
];

export const metadata = {
  title: 'Employees',
  description: 'View all employees and their profiles',
};

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <BreadcrumbNav items={[{ label: 'Employees', href: undefined }]} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employee Directory
          </h1>
          <p className="text-gray-600">
            Browse and connect with your colleagues
          </p>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockEmployees.map((employee) => (
            <Link key={employee.id} href={`/employee/${employee.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                {/* Employee Card */}
                <div className="bg-gradient-to-b from-blue-50 to-transparent p-6 flex flex-col items-center text-center flex-grow">
                  {/* Photo */}
                  <div className="relative h-32 w-32 mb-4 rounded-lg overflow-hidden border-2 border-blue-100">
                    <Image
                      src={employee.photoUrl}
                      alt={employee.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Name and Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-semibold mb-4">
                    {employee.jobTitle}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <Badge variant="secondary">{employee.department}</Badge>
                    <Badge variant="outline">{employee.subsidiary}</Badge>
                  </div>

                  {/* Location */}
                  <p className="text-xs text-gray-600 mb-4">
                    📍 {employee.location}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="border-t border-gray-100 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{employee.phone}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
