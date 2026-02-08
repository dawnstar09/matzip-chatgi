import RecommendationClient from '@/components/RecommendationClient';

export default function RecommendationPage() {
  return (
    <main className="flex flex-col items-center justify-center p-4 py-8 bg-gray-50 min-h-[calc(100vh-64px)]">
      <RecommendationClient />
    </main>
  );
}
