import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Calendar, ShieldCheck, Trophy } from 'lucide-react';
import heroImage from '/hero.jpg';  

const ImageCard = ({ src, alt, title, description }: { 
  src: string; 
  alt: string; 
  title: string; 
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="group relative overflow-hidden rounded-xl"
  >
    <div className="aspect-[4/3] overflow-hidden">
      <img 
        src={src} 
        alt={alt}
        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/0 p-6 flex flex-col justify-end">
      <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  </motion.div>
);

const features = [
  {
    icon: Trophy,
    title: "Horse Management",
    description: "Comprehensive tools for horse ownership, breeding, and care management"
  },
  {
    icon: Search,
    title: "Horse Marketplace",
    description: "Find and list exceptional horses with detailed profiles and verification"
  },
  {
    icon: Calendar,
    title: "Service Booking",
    description: "Schedule training, transportation, veterinary care, and more"
  },
  {
    icon: ShieldCheck,
    title: "Deal Management",
    description: "Secure and streamlined process for horse sales, leases, and partnerships"
  }
]


export function HomePage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = heroImage;
    img.onload = () => setImageLoaded(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (

<div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 flex items-center h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-primary-dark">
              The Complete Platform for Horse Management & Services
            </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Streamline every aspect of horse ownership, from daily care to professional services, all in one sophisticated platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/deals')}
                  size="lg" 
                  className="text-secondary gap-2"
                >
                  Manage Your Deals
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/horses')}
                  className="gap-2"
                >
                  Manage Your Horses
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              </motion.div>
        </div>
      </section>

      {/* Features Section - Now without background image */}
      <section className="py-40 bg-muted/1">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-light text-primary-dark mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From daily management to professional services, we provide all the tools needed for exceptional horse care and business.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-background p-6 rounded-xl border border-primary/10 hover:border-primary/20 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-light text-primary-dark mb-6">
              Ready to Transform Your Horse Management?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the platform that's setting new standards in equestrian excellence.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="text-secondary"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}