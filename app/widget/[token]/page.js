import WidgetFeedback from './WidgetFeedback';

export const metadata = {
  title: 'Feedback Widget',
};

export default async function WidgetPage({ params }) {
  const { token } = await params;

  return <WidgetFeedback token={token} />;
}
