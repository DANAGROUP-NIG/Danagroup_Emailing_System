import { EmployeeProfile } from '@/components/directory/EmployeeProfile';
import { BreadcrumbNav } from '@/components/directory/BreadcrumbNav';

interface EmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: EmployeePageProps) {
  const { id } = await params;
  return {
    title: `Employee Profile - ID: ${id}`,
    description: 'View detailed employee profile and contact information',
  };
}

export default async function EmployeePage({ params }: EmployeePageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <BreadcrumbNav
            items={[
              { label: 'Employees', href: '/employees' },
              { label: 'Profile', href: undefined },
            ]}
          />
        </div>

        {/* Employee Profile */}
        <EmployeeProfile employeeId={id} />
      </div>
    </div>
  );
}
