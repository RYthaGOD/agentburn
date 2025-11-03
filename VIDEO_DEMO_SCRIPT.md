# 🎬 GigaBrain Demo Video Script
## 3-Minute Hackathon Submission Video

**Target Length:** 2:40 - 3:00 minutes  
**Track:** Best x402 Agent Application  
**Tone:** Professional, enthusiastic, demo-focused

---

## 📹 Recording Setup

### Recommended Tools
1. **Loom** (loom.com) - Free, browser-based, easy upload to YouTube
2. **OBS Studio** - Free, professional quality
3. **Chrome Built-in** - chrome://extensions → Screen recorder extensions

### Recording Tips
- ✅ Test audio before recording (use built-in mic or headset)
- ✅ Close unnecessary tabs
- ✅ Set browser zoom to 100%
- ✅ Rehearse once before final recording
- ✅ Have your Replit app open and ready

---

## 🎯 Video Script with Timestamps

### **[0:00 - 0:20] INTRO - Project Overview**
**Screen:** Show Replit project homepage / README

**Script:**
> "Hi! I'm presenting **GigaBrain**, an autonomous AI trading bot for the x402 Hackathon. GigaBrain uses x402 micropayments to power fully autonomous token burns for Solana memecoins. 
>
> Instead of paying for expensive data subscriptions, GigaBrain agents pay just half a cent per burn using x402 USDC micropayments - creating a true agent-to-agent economy. Let me show you how it works."

**On Screen:**
- Project title visible
- Quick pan over README features
- Transition to live app

---

### **[0:20 - 1:00] SETUP - Dashboard & Configuration**
**Screen:** Navigate to published Replit app

**Script:**
> "Here's the GigaBrain dashboard running live on Replit. 
>
> [Navigate to Agentic Burn page]
>
> This is where you configure autonomous burns - completely no-code. Let me set up a burn rule:
>
> - Profit threshold: 10% - that means burn only when we're profitable
> - Burn percentage: 25% - we'll burn a quarter of our profits
> - Service fee: $0.005 USDC via x402 micropayment
>
> [Click through configuration UI]
>
> Notice there's no subscription, no monthly fees - just pay-per-use micropayments when the agent actually performs a burn. This is the x402 agent economy in action."

**On Screen:**
- Show Agentic Burn dashboard
- Highlight configuration fields:
  - Profit threshold slider
  - Burn percentage input
  - x402 fee display ($0.005)
- Show "Test Burn" button

---

### **[1:00 - 2:00] LIVE DEMO - Agent Execution**
**Screen:** Browser console + App logs

**Script:**
> "Now let's see it in action. I'm going to trigger a test burn.
>
> [Click 'Test Agentic Burn' button]
>
> Watch what happens:
>
> First, the AI agent detects our profit threshold is met.
> [Point to log: '🎯 Profit threshold met']
>
> Second, it executes an x402 micropayment - $0.005 USDC to pay for the burn service.
> [Point to log: '💳 x402 payment confirmed']
>
> Third, it calls our Solana program to burn the tokens on-chain.
> [Point to log: '🔥 Burn executed']
>
> And there's the transaction signature! [Point to tx hash]
>
> This entire flow happened autonomously - the AI agent paid for premium data via x402, made the decision, and executed the burn without any human intervention."

**On Screen:**
- Click "Test Agentic Burn" button
- Split screen or zoom on browser console showing:
  ```
  🎯 Profit threshold met: 1000 basis points
  💳 x402 Payment: $0.005 USDC
  ✅ Payment confirmed: 5k3d8j...
  🔥 Executing burn...
  ✅ Burn complete: 2hB9pL...
  ```
- Highlight the transaction signature
- Show burn statistics update

---

### **[2:00 - 2:40] BENEFITS - Value Proposition**
**Screen:** Show stats/metrics dashboard

