// @ts-nocheck
'use client';

// @ts-ignore - Ignoring TypeScript errors for component rendering
import { type ReactElement, type ReactNode, useState } from 'react';
import { type NextPage } from 'next';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  ArrowRight,
  Star,
  Search,
  Share,
  MessageSquare,
  Globe,
  Briefcase,
  Users,
  FileText,
  LineChart,
  Brain,
  Building,
  Package,
  LayoutDashboard,
  FileSpreadsheet,
  type LucideProps,
  Zap,
  Timer,
  Info,
  Menu,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ForwardRefExoticComponent, RefAttributes, ComponentType } from 'react';

const cn = (...inputs: (string | undefined)[]) => twMerge(clsx(inputs));

type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

interface FeatureCardProps {
  title: string;
  description: string;
  // @ts-ignore
  icon: any;
  iconColor: string;
  bgColor: string;
  connections?: string[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// @ts-ignore
const IconWrapper = ({ icon: Icon, className }: { icon: any; className?: string }) => (
  <Icon className={cn('w-6 h-6', className)} />
);

const FeatureCard = ({ title, description, icon, iconColor, bgColor, connections }: FeatureCardProps) => (
  <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-700/50 hover:border-zinc-600">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 ${bgColor} rounded-lg`}>
        <IconWrapper icon={icon} className={iconColor} />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-zinc-400 mb-4">{description}</p>
    {connections && (
      <div className="mt-2">
        <p className="text-xs text-zinc-500 mb-1">Connects with:</p>
        <div className="flex flex-wrap gap-1">
          {connections.map((connection, idx) => (
            <span key={idx} className="text-xs bg-zinc-700/70 text-zinc-300 px-2 py-1 rounded-md">
              {connection}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const features: FeatureCardProps[] = [
  {
    title: "AI Core (Chat + Search)",
    description: "Leverage multi-model AI enhanced with web search integration for up-to-date information, research, content generation, and data analysis across the platform.",
    icon: Brain,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
    connections: ["All Modules", "Real-time Web Data"]
  },
  {
    title: "Company Hub",
    description: "Define your brand identity and catalog your products/services. Enhance positioning with search-powered competitor research.",
    icon: Building,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    connections: ["Proposals", "Website", "Content Suite"]
  },
  {
    title: "Lead Management",
    description: "Capture and score leads, track communication, and manage your sales pipeline. Enhanced with search for real-time data enrichment.",
    icon: Users,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    connections: ["Proposals", "Projects", "Marketing"]
  },
  {
    title: "Proposal Generator",
    description: "Create professional proposals with AI assistance, pulling data from leads, products, and company branding. Add timely client-specific insights with search.",
    icon: FileText,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
    connections: ["Leads", "Projects", "Presentations"]
  },
  {
    title: "Project Management",
    description: "Plan projects with AI assistance, track tasks, collaborate with your team, and manage documents. Research directly within project context.",
    icon: Briefcase,
    iconColor: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    connections: ["Proposals", "Content", "Website"]
  },
  {
    title: "Content Suite",
    description: "Generate blogs, social media, emails, and presentations using your brand voice, product info, and trending topics from search.",
    icon: MessageSquare,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-500/10",
    connections: ["Website", "Leads", "Brand"]
  },
  {
    title: "Website Builder",
    description: "Create branded websites showcasing your content, products, projects, and capturing leads. Use search integration for SEO strategy.",
    icon: Globe,
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    connections: ["Content", "Brand", "Leads"]
  },
  {
    title: "Web Scraping",
    description: "Complement search with targeted extraction of specific data points from designated websites for deeper lead enrichment and competitor analysis.",
    icon: Search,
    iconColor: "text-red-500",
    bgColor: "bg-red-500/10",
    connections: ["Leads", "Products", "AI Core"]
  }
];

interface WorkflowStepProps {
  number: number;
  title: string;
  description: string;
  modules: string[];
}

const WorkflowStep = ({ number, title, description, modules }: WorkflowStepProps) => (
  <div className="relative">
    <div className="flex items-start">
      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-zinc-400 mt-1">{description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {modules.map((module, idx) => (
            <span key={idx} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-md">
              {module}
            </span>
          ))}
        </div>
      </div>
    </div>
    {number < 5 && (
      <div className="absolute left-6 top-12 h-full border-l-2 border-blue-600/30"></div>
    )}
  </div>
);

const workflow: WorkflowStepProps[] = [
  {
    number: 1,
    title: "Capture & Enrich Leads",
    description: "Leads flow into your system from your website, with AI and search automatically enriching their profiles with company data.",
    modules: ["Lead Management", "Web Scraping", "AI Core"]
  },
  {
    number: 2,
    title: "Generate Tailored Proposals",
    description: "Create personalized proposals that pull from your products, branding, and lead data - enhanced with recent client-specific insights.",
    modules: ["Proposal Generator", "Company Hub", "Content Suite", "AI Core"]
  },
  {
    number: 3,
    title: "Manage Projects Efficiently",
    description: "Convert won proposals into projects, with AI helping plan milestones and tasks based on proposal scope.",
    modules: ["Project Management", "AI Core", "Proposals"]
  },
  {
    number: 4,
    title: "Create & Publish Content",
    description: "Generate marketing content and case studies from completed projects, using your brand voice and up-to-date industry data.",
    modules: ["Content Suite", "Company Hub", "Projects", "AI Core"]
  },
  {
    number: 5,
    title: "Showcase Work & Generate New Leads",
    description: "Update your website with new portfolio items, automatically feeding new leads back into your system.",
    modules: ["Website Builder", "Lead Management", "Projects", "Content Suite"]
  }
];

interface BenefitProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
}

const Benefit = ({ icon, title, description }: BenefitProps) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 p-3 bg-blue-500/10 rounded-lg">
      <IconWrapper icon={icon} className="text-blue-500" />
    </div>
    <div className="ml-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  </div>
);

interface StyledButtonProps extends Omit<ButtonProps, 'asChild'> {
  href: string;
  children: ReactNode;
}

const StyledButton = ({ href, children, variant = "default", className, ...props }: StyledButtonProps) => (
  <Button asChild variant={variant} size="lg" className={className} {...props}>
    <a href={href}>{children}</a>
  </Button>
);

const InfoCard = ({ title, value, info }: { title: string; value: string; info: string }) => (
  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center transition-all duration-300 hover:bg-zinc-700/50 hover:border-zinc-600">
    <h3 className="text-lg text-zinc-400 mb-2">{title}</h3>
    <p className="text-3xl font-bold mb-2">{value}</p>
    <p className="text-sm text-zinc-500">{info}</p>
  </div>
);

const Home: NextPage = (): ReactElement => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">QanDu AI</span>
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-zinc-300 hover:text-white text-sm font-medium">Features</a>
              <a href="#workflow" className="text-zinc-300 hover:text-white text-sm font-medium">Workflow</a>
              <a href="#who-is-it-for" className="text-zinc-300 hover:text-white text-sm font-medium">Who Is It For</a>
              <a href="#pricing" className="text-zinc-300 hover:text-white text-sm font-medium">Pricing</a>
              <Button variant="outline" size="sm" className="ml-4 border-zinc-700">
                Sign In
              </Button>
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-zinc-400 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-zinc-900 border-b border-zinc-800">
              <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white">Features</a>
              <a href="#workflow" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white">Workflow</a>
              <a href="#who-is-it-for" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white">Who Is It For</a>
              <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white">Pricing</a>
              <div className="pt-4 pb-3 border-t border-zinc-700">
                <a href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white">Sign In</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative z-10 container mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-8 text-center lg:text-left mb-10 lg:mb-0">
            <span className="inline-block bg-blue-500/20 text-blue-400 text-sm font-medium px-3 py-1 rounded-full mb-4">
              For MENA Entrepreneurs Launching in the US
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              The AI-Powered Business OS That Helps MENA Founders Conquer the US Market
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-8">
              Reduce tool costs by 70% and increase productivity by 40% with our integrated platform for US operations, lead management, proposals, projects, and AI-powered content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-center lg:justify-start">
              <StyledButton href="#request-access" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Request Early Access
                <IconWrapper icon={ArrowRight} className="ml-2" />
              </StyledButton>
              <StyledButton href="#features" variant="outline" className="border-zinc-700 w-full sm:w-auto">
                Explore Features
              </StyledButton>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="overflow-hidden rounded-lg shadow-2xl shadow-blue-900/20 border border-zinc-700">
              <img 
                src="/images/platform-dashboard.webp" 
                alt="QanDu AI Platform Dashboard" 
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.height = '350px';
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.display = 'flex';
                  e.currentTarget.style.alignItems = 'center';
                  e.currentTarget.style.justifyContent = 'center';
                  e.currentTarget.innerText = 'QanDu AI Platform Dashboard';
                }}
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium shadow-xl">
              Launching June 2024
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard 
            title="Tool Replacement" 
            value="7+" 
            info="Replace 7+ separate tools with one integrated platform" 
          />
          <InfoCard 
            title="Cost Reduction" 
            value="70%" 
            info="Average savings on monthly SaaS expenses" 
          />
          <InfoCard 
            title="Productivity Boost" 
            value="40%" 
            info="Average increase in team productivity" 
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Business Operating System
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              An integrated ecosystem where modules work together, enhanced by AI and real-time web intelligence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                {...feature} 
                onMouseEnter={() => setActiveFeature(feature.title)}
                onMouseLeave={() => setActiveFeature(null)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-4 bg-zinc-800/50" id="workflow">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lead-to-Revenue Workflow
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              See how QanDu AI seamlessly connects every step of your business process
            </p>
          </div>
          <div className="space-y-10">
            {workflow.map((step) => (
              <WorkflowStep key={step.number} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* NEW: Detailed Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explore Key Platform Features
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Every feature of QanDu AI is designed to streamline your business operations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">AI-Powered Assistant</h3>
                  <p className="text-zinc-400 mt-2">
                    Access multiple AI models with integrated search capabilities to get real-time market insights, competitor analysis, and answer complex business questions.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400 ml-14">
                <li className="flex items-center">
                  <span className="bg-blue-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Multi-model AI access (GPT-4o, Llama 3, and more)
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Real-time web search integration for up-to-date information
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Document analysis and data extraction capabilities
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Building className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">Company Setup & Branding</h3>
                  <p className="text-zinc-400 mt-2">
                    Define your brand identity and catalog your products/services with tools specifically designed for MENA entrepreneurs entering the US market.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400 ml-14">
                <li className="flex items-center">
                  <span className="bg-emerald-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  US-compliant company formation guidance
                </li>
                <li className="flex items-center">
                  <span className="bg-emerald-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Brand identity management with visual asset storage
                </li>
                <li className="flex items-center">
                  <span className="bg-emerald-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Product catalog with AI-assisted descriptions
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">Lead & Client Management</h3>
                  <p className="text-zinc-400 mt-2">
                    Capture, score, and manage leads with automatic data enrichment from web sources. Track all client communications in a centralized system.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400 ml-14">
                <li className="flex items-center">
                  <span className="bg-yellow-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Automatic lead capture from website forms
                </li>
                <li className="flex items-center">
                  <span className="bg-yellow-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  AI lead scoring and profile enrichment
                </li>
                <li className="flex items-center">
                  <span className="bg-yellow-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Complete sales pipeline management
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">Proposal Generator</h3>
                  <p className="text-zinc-400 mt-2">
                    Create professional, personalized proposals that automatically pull data from your leads, products, and company branding.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400 ml-14">
                <li className="flex items-center">
                  <span className="bg-purple-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  AI-assisted proposal writing with customizable templates
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Automatic client data and project scope integration
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Digital signature and approval workflows
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">Project Management</h3>
                  <p className="text-zinc-400 mt-2">
                    Plan projects with AI assistance, track tasks, collaborate with your team, and manage all project documentation.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400 ml-14">
                <li className="flex items-center">
                  <span className="bg-cyan-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  AI-assisted project planning and timeline generation
                </li>
                <li className="flex items-center">
                  <span className="bg-cyan-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Task management with Kanban and timeline views
                </li>
                <li className="flex items-center">
                  <span className="bg-cyan-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Team collaboration tools with document management
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-pink-500/10 rounded-lg">
                  <LayoutDashboard className="h-6 w-6 text-pink-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">Content Suite</h3>
                  <p className="text-zinc-400 mt-2">
                    Generate blogs, social media, emails, and presentations using your brand voice, product info, and up-to-date industry insights.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400 ml-14">
                <li className="flex items-center">
                  <span className="bg-pink-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  AI content generation customized to your brand voice
                </li>
                <li className="flex items-center">
                  <span className="bg-pink-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Multi-format outputs (blog posts, emails, social content)
                </li>
                <li className="flex items-center">
                  <span className="bg-pink-500/20 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Content calendar and scheduled publishing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose QanDu AI Platform
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Built specifically for MENA founders expanding to the US market
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Benefit 
              icon={Zap} 
              title="Effortless US Setup & Operations" 
              description="One platform manages the entire business lifecycle from company formation to daily operations."
            />
            <Benefit 
              icon={Brain} 
              title="AI-Accelerated Workflow" 
              description="Save time on content creation, proposals, and planning with our intelligent AI assistance."
            />
            <Benefit 
              icon={Search} 
              title="Stay Informed with Real-Time Data" 
              description="Make smarter decisions with integrated web search providing up-to-date market insights."
            />
            <Benefit 
              icon={LayoutDashboard} 
              title="Work Seamlessly Across Modules" 
              description="Eliminate data silos and tool juggling with our deeply integrated platform."
            />
            <Benefit 
              icon={Globe} 
              title="Built for MENA Founders" 
              description="Addressing the specific challenges faced by entrepreneurs from the region operating internationally."
            />
            <Benefit 
              icon={FileSpreadsheet} 
              title="Compliant Documentation" 
              description="Generate US-standard business documents, proposals, and legal templates with ease."
            />
          </div>
        </div>
      </section>

      {/* NEW: Who Is It For Section */}
      <section className="py-20 px-4" id="who-is-it-for">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Who Is QanDu AI For?
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Designed specifically for MENA entrepreneurs with global ambitions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 transition-all duration-300 hover:bg-zinc-700/50 hover:border-zinc-600">
              <div className="w-14 h-14 bg-blue-500/10 flex items-center justify-center rounded-full mb-4">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">E-commerce Sellers</h3>
              <p className="text-zinc-400 mb-4">
                MENA entrepreneurs selling products to the US market who need a complete solution for business formation, client management, and marketing operations.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Streamlined product catalog management
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  US-compliant documentation and contracts
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Integrated marketing and content generation
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 transition-all duration-300 hover:bg-zinc-700/50 hover:border-zinc-600">
              <div className="w-14 h-14 bg-purple-500/10 flex items-center justify-center rounded-full mb-4">
                <LineChart className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">SaaS Founders</h3>
              <p className="text-zinc-400 mb-4">
                Technology entrepreneurs developing software products who need US market presence, lead generation, and customer relationship management.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  End-to-end lead capture and nurturing
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Proposal and project management integration
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  AI-powered market research and competitor analysis
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 transition-all duration-300 hover:bg-zinc-700/50 hover:border-zinc-600">
              <div className="w-14 h-14 bg-green-500/10 flex items-center justify-center rounded-full mb-4">
                <Star className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Freelancers & Agencies</h3>
              <p className="text-zinc-400 mb-4">
                Creative professionals and service agencies that work with US clients and need professional tools for client acquisition, project delivery, and content creation.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Professional proposal and presentation creator
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Client-facing dashboards and collaboration tools
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Streamlined content production and delivery
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Pricing Placeholder Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pricing Plans
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              Find the perfect plan for your business needs
            </p>
            <div className="inline-block bg-zinc-800/70 px-6 py-4 rounded-lg mb-8">
              <div className="flex items-center gap-2 text-yellow-400">
                <Timer className="w-5 h-5" />
                <span className="font-semibold">Early Access Pricing Coming Soon!</span>
              </div>
              <p className="text-zinc-400 mt-2">
                Join our waitlist to be notified when we launch and receive exclusive early access offers.
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Join the Waitlist
              <IconWrapper icon={ArrowRight} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* NEW: Final CTA Section */}
      <section className="py-20 px-4" id="request-access">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your US Business Operations?
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            QanDu AI is launching soon. Request early access now to be among the first users and help shape the future of business tools for MENA entrepreneurs.
          </p>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">Request Early Access</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-zinc-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company"
                  placeholder="Your Company"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Request Access
              </Button>
              <p className="text-xs text-zinc-500">
                By requesting access, you agree to our Terms of Service and Privacy Policy. We'll notify you when early access becomes available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900/80 border-t border-zinc-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 mb-4">QanDu AI</h3>
              <p className="text-zinc-400 text-sm">
                The AI-Powered Business Operating System for MENA Entrepreneurs expanding to the US market.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase text-zinc-400 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-zinc-300 hover:text-white text-sm">Features</a></li>
                <li><a href="#workflow" className="text-zinc-300 hover:text-white text-sm">Workflow</a></li>
                <li><a href="#pricing" className="text-zinc-300 hover:text-white text-sm">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase text-zinc-400 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-zinc-300 hover:text-white text-sm">Blog</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white text-sm">Documentation</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white text-sm">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase text-zinc-400 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-zinc-300 hover:text-white text-sm">About Us</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white text-sm">Contact</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white text-sm">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
            © 2024 QanDu AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
