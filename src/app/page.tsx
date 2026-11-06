// ============================================
// HOME PAGE / LANDING PAGE
// ============================================

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { Button } from '@/components/ui/Button';
import { StockTickerDisplay } from '@/components/common/StockTickerDisplay';
import { FeatureCard } from '@/components/common/FeatureCard';

// ============================================
// HOME PAGE COMPONENT
// ============================================

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is logged in, redirect to trading floor
  if (session) {
    redirect('/trading');
  }

  // ============================================
  // FETCH INITIAL DATA
  // ============================================

  // Get top 10 stocks for ticker display
  const { data: stocks } = await supabase
    .from('stocks')
    .select('ticker, name, current_price, category')
    .eq('is_active', true)
    .order('volume_24h', { ascending: false })
    .limit(10);

  // Get leaderboard data
  const { data: leaderboard } = await supabase
    .from('user_profiles')
    .select('username, net_worth')
    .order('net_worth', { ascending: false })
    .limit(5);

  // ============================================
  // FEATURES
  // ============================================

  const features = [
    {
      title: 'Real-Time Trading',
      description: 'Buy and sell stocks with live price updates every 5-10 minutes.',
      icon: 'chart-line',
      color: '#4B0082',
    },
    {
      title: 'Black Swan Events',
      description: 'Random market crashes that can wipe out 60-80% of tech and meme stocks.',
      icon: 'bolt',
      color: '#EF4444',
    },
    {
      title: 'Loans & Interest',
      description: 'Borrow up to 50% of your net worth with 5% hourly interest.',
      icon: 'dollar-sign',
      color: '#F59E0B',
    },
    {
      title: 'Virtual Shop',
      description: 'Purchase protection items, intelligence tools, and chaos cards.',
      icon: 'shopping-bag',
      color: '#10B981',
    },
    {
      title: 'Leaderboards',
      description: 'Compete with other players and climb the wealth rankings.',
      icon: 'trophy',
      color: '#8B5CF6',
    },
    {
      title: 'Discord Integration',
      description: 'Connect with your Discord account and receive notifications.',
      icon: 'message-square',
      color: '#5865F2',
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-surface-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
        
        {/* Main content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-4">
              Black Swan
            </h1>
            
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
              A High-Concurrency Stock Market & Financial Crash Economy Game
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 text-lg"
                onClick={() => redirect('/login')}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign in with Discord
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Stock Ticker Display */}
          <StockTickerDisplay stocks={stocks || []} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Game Features
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Experience a fully-featured stock market simulation with unique mechanics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                color={feature.color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Top Traders
            </h2>
            <p className="text-lg text-text-secondary">
              See how you stack up against the best
            </p>
          </div>
          
          <div className="bg-surface-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="space-y-4">
                {leaderboard?.map((user, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-surface-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-text-muted">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        ${(user.net_worth).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-text-muted">
                    Loading leaderboard...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Trade?
          </h2>
          <p className="text-xl text-primary/80 mb-8">
            Join thousands of players in the most exciting stock market game
          </p>
          <Button 
            size="lg" 
            className="bg-white hover:bg-surface-50 text-primary px-8 py-4 text-lg font-semibold"
            onClick={() => redirect('/login')}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Start Trading Now
          </Button>
        </div>
      </section>
    </div>
  );
}
