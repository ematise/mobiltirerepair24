import Link from 'next/link';
import { getAllStates } from '@/lib/data';

export default async function NotFound() {
  const states = await getAllStates();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-3">Page Not Found</h1>
      <p className="text-slate-600 text-lg leading-relaxed mb-10">
        The page you are looking for does not exist. Browse mobile tire repair services by state below.
      </p>
      <ul className="flex flex-col gap-2" role="list">
        <li>
          <Link
            href="/"
            className="text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium"
          >
            Back to Home
          </Link>
        </li>
        {states.map((state) => (
          <li key={state.slug}>
            <Link
              href={`/${state.slug}/`}
              className="text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium"
            >
              Mobile Tire Repair in {state.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
