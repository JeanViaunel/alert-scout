import { Metadata } from 'next';
import Link from 'next/link';

/**
 * Route Segment Config
 * 
 * This is the homepage - can be statically generated
 * since it doesn't depend on user session
 */
export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate once per day

export const metadata: Metadata = {
  title: 'Alert Scout - Smart Price & Property Alerts',
  description: 'Track rental properties and product deals automatically. Get notified when prices drop or new listings match your criteria.',
  keywords: ['price alerts', 'property tracking', 'deal finder', 'rental alerts'],
  openGraph: {
    title: 'Alert Scout - Smart Price & Property Alerts',
    description: 'Track rental properties and product deals automatically.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Never Miss a Great Deal
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Track rental properties and product prices automatically. 
          Get instant notifications when new listings match your criteria.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/register" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Get Started Free
          </Link>
          <Link 
            href="/login" 
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Smart Monitoring"
            description="Automated scraping of major platforms including 591, Shopee, Amazon, and more."
          />
          <FeatureCard 
            title="Instant Alerts"
            description="Get notified immediately when new matches are found. Email, WhatsApp, and in-app notifications."
          />
          <FeatureCard 
            title="Map View"
            description="Visualize property locations on an interactive map with filtering capabilities."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-card rounded-lg border border-border">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
