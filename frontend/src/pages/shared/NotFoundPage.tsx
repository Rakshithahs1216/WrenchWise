import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you are looking for does not exist or has moved."
      action={
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
          Go to your home page
        </Link>
      }
    />
  );
}