**Script:**
> "So why does this matter?
>
> Traditional burn mechanisms require:
> - Manual execution
> - Expensive data subscriptions
> - 24/7 monitoring
>
> GigaBrain solves all three:
> [Point to benefits on screen]
>
> ✅ Fully autonomous - AI runs 24/7 using DeepSeek V3's free tier
> ✅ Pay-per-use - Only $0.005 per burn via x402, no subscriptions
> ✅ Optimal timing - AI burns at peak moments for 10-20% better ROI
> ✅ Transparent - All payments and burns are on-chain
>
> For memecoin creators, this means your tokenomics work on autopilot, creating deflationary pressure right when it matters most."

**On Screen:**
- Show AI Trading dashboard with metrics
- Highlight stats:
  - Total burns executed
  - Total paid via x402
  - Success rate
- Show cost comparison:
  - Traditional: $99/month subscription
  - GigaBrain: $0.005 per burn

---

### **[2:40 - 3:00] CLOSE - Call to Action**
**Screen:** Return to project overview / GitHub

**Script:**
> "GigaBrain is open source and ready to deploy. The Anchor program code, x402 integration, and full-stack dashboard are all in this repository.
>
> This showcases the future of the x402 agent economy - where AI agents autonomously pay each other for services, creating efficient, cost-effective automation.
>
> Check out the repo, try the live demo, and let me know what you think. Thanks for watching!"

**On Screen:**
- Show repository structure briefly:
  - `/programs` - Anchor/Rust
  - `/scripts` - x402 integration
  - `/tests` - Simulations
- Show final slide:
  ```
  GigaBrain: Agentic Burn System
  
  🔗 Live Demo: [Replit URL]
  📁 Repository: [This project]
  🆔 Program ID: BurnGigaBrain11...
  
  Built for x402 Hackathon
  ```

---

## 🎬 Recording Instructions

### Step 1: Prepare Your Environment
```bash
# Open these in separate tabs:
1. Your Replit project (code view)
2. Published app URL
3. Browser console (F12)

# Make sure your app is running:
- Green "Running" indicator visible
- No errors in console
```

### Step 2: Record with Loom
1. Go to **loom.com**
2. Click **"Start Recording"**
3. Choose **"Screen + Camera"** (or just screen)
4. Select **"Current Tab"** (your Replit app)
5. Click **"Start Recording"**
6. Follow the script above
7. Click **"Stop"** when done

### Step 3: Edit (Optional)
- Loom allows trimming start/end
- Add captions if needed
- Cut out mistakes

### Step 4: Export & Upload
1. **Download from Loom** (MP4 file)
2. **Upload to YouTube:**
   - Title: "GigaBrain: Autonomous Token Burns with x402 Micropayments | Solana Hackathon"
   - Description: (Copy from HACKATHON_SUBMISSION.md)
   - Tags: solana, x402, ai, defi, hackathon, autonomous, burns
   - Visibility: **Unlisted** (for hackathon submission)
3. **Copy YouTube URL** and add to HACKATHON_SUBMISSION.md

---

## ✅ Pre-Recording Checklist

- [ ] App is running (green indicator)
- [ ] Browser console is open (F12)
- [ ] Zoom is at 100%
- [ ] Audio is working (test recording)
- [ ] Script is rehearsed once
- [ ] All tabs/windows needed are open
- [ ] Notifications are disabled
- [ ] Recording tool is ready

---

## 🎯 Key Points to Emphasize

1. **x402 Micropayments** - Show the $0.005 payment clearly
2. **Autonomy** - Emphasize "zero human intervention"
3. **Agent Economy** - AI paying AI for services
4. **Live Demo** - Real transaction signatures
5. **Innovation** - First autonomous burn system with x402

---

## 📊 Alternative: Screenshot Walkthrough

If video is difficult, create a **screenshot presentation**:

1. Take screenshots of each step
2. Add annotations/arrows in PowerPoint or Canva
3. Record voiceover over slides
4. Export as video

---

## 🔗 After Recording

Add video URL to:
- `HACKATHON_SUBMISSION.md` (Line with "Demo Video")
- Hackathon submission form
- Project README

**You're ready to record!** 🎥
