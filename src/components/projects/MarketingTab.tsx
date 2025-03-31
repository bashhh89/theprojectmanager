'use client';

import React, { useState } from 'react';

interface MarketingData {
  socialMedia?: {
    platforms?: Array<{
      name: string;
      strategy: string;
      postTypes: Array<{
        type: string;
        frequency: string;
        templates: Array<{
          description: string;
          imagePrompt: string;
          captionTemplate: string;
          hashtags: string[];
        }>;
      }>;
    }>;
    contentCalendar?: Array<{
      week: number;
      theme: string;
      posts: Array<{
        platform: string;
        content: string;
        imagePrompt: string;
        scheduledFor: string;
      }>;
    }>;
  };
  emailMarketing?: {
    campaigns?: Array<{
      name: string;
      type: 'welcome' | 'newsletter' | 'promotion' | 'announcement';
      subject: string;
      content: string;
      imagePrompts: string[];
    }>;
    automations?: Array<{
      trigger: string;
      sequence: Array<{
        delay: string;
        subject: string;
        content: string;
      }>;
    }>;
  };
}

// Sample data for empty states
const SAMPLE_MARKETING: MarketingData = {
  socialMedia: {
    platforms: [
      {
        name: 'Instagram',
        strategy: 'Focus on visual storytelling with high-quality images and short video content that showcases the product in real-world settings',
        postTypes: [
          {
            type: 'Product Showcase',
            frequency: '2-3 times per week',
            templates: [
              {
                description: 'Product in use highlighting key features',        
                imagePrompt: 'Professional photography of product being used in modern setting with soft natural lighting',
                captionTemplate: 'Discover how [feature] can transform your experience. #ProductHighlight',
                hashtags: ['#ProductName', '#Innovation', '#Design', '#UserExperience']
              }
            ]
          },
          {
            type: 'User Testimonials',
            frequency: 'Once per week',
            templates: [
              {
                description: 'Customer quotes with product images',
                imagePrompt: 'Stylized quote on gradient background with product image subtly integrated',
                captionTemplate: '"[customer quote]" - @customer_handle\nSee why our customers love our products!',
                hashtags: ['#CustomerLove', '#Testimonial', '#RealResults']     
              }
            ]
          }
        ]
      },
      {
        name: 'LinkedIn',
        strategy: 'Establish industry authority with in-depth content, case studies, and thought leadership pieces',
        postTypes: [
          {
            type: 'Industry Insights',
            frequency: 'Twice per week',
            templates: [
              {
                description: 'Data-driven insights and analysis',
                imagePrompt: 'Clean, professional infographic with key statistics and branded color scheme',
                captionTemplate: 'Our latest analysis reveals [key insight]. Here\'s what this means for your business:',
                hashtags: ['#IndustryTrends', '#DataInsights', '#BusinessStrategy']
              }
            ]
          },
          {
            type: 'Case Studies',
            frequency: 'Once per week',
            templates: [
              {
                description: 'Success stories with metrics',
                imagePrompt: 'Split image showing before/after or client logo with results achieved',
                captionTemplate: 'How we helped [Company] achieve [specific result] in just [timeframe]. Full case study in comments!',
                hashtags: ['#CaseStudy', '#BusinessResults', '#Success']
              }
            ]
          }
        ]
      }
    ],
    contentCalendar: [
      {
        week: 1,
        theme: 'Product Launch Preparation',
        posts: [
          {
            platform: 'Instagram',
            content: 'Teaser image revealing a small portion of the new product with intriguing caption',
            imagePrompt: 'Close-up detail shot of product with dramatic lighting and slight blur for mystery',
            scheduledFor: 'Monday, 9:00 AM'
          },
          {
            platform: 'LinkedIn',
            content: 'Industry analysis post explaining the gap in the market our new product will fill',
            imagePrompt: 'Professional graph showing market opportunity with branded styling',
            scheduledFor: 'Tuesday, 11:00 AM'
          }
        ]
      },
      {
        week: 2,
        theme: 'Official Launch',
        posts: [
          {
            platform: 'Instagram',
            content: 'Full product reveal with key features and benefits highlighted',
            imagePrompt: 'Professional hero shot of entire product with feature callouts',
            scheduledFor: 'Monday, 9:00 AM'
          },
          {
            platform: 'LinkedIn',
            content: 'Detailed announcement with pricing, availability, and early adopter testimonials',
            imagePrompt: 'Product image with testimonial quotes overlay in brand colors',
            scheduledFor: 'Monday, 2:00 PM'
          }
        ]
      }
    ]
  },
  emailMarketing: {
    campaigns: [
      {
        name: 'Product Launch',
        type: 'announcement',
        subject: 'Introducing Our Revolutionary New Product',
        content: 'We\'re excited to announce the launch of [Product Name], designed to solve [problem] with innovative [features]. Early adopters can save 15% with code LAUNCH15.',
        imagePrompts: ['Hero image of product with clean background', 'GIF showing product in use']
      },
      {
        name: 'Monthly Newsletter',
        type: 'newsletter',
        subject: 'Industry Updates & Exclusive Content | June Edition',
        content: 'This month\'s highlights include: [Feature 1], [Feature 2], and an exclusive interview with [Industry Expert].',
        imagePrompts: ['Newsletter header with current month theme', 'Curated collection of product and lifestyle imagery']
      }
    ],
    automations: [
      {
        trigger: 'New Signup',
        sequence: [
          {
            delay: 'Immediate',
            subject: 'Welcome to [Company Name]!',
            content: 'Thank you for joining our community! Here\'s what you can expect and how to get started with our products.'
          },
          {
            delay: '3 days',
            subject: 'Getting the Most Out of [Product Name]',
            content: 'Discover these 5 tips to maximize your experience with our product and achieve better results.'
          }
        ]
      },
      {
        trigger: 'Abandoned Cart',
        sequence: [
          {
            delay: '4 hours',
            subject: 'Your cart is waiting for you',
            content: 'We noticed you left some items in your cart. They\'re still saved for you when you\'re ready.'
          },
          {
            delay: '24 hours',
            subject: 'Special offer inside! Complete your purchase',
            content: 'We\'d love to see you complete your purchase. Use code SAVE10 for 10% off your order.'
          }
        ]
      }
    ]
  }
};

