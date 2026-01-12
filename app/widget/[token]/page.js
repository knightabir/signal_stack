import WidgetContainer from './WidgetContainer';

export const metadata = {
  title: 'Feedback Widget',
};

// Force dynamic because we read params and we want to ensure fresh client-side fetch
export const dynamic = 'force-dynamic';

export default async function WidgetPage({ params }) {
  const { token } = await params;

  // We no longer fetch data on the server to avoid Next.js 16/Turbopack measurement bugs with negative timestamp.
  // The client component WidgetContainer will fetch the data via API.
  
  return <WidgetContainer token={token} />;
}
