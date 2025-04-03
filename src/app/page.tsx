'use client';

import { type ReactElement, type ReactNode } from 'react';
import { type NextPage } from 'next';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  ArrowRight,
  Star,
  History,
  LineChart,
  Calendar,
  Search,
  Share,
  MessageSquare,
  Image,
  Mic,
  Globe,
  Presentation,
  FolderKanban,
  type LucideProps,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined)[]) => twMerge(clsx(inputs));

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
  iconColor: string;
  bgColor: string;
}

const IconWrapper = ({ icon: Icon, className }: { icon: React.ComponentType<LucideProps>; className?: string }) => (
  <Icon className={cn('w-6 h-6', className)} />
);

const FeatureCard = ({ title, description, icon, iconColor, bgColor }: FeatureCardProps) => (
  <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-lg">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 ${bgColor} rounded-lg`}>
        <IconWrapper icon={icon} className={iconColor} />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-zinc-400">{description}</p>
  </div>
);

const features: FeatureCardProps[] = [
  {
    title: "AI-Powered Editor",
    description: "Transform your ideas into polished content with our intelligent editor. Get real-time suggestions and improvements.",
    icon: Star,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    title: "Smart Chat Assistant",
    description: "Get instant help with content creation, editing, and brainstorming through our advanced AI chat interface.",
    icon: MessageSquare,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    title: "AI Image Generation",
    description: "Create stunning visuals for your content using our state-of-the-art AI image generation technology.",
    icon: Image,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    title: "Voice-to-Text",
    description: "Convert your voice recordings into text with our advanced speech recognition technology.",
    icon: Mic,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    title: "Website Builder",
    description: "Create professional websites with our AI-powered website builder. No coding required.",
    icon: Globe,
    iconColor: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  {
    title: "Presentation Creator",
    description: "Design engaging presentations with AI assistance. Get smart suggestions for layouts and content.",
    icon: Presentation,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-500/10"
  },
  {
    title: "Project Management",
    description: "Organize your content projects with AI-powered task management and collaboration tools.",
    icon: FolderKanban,
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-500/10"
  },
  {
    title: "Version Control",
    description: "Track every change, compare versions, and restore previous drafts with our powerful version control system.",
    icon: History,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    title: "Content Analytics",
    description: "Understand your content's performance with detailed analytics, engagement metrics, and audience insights.",
    icon: LineChart,
    iconColor: "text-cyan-500",
    bgColor: "bg-cyan-500/10"
  },
  {
    title: "Smart Scheduling",
    description: "Plan your content calendar with our intuitive scheduling system. Set publication dates and automate your workflow.",
    icon: Calendar,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  {
    title: "SEO Optimization",
    description: "Optimize your content for search engines with built-in SEO tools, keyword suggestions, and performance tracking.",
    icon: Search,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-500/10"
  },
  {
    title: "Social Sharing",
    description: "Share your content seamlessly across social media platforms with one-click publishing and scheduling.",
    icon: Share,
    iconColor: "text-violet-500",
    bgColor: "bg-violet-500/10"
  }
];

interface StyledButtonProps extends Omit<ButtonProps, 'asChild'> {
  href: string;
  children: ReactNode;
}

const StyledButton = ({ href, children, variant = "default", className, ...props }: StyledButtonProps) => (
  <Button asChild variant={variant} size="lg" className={className} {...props}>
    <a href={href}>{children}</a>
  </Button>
);

const Home: NextPage = (): ReactElement => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Your AI-Powered Content Platform
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Create, manage, and optimize your content with cutting-edge AI tools. From text to images, voice to websites - everything you need in one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <StyledButton href="/signup" className="bg-blue-600 hover:bg-blue-700">
              Get Started
              <IconWrapper icon={ArrowRight} className="ml-2" />
            </StyledButton>
            <StyledButton href="/login" variant="outline" className="border-zinc-700">
              Sign In
            </StyledButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything You Need to Create Amazing Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Content Creation?
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Join thousands of creators who are already using our platform to create amazing content with AI.
          </p>
          <StyledButton href="/signup" className="bg-blue-600 hover:bg-blue-700">
            Start Creating Now
            <IconWrapper icon={ArrowRight} className="ml-2" />
          </StyledButton>
        </div>
      </section>
    </div>
  );
};

export default Home;