export function MarketingTab({ marketingData }: { marketingData?: MarketingData }) {
  const [showSampleData, setShowSampleData] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<string | null>(null);
  
  // Use either the actual data or sample data if showing samples
  const displayData = marketingData || (showSampleData ? SAMPLE_MARKETING : undefined);
  
  // Set the first platform as active when data loads
  React.useEffect(() => {
    if (displayData?.socialMedia?.platforms && displayData.socialMedia.platforms.length > 0) {
      setActivePlatformTab(displayData.socialMedia.platforms[0].name);
    }
  }, [displayData]);
  
  if (!displayData) {
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg text-center">
        <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <h3 className="text-xl font-semibold mb-3 text-gray-300">No Marketing Strategy Available</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">This project doesn't have any marketing details defined yet. Add marketing information to establish your project's promotional strategy.</p>
        <button
          onClick={() => setShowSampleData(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center mx-auto"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview Sample Marketing
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header with switcher if showing sample */}
      {showSampleData && !marketingData && (
        <div className="bg-blue-900/30 border border-blue-800/40 text-blue-200 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Viewing sample marketing data for preview purposes only</span>
          </div>
          <button
            onClick={() => setShowSampleData(false)}
            className="text-blue-300 hover:text-blue-200 text-sm"
          >
            Hide Sample
          </button>
        </div>
      )}
      
      {/* Social Media Section */}
      {displayData.socialMedia && displayData.socialMedia.platforms && displayData.socialMedia.platforms.length > 0 && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Social Media Strategy</h3>
          </div>
          
          {/* Platform Tabs */}
          <div className="bg-gray-900/50 rounded-lg mb-6 overflow-hidden border border-gray-800/50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {displayData.socialMedia.platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => setActivePlatformTab(platform.name)}
                  className={`px-4 py-3 whitespace-nowrap font-medium text-sm transition-colors duration-200
                    ${activePlatformTab === platform.name 
                      ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Active Platform Content */}
          {displayData.socialMedia.platforms.map((platform) => (
            <div key={platform.name} className={`${activePlatformTab === platform.name ? 'block' : 'hidden'}`}>
              <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50 mb-6">
                <h4 className="text-lg font-medium mb-2 text-gray-300">Strategy</h4>
                <p className="text-gray-400">{platform.strategy}</p>
              </div>
              
              <h4 className="text-lg font-medium mb-4 text-gray-300">Post Types</h4>
              <div className="space-y-6">
                {platform.postTypes.map((postType, index) => (
                  <div key={index} className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-lg">{postType.type}</h5>
                      <span className="px-3 py-1 bg-purple-900/30 rounded-full text-xs text-purple-400 border border-purple-800/40">
                        {postType.frequency}
                      </span>
                    </div>
                    
                    <div className="space-y-5">
                      {postType.templates.map((template, tIndex) => (
                        <div key={tIndex} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
                          <h6 className="font-medium text-sm mb-3 text-gray-300">{template.description}</h6>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Image Prompt</div>
                              <p className="text-sm text-gray-400 bg-gray-900/70 p-2 rounded border border-gray-800/50">
                                {template.imagePrompt}
                              </p>
                            </div>
                            
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Caption Template</div>
                              <p className="text-sm text-gray-400 bg-gray-900/70 p-2 rounded border border-gray-800/50">
                                {template.captionTemplate}
                              </p>
                            </div>
                          </div>
                          
                          {template.hashtags && template.hashtags.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs text-gray-500 mb-1">Hashtags</div>
                              <div className="flex flex-wrap gap-1">
                                {template.hashtags.map((hashtag, hIndex) => (
                                  <span key={hIndex} className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded">
                                    {hashtag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      
      {/* Content Calendar Section */}
      {displayData.socialMedia?.contentCalendar && displayData.socialMedia.contentCalendar.length > 0 && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Content Calendar</h3>
          </div>
          
          <div className="space-y-6">
            {displayData.socialMedia.contentCalendar.map((week) => (
              <div key={week.week} className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                <div className="flex items-center mb-4">
                  <div className="bg-green-900/30 text-green-400 h-8 w-8 rounded-full flex items-center justify-center font-semibold border border-green-800/40 mr-3">
                    {week.week}
                  </div>
                  <h4 className="text-lg font-medium text-gray-300">{week.theme}</h4>
                </div>
                
                <div className="space-y-3">
                  {week.posts.map((post, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
                      <div className="bg-gray-900/50 rounded p-2 flex items-center">
                        <span className="text-xs text-gray-500 mr-2">Platform:</span>
                        <span className="text-sm text-gray-300">{post.platform}</span>
                      </div>
                      
                      <div className="md:col-span-2 bg-gray-900/50 rounded p-2">
                        <span className="text-xs text-gray-500 block mb-1">Content:</span>
                        <span className="text-sm text-gray-300">{post.content}</span>
                      </div>
                      
                      <div className="bg-gray-900/50 rounded p-2 flex items-center">
                        <span className="text-xs text-gray-500 mr-2">Scheduled:</span>
                        <span className="text-sm text-gray-300">{post.scheduledFor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Email Marketing Section */}
      {displayData.emailMarketing && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Email Marketing</h3>
          </div>
          
          {/* Email Campaigns */}
          {displayData.emailMarketing.campaigns && displayData.emailMarketing.campaigns.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-4 text-gray-300">Campaigns</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayData.emailMarketing.campaigns.map((campaign, index) => (
                  <div key={index} className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-lg">{campaign.name}</h5>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${campaign.type === 'welcome' ? 'bg-green-900/30 text-green-400 border-green-800/40' : 
                          campaign.type === 'newsletter' ? 'bg-blue-900/30 text-blue-400 border-blue-800/40' :
                          campaign.type === 'promotion' ? 'bg-purple-900/30 text-purple-400 border-purple-800/40' : 
                          'bg-amber-900/30 text-amber-400 border-amber-800/40'}`}>
                        {campaign.type}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Subject Line</div>
                        <p className="text-sm bg-gray-800/60 p-2 rounded text-gray-300 border border-gray-700/50">
                          {campaign.subject}
                        </p>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Content</div>
                        <p className="text-sm bg-gray-800/60 p-2 rounded text-gray-300 border border-gray-700/50">
                          {campaign.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Email Automations */}
          {displayData.emailMarketing.automations && displayData.emailMarketing.automations.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-300">Automations</h4>
              <div className="space-y-6">
                {displayData.emailMarketing.automations.map((automation, index) => (
                  <div key={index} className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                    <h5 className="font-medium text-lg mb-3 flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Trigger: {automation.trigger}
                    </h5>
                    
                    <div className="space-y-3 ml-6 mt-4 relative before:absolute before:w-0.5 before:h-full before:bg-gray-700/50 before:left-0 before:top-0">
                      {automation.sequence.map((email, eIndex) => (
                        <div key={eIndex} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50 ml-6 relative">
                          <div className="absolute w-4 h-0.5 bg-gray-700/50 left-[-1.5rem] top-1/2"></div>
                          <div className="absolute w-3 h-3 rounded-full bg-gray-900 border border-gray-700 left-[-2.5rem] top-[calc(50%-0.375rem)]"></div>
                          
                          <div className="text-xs bg-gray-900/50 text-gray-400 px-2 py-1 rounded inline-block mb-2">{email.delay}</div>
                          
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-gray-500">Subject</div>
                              <p className="text-sm text-gray-300">{email.subject}</p>
                            </div>
                            
                            <div>
                              <div className="text-xs text-gray-500">Content</div>
                              <p className="text-sm text-gray-400">{email.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
} 