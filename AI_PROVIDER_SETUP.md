# AI Provider Setup Guide

This guide helps you add free AI API keys to power the hive mind trading system.

## 🎯 Quick Setup (Get 3-5 providers in 10 minutes)

### **Priority 1: Google Gemini** (Highest Volume - 1M tokens/min FREE)
1. Go to: https://aistudio.google.com
2. Click "Get API Key" → Create new project
3. Copy your API key
4. In Replit Secrets, add: `GOOGLE_AI_KEY = your_key_here`

**Why**: 1M tokens/min completely free, no credit card needed

---

### **Priority 2: DeepSeek V3** (5M Free Tokens)
1. Go to: https://platform.deepseek.com
2. Sign up (email or GitHub)
3. Go to API Keys → Create new key
4. Copy your API key
5. In Replit Secrets, add: `DEEPSEEK_API_KEY = your_key_here`

**Why**: 5M free tokens (~$8.40 value), ultra-cheap after (10-30x cheaper than GPT-4)

---

### **Priority 3: OpenRouter** (300+ Models, Free Tier)
1. Go to: https://openrouter.ai
2. Sign up with GitHub or email
3. Go to Keys → Create new key
4. Copy your API key  
5. In Replit Secrets, add: `OPENROUTER_API_KEY = your_key_here`

**Why**: Access to 300+ models, $5 free credits, great fallback option

---

### **Priority 4: Together AI** (Free Tier)
1. Go to: https://together.ai
2. Sign up (email or GitHub)
3. Navigate to API Keys
4. Create new key
5. In Replit Secrets, add: `TOGETHER_API_KEY = your_key_here`

**Why**: $25 free credits, 200+ models, good for variety

---

## ✅ Already Configured

You already have these API keys:
- ✅ **Cerebras** (CEREBRAS_API_KEY) - Working
- ✅ **Groq** (GROQ_API_KEY) - Hit rate limit (resets in 6 hours)
- ✅ **ChatAnywhere** (CHATANYWHERE_API_KEY) - Blocked by Chinese firewall

---

## 🚀 How It Works

Once you add API keys, the hive mind will:
1. **Query all available models in parallel** (up to 8 providers)
2. **Require 60% consensus** for BUY decisions
3. **Gracefully degrade** if some providers fail
4. **Load balance** across free tiers to avoid rate limits

---

## 📊 Provider Comparison

| Provider | Free Tier | Rate Limit | Best For |
|----------|-----------|------------|----------|
| **Google Gemini** | Unlimited | 1M tokens/min | High volume |
| **DeepSeek** | 5M tokens | No hard limit | Quality analysis |
| **Cerebras** | Free tier | Moderate | Speed |
| **OpenRouter** | $5 credits | Varies | Variety/fallback |
| **Together AI** | $25 credits | Variable | Experimentation |
| **Groq** | Free | 100K tokens/day | Backup |

---

## 🎬 Quick Start (Recommended)

**Minimum setup (2 providers):**
1. Add Google Gemini (5 min setup)
2. Add DeepSeek (5 min setup)

**Optimal setup (4-5 providers):**
1. Google Gemini
2. DeepSeek  
3. OpenRouter
4. Together AI

**Full redundancy (all 8):**
- Add all providers listed above for maximum reliability

---

## ⚡ After Setup

1. Restart the workflow (or it auto-restarts)
2. Check logs for: `[Hive Mind] Querying X AI models for consensus...`
3. You should see 3-8 models voting together
4. Watch for consensus messages showing multiple models

---

## 🔧 Troubleshooting

**"All AI providers failed":**
- You need at least 1 valid API key
- Check Secrets are named correctly (exact match)
- Restart the workflow

**"Only 1/X models responded":**
- Some providers may be rate limited
- This is OK - system works with 1+ models
- Add more providers for redundancy

**ChatAnywhere blocked:**
- Chinese firewall issue (can't fix)
- Use other providers instead
- Remove if causing issues

---

## 💰 Cost Breakdown

**100% Free Setup (Recommended):**
- Google Gemini: FREE (1M tokens/min)
- DeepSeek: 5M FREE tokens
- Cerebras: FREE tier
- Groq: FREE (100K tokens/day)

**Total Cost**: $0.00/month

**With Credits:**
- Add OpenRouter: $5 free credits
- Add Together AI: $25 free credits

**Total Value**: $30+ in credits, FREE

---

## 📝 Notes

- All providers use OpenAI-compatible APIs (easy integration)
- Hive mind automatically detects available providers
- No code changes needed - just add API keys
- More providers = more reliable trading decisions
- System designed to run on 100% free tiers

---

## 🎯 Next Steps

1. **Add at least 2-3 providers** (Google Gemini + DeepSeek + 1 more)
2. **Check logs** to verify all models are working
3. **Test the bot** with small amounts
4. **Monitor consensus** to see hive mind in action

**Get started now**: Go to Replit Secrets and add your first API key!
