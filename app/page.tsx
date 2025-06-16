import ContentAggregatorClient from '@/app/content-aggregator-client';

export default function Home() {
  return (
    <main className="container mx-auto p-4 py-8 md:p-8">
      <ContentAggregatorClient />
    </main>
  );
}
