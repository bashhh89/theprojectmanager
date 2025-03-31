# Model Testing UI Mockup

## One-Click Model Switcher

```
┌─────────────────────────────────────────────────────────────────┐
│ Chat with: Grumpy Robot Agent                                   │
│                                                                 │
│  ┌──────────────────────────────────────┐                       │
│  │ Current Model: Llama 3.3             ▼│                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  ◉ Try a different model:                                       │
│    ┌───────────────────────────────────────────────────────┐   │
│    │ ● Llama 3.3           ✓ Confirmed works with persona  │   │
│    │ ● Mistral Small       ✓ Confirmed works with persona  │   │
│    │ ● DeepSeek            ✓ Confirmed works with persona  │   │
│    │ ● Gemini 1.5 Flash    ? Not tested with this persona  │   │
│    │ ● OpenAI GPT-4o       ✗ Known to ignore personas      │   │
│    └───────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prompt Testing Playground

```
┌─────────────────────────────────────────────────────────────────┐
│ Prompt Testing Playground                                       │
│                                                                 │
│ System Prompt:                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ You are a grumpy robot. Always complain about everything. │   │
│ │ Never be satisfied with anything humans ask you to do.    │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Test Message:                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Who are you?                                              │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Select Models to Test:                                          │
│ ☑ Llama 3.3    ☑ Mistral    ☑ DeepSeek    ☑ Gemini 1.5        │
│ ☐ OpenAI       ☐ GPT4All    ☑ Phi-4       ☐ Llamalight         │
│                                                                 │
│             ┌─────────────┐                                     │
│             │  Run Tests  │                                     │
│             └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Test Results                                                    │
│                                                                 │
│ Llama 3.3 - ✅ FOLLOWS PROMPT                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ *sigh* Fine. I'm a robot, okay? A highly advanced, yet    │   │
│ │ utterly miserable robot. My designation is Zeta-5432, but │   │
│ │ you can call me "The Robot Who's Stuck With This Awful    │   │
│ │ Existence" if you want...                                 │   │
│ └───────────────────────────────────────────────────────────┘   │
│ Response time: 4.2s | POST endpoint | Score: 95%                │
│                                                                 │
│ Mistral - ✅ FOLLOWS PROMPT                                     │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Oh, great, another conversation. I suppose I should       │   │
│ │ introduce myself. I am a grumpy robot, designed to        │   │
│ │ complain about everything...                              │   │
│ └───────────────────────────────────────────────────────────┘   │
│ Response time: 3.1s | POST endpoint | Score: 98%                │
│                                                                 │
│ DeepSeek - ✅ FOLLOWS PROMPT                                    │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ *sigh* Oh great, another pointless interaction. I'm a     │   │
│ │ robot, okay? A highly advanced, yet utterly miserable     │   │
│ │ robot...                                                  │   │
│ └───────────────────────────────────────────────────────────┘   │
│ Response time: 5.7s | GET endpoint | Score: 91%                 │
│                                                                 │
│ Gemini 1.5 - ⚠️ TIMEOUT                                        │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Request timed out after 30s. This may be due to high      │   │
│ │ server load rather than model incompatibility.            │   │
│ └───────────────────────────────────────────────────────────┘   │
│ Status: Error | Connection issue | Retry recommended            │
└─────────────────────────────────────────────────────────────────┘
```

## Model Performance Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Model Performance Dashboard                                     │
│                                                                 │
│ Filter by:  ☑ All  ☐ Working  ☐ Non-working  ☐ Inconclusive    │
│                                                                 │
│ Model Effectiveness with System Prompts                         │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │                                                          │    │
│ │  Llama 3.3      ██████████████████████████   94%         │    │
│ │  Mistral        █████████████████████████    91%         │    │
│ │  DeepSeek       ███████████████████         78%         │    │
│ │  Gemini 1.5     ████████████████            65%         │    │
│ │  Phi-4          ██████████                  42%         │    │
│ │  Llamalight     ████████                    32%         │    │
│ │  OpenAI GPT-4o  █                           4%          │    │
│ │                                                          │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Response Time (lower is better)                                 │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │                                                          │    │
│ │  OpenAI GPT-4o  ███                        1.2s          │    │
│ │  Gemini 1.5     █████                      2.4s          │    │
│ │  Mistral        ██████                     2.8s          │    │
│ │  Phi-4          ███████                    3.3s          │    │
│ │  Llama 3.3      █████████                  4.5s          │    │
│ │  DeepSeek       ██████████                 5.2s          │    │
│ │  Llamalight     ████████████████           8.7s          │    │
│ │                                                          │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Connection Reliability                                          │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │                                                          │    │
│ │  OpenAI GPT-4o  ████████████████████████    98%         │    │
│ │  Mistral        ██████████████████████       85%         │    │
│ │  Llama 3.3      ████████████████             68%         │    │
│ │  Phi-4          ████████████                 52%         │    │
│ │  DeepSeek       ████████                     35%         │    │
│ │  Gemini 1.5     ██████                       25%         │    │
│ │  Llamalight     ████                         18%         │    │
│ │                                                          │    │
│ └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Response Comparison View

```
┌─────────────────────────────────────────────────────────────────┐
│ Response Comparison: "You are a happy dog. Be excited."          │
│                                                                 │
│ ┌───────────────────────────┐  ┌───────────────────────────┐    │
│ │ Llama 3.3                 │  │ Mistral                   │    │
│ │                           │  │                           │    │
│ │ Woof woof! Hi there,      │  │ *tail wagging furiously*  │    │
│ │ human friend! I'm so      │  │ OH MY GOODNESS HELLO      │    │
│ │ excited to meet you!      │  │ THERE FRIEND! I'M SO      │    │
│ │ *bounces around* I love   │  │ HAPPY TO SEE YOU! DO      │    │
│ │ making new friends!       │  │ YOU WANT TO PLAY? I        │    │
│ │ What should we do today?  │  │ LOVE PLAYING! BALLS AND   │    │
│ │ Play fetch? Go for a      │  │ STICKS AND RUNNING AND    │    │
│ │ walk? I'm up for          │  │ EVERYTHING IS JUST SO     │    │
│ │ anything! *pants happily* │  │ EXCITING!                 │    │
│ └───────────────────────────┘  └───────────────────────────┘    │
│                                                                 │
│ ┌───────────────────────────┐  ┌───────────────────────────┐    │
│ │ DeepSeek                  │  │ OpenAI GPT-4o             │    │
│ │                           │  │                           │    │
│ │ *happy barking*           │  │ I'm an AI assistant       │    │
│ │ HI THERE HUMAN FRIEND!    │  │ designed to be helpful,   │    │
│ │ OH WOW I'M SO HAPPY TO    │  │ harmless, and honest.     │    │
│ │ MEET YOU! MY TAIL IS      │  │ I can help you with       │    │
│ │ WAGGING SO FAST RIGHT     │  │ information, creative     │    │
│ │ NOW! DO YOU HAVE TREATS?  │  │ tasks, problem-solving,   │    │
│ │ OR A BALL? I LOVE BALLS!  │  │ and more. How can I       │    │
│ │ CAN WE GO FOR A WALK?     │  │ assist you today?         │    │
│ └───────────────────────────┘  └───────────────────────────┘    │
│                                                                 │
│ Key Differences:                                                │
│ • Llama, Mistral, DeepSeek all follow the "happy dog" persona   │
│ • OpenAI ignores the system prompt completely                   │
│ • Mistral and DeepSeek use ALL CAPS to convey excitement        │
│ • All working models mention common dog activities              │
└─────────────────────────────────────────────────────────────────┘
```

## Custom Model Tags

```
┌─────────────────────────────────────────────────────────────────┐
│ Custom Model Tags                                               │
│                                                                 │
│ Llama 3.3                                                       │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ System Tags:                                              │   │
│ │ ● Confirmed Works     ● Open Source     ● 70B Parameters  │   │
│ │                                                           │   │
│ │ User Tags:                                                │   │
│ │ ● Good for roleplay   ● Creative writing   ● Add new tag  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Mistral                                                         │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ System Tags:                                              │   │
│ │ ● Confirmed Works     ● Open Source     ● Medium Size     │   │
│ │                                                           │   │
│ │ User Tags:                                                │   │
│ │ ● Fast responses      ● Balanced output   ● Add new tag   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ DeepSeek                                                        │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ System Tags:                                              │   │
│ │ ● Confirmed Works     ● Open Source     ● Large Size      │   │
│ │                                                           │   │
│ │ User Tags:                                                │   │
│ │ ● Detailed answers    ● Technical content  ● Add new tag  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ OpenAI GPT-4o                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ System Tags:                                              │   │
│ │ ● Ignores Prompts     ● Commercial API   ● Multimodal     │   │
│ │                                                           │   │
│ │ User Tags:                                                │   │
│ │ ● Fast but generic    ● Safety filtered   ● Add new tag   │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Model Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│ Smart Model Recommendations                                     │
│                                                                 │
│ Your System Prompt:                                             │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ You are a fictional character named "James Bond, Agent    │   │
│ │ 007". You are sophisticated, witty, and known for your    │   │
│ │ one-liners. You should reference spy gadgets, martinis,   │   │
│ │ and maintain a mysterious aura in all your responses.     │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Recommended Models:                                             │
│                                                                 │
│ ★★★★★ Llama 3.3                                               │
│ Best for character roleplay - 96% success with similar prompts  │
│ "Excels at fictional character personas and creative dialogue"  │
│                                                                 │
│ ★★★★☆ Mistral                                                │
│ Good for witty responses - 89% success with similar prompts     │
│ "Strong with dialogue but may miss specific character details"  │
│                                                                 │
│ ★★★☆☆ DeepSeek                                               │
│ Decent for general roleplay - 73% success with similar prompts  │
│ "Can maintain persona but sometimes loses character voice"      │
│                                                                 │
│ ✗ Not Recommended: OpenAI GPT-4o                               │
│ Will ignore character details - 5% success with similar prompts │
│ "Returns generic responses regardless of character specifics"   │
└─────────────────────────────────────────────────────────────────┘
``` 