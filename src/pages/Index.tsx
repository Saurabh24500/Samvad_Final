import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { ArrowRight, FileText, Eye, CheckCircle, Zap, Shield, Users, MapPin, Clock, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';
import heroImage from '@/assets/hero-city.jpg';
const features = [{
  icon: FileText,
  title: 'Easy Reporting',
  description: 'Submit civic issues with photos, location, and detailed descriptions in minutes.'
}, {
  icon: Eye,
  title: 'Real-Time Tracking',
  description: 'Monitor your reported issues from submission to resolution with live status updates.'
}, {
  icon: Zap,
  title: 'Smart Routing',
  description: 'Issues are automatically categorized and routed to the appropriate department.'
}, {
  icon: Shield,
  title: 'Transparent Process',
  description: 'Full visibility into the resolution process with engineer assignments and budgets.'
}];
const steps = [{
  number: '01',
  title: 'Report',
  description: 'Submit a new issue with photos, location, and category.',
  icon: FileText
}, {
  number: '02',
  title: 'Track',
  description: 'Follow your report\'s progress with real-time status updates.',
  icon: Clock
}, {
  number: '03',
  title: 'Resolve',
  description: 'Get notified when the issue is fixed and confirm resolution.',
  icon: CheckCircle
}];
const stats = [{
  value: '10K+',
  label: 'Issues Resolved'
}, {
  value: '500+',
  label: 'Active Engineers'
}, {
  value: '98%',
  label: 'Satisfaction Rate'
}, {
  value: '24/7',
  label: 'Support Available'
}];
export default function Index() {
  const navigate = useNavigate();
  const {
    user,
    role,
    loading
  } = useAuth();
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  return <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroImage})`
      }} />
        <div className="absolute inset-0 hero-overlay" />
        
        <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground pt-20">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-medium">Trusted by 50+ cities nationwide</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight">
              Your Voice for a
              <span className="block gradient-text">Better City</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">Samvad empowers citizens to report local issues and enables authorities to resolve them efficiently. Together, we build better communities.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="group">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl" onClick={() => navigate('/auth')}>
                View Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-8 h-12 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => <div key={index} className="text-center animate-slide-up" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/70 font-medium">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Making a difference in your community is as easy as 1-2-3
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => <div key={index} className="relative group animate-slide-up" style={{
            animationDelay: `${index * 150}ms`
          }}>
                <div className="glass-card p-8 text-center h-full hover:shadow-glow transition-all duration-500 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <step.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div className="text-6xl font-bold text-primary/10 absolute top-4 right-6">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for effective civic engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => <div key={index} className="glass-card p-6 group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-slide-up" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold font-display text-primary-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-primary-foreground/80">
              Join thousands of citizens and authorities working together to build better communities.
            </p>
            <Button variant="secondary" size="xl" onClick={() => navigate('/auth')} className="group">
              Start Reporting Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">Samvad</span>
            </div>
            <p className="text-background/60 text-sm">
              © 2026 CivicConnect. Building better cities together.
            </p>
          </div>
        </div>
      </footer>
    </div>;
}