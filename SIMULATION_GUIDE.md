# QuizBuzz Platform - Simulation Guide

## Overview

The QuizBuzz platform uses a centralized mock database (`lib/mock/db.ts`) for testing and demonstrations. This guide explains how to simulate the complete user journey.

---

## Part 1: Joining a Contest (Participant Flow)

### The Simulation Contest: `contest-sim-001`

The special **"QuizBuzz Live Demo Contest"** is always active and is perfect for testing the complete flow.

**Contest Details:**
- **ID:** `contest-sim-001`
- **Name:** QuizBuzz Live Demo Contest
- **Duration:** 30 minutes
- **Questions:** 10 General Knowledge questions
- **Status:** Always active (good for testing at any time)
- **Fee:** Free
- **Participants:** 25 registered participants
- **Camera Required:** Yes (proctoring enabled)

### Step 1: Get a Valid Phone Number

The system has 50 pre-registered contacts. Here are the phone numbers for the first 10:

| Index | Full Name | Phone Number | Email |
|-------|-----------|--------------|-------|
| 1 | Arjun Sharma | **9800000001** | arjun.sharma1@gmail.com |
| 2 | Priya Patel | **9800000002** | priya.patel2@gmail.com |
| 3 | Rahul Gupta | **9800000003** | rahul.gupta3@gmail.com |
| 4 | Sneha Reddy | **9800000004** | sneha.reddy4@gmail.com |
| 5 | Vikram Malhotra | **9800000005** | vikram.malhotra5@gmail.com |
| 6 | Anjali Singh | **9800000006** | anjali.singh6@gmail.com |
| 7 | Rohan Kumar | **9800000007** | rohan.kumar7@gmail.com |
| 8 | Divya Verma | **9800000008** | divya.verma8@gmail.com |
| 9 | Aditya Bansal | **9800000009** | aditya.bansal9@gmail.com |
| 10 | Neha Iyer | **9800000010** | neha.iyer10@gmail.com |

**For testing:** You can use any phone from **9800000001** to **9800000050**

### Step 2: Navigate to the Contest

1. Open your browser and go to the contests page
2. Find "QuizBuzz Live Demo Contest" OR navigate directly to:
   - `/contests/live-demo-contest`
   - Or `/contests/contest-sim-001` (using contest ID)

### Step 3: Start Registration/Login

1. Click on the contest card to view details
2. Look for a **"Register Now"** or **"Take the Quiz"** button
3. You'll be taken to the **Entry page** (`/quiz/contest-sim-001/entry`)

### Step 4: Enter Phone Number and OTP

**Phone Number:**
- Enter any phone number from the table above, e.g., `9800000001`
- Or enter the number without +91 prefix: `9800000001`

**OTP:**
- The system accepts **any 6-digit OTP** as valid (it's a mock)
- Common test OTPs: `123456` or `000000`

### Step 5: Follow the Entry Flow

Once you enter valid credentials, you'll go through:

1. **OTP Verification** → System validates phone against registrations
2. **System Check** → Browser/device compatibility checks
3. **Camera Check** → Request camera permission (required for proctoring)
4. **Ready Screen** → Confirmation before entering the contest
5. **Auto-Start Waiting Room** → System will auto-start the contest after 2 minutes (you can also press **Ctrl+Shift+S** to skip the wait)

### Step 6: View Live Countdown

On the waiting room page:
- You'll see a countdown timer showing time until contest starts
- Participant count updates randomly (simulated)
- The system auto-starts the contest after 2 minutes OR when you press **Ctrl+Shift+S**

### Step 7: Take the Quiz

Once the contest starts (`/quiz/contest-sim-001/live`):
- Answer the 10 GK questions
- Questions are shuffled each time
- The quiz timer shows remaining time
- You can navigate backward through questions (allowed)
- Submit your answers to complete the contest

---

## Part 2: Admin Dashboard - Live Contest Monitoring

### For Admins: Viewing Live Data

To see the live contest data as an admin:

1. Navigate to `/admin/contests/contest-sim-001/live`

This is the **Admin Live Dashboard** which shows:
- Real-time participant status
- Current questions being answered
- Time remaining for each participant
- Estimated scores
- Submission status

### Seed Mode Simulation

The admin dashboard runs in **seed mode** when:
```
NEXT_PUBLIC_USE_SEED_WS=true
```

In seed mode:
- Simulated participants are generated from MockDB
- Real-time updates happen every 2 seconds
- Participants show realistic behavior:
  - Answering questions randomly
  - Progressing through the quiz
  - Submitting answers
  - Disconnecting (simulated)

### What You'll See

**Admin Dashboard** shows:
- List of 25 participants taking the contest
- For each participant:
  - Current question number
  - Time on current question
  - Answers count
  - Estimated score percentage
  - Status (in-progress, submitted, disconnected)

---

## Part 3: Complete User Journey - Step by Step

### Scenario: Testing the Full Flow

**Goal:** Register, take a quiz, and see admin dashboard updates

**Time Required:** ~5 minutes

### Steps:

1. **Open two browser windows:**
   - Window 1: Participant flow
   - Window 2: Admin dashboard

2. **Window 1 - Participant Side:**
   ```
   a. Go to: http://localhost:3000/contests/live-demo-contest
   b. Click "Register" or "Take Quiz"
   c. Enter phone: 9800000001
   d. Enter OTP: 123456
   e. Grant camera permission
   f. Wait for auto-start (or press Ctrl+Shift+S)
   g. Answer 10 GK questions
   h. Submit quiz
   ```

3. **Window 2 - Admin Side:**
   ```
   a. Go to: http://localhost:3000/admin/contests/contest-sim-001/live
   b. Watch the simulated participant list update in real-time
   c. See participants answering questions as you take the quiz
   d. Monitor participant count, scores, and progress
   ```

---

## Part 4: Why the Error "Phone Not Registered"

### Common Issue

You get the error: **"Phone number or email is not registered for that particular contest"**

### Root Causes & Solutions

#### 1. **Phone Number Not in Registration List**
- **Problem:** You used a phone number that's not registered for contest-sim-001
- **Solution:** Use phones from the range: **9800000001** to **9800000050**

#### 2. **Using Registration from Different Contest**
- **Problem:** You registered for another contest, not the simulation one
- **Solution:** Make sure you're accessing `/contests/live-demo-contest` for the simulation contest

#### 3. **Phone Format Issue**
- **Problem:** Using wrong format (+91 vs without prefix)
- **Solution:** The system handles both:
  - ✅ `9800000001` (works)
  - ✅ `+919800000001` (works)
  - ✅ `919800000001` (works)

#### 4. **Auth Service Not Using MockDB**
- **Problem:** Auth service was still reading from old seed JSON files
- **Solution:** Already fixed! Auth service now uses `MockDB.registrations`

---

## Part 5: Key Endpoints

### Participant Endpoints

| Route | Purpose |
|-------|---------|
| `/contests` | Browse all contests |
| `/contests/live-demo-contest` | View simulation contest details |
| `/contests/live-demo-contest/register` | Register for contest |
| `/quiz/contest-sim-001/entry` | Entry flow (phone + OTP) |
| `/quiz/contest-sim-001/system-check` | System compatibility check |
| `/quiz/contest-sim-001/waiting` | Waiting room (auto-starts in 2 min) |
| `/quiz/contest-sim-001/live` | Live quiz taking page |
| `/quiz/contest-sim-001/submitted` | Submission confirmation |
| `/results/contest-sim-001` | Results page |

### Admin Endpoints

| Route | Purpose |
|-------|---------|
| `/admin/contests` | All contests list |
| `/admin/contests/contest-sim-001/overview` | Contest overview |
| `/admin/contests/contest-sim-001/live` | **Live dashboard (real-time data)** |
| `/admin/contests/contest-sim-001/registrations` | Registrations list |
| `/admin/contests/contest-sim-001/submissions` | All submissions |
| `/admin/contests/contest-sim-001/results` | Final results |
| `/admin/contests/contest-sim-001/proctoring` | Proctoring violations |
| `/admin/contests/contest-sim-001/certificates` | Certificate management |

---

## Part 6: Key Features Explained

### Auto-Start Simulation (Waiting Room)

When you enter the waiting room:
1. System stores start time in `sessionStorage`
2. Contest auto-starts after 2 minutes
3. Countdown timer shows remaining time
4. You can manually trigger start with **Ctrl+Shift+S**

**Code Location:** `lib/hooks/useWaitingRoomSocket.ts` (lines 60-101)

### Real-Time Admin Updates (Seed Mode)

The admin dashboard simulates real-time participant activity:
1. Every 2 seconds, participants show new progress
2. They answer questions realistically
3. Some submit, some disconnect
4. Estimated scores update dynamically

**Code Location:** `lib/hooks/useAdminContestSocket.ts` (lines 57-90)

### Camera Stream Handling

The system properly handles camera streams across platforms:
1. Request camera permission once (iOS fix)
2. Stream persists across navigation
3. Proper error handling for different browsers

**Code Location:** `lib/stores/proctoring-store.ts` (lines 131-164)

---

## Part 7: Troubleshooting

### Issue: Contest-less Detail Page

**Problem:** You can't see a "Join the contest" button on the contest detail page.

**Why:** The detail page structure depends on:
- Whether user is logged in
- Contest status (published, active, expired)
- User's registration status
- Payment status

**Solution:** 
1. Check `/app/contests/[slug]/page.tsx`
2. The button routing logic is in the contest card component
3. For simulation contest, it should always show "Register/Take Quiz"

### Issue: Camera Permission Keeps Asking

**Problem:** System asks for camera permission multiple times.

**Why:** The iOS camera bug was requesting stream multiple times.

**Solution:** Already fixed in `proctoring-store.ts`. Stream now:
- Checks if already requested
- Reuses existing stream
- Only requests once per session

### Issue: No "Live" Data in Admin Dashboard

**Problem:** Admin dashboard shows no participants.

**Why:** Seed mode might not be enabled.

**Solution:** Check if `NEXT_PUBLIC_USE_SEED_WS=true` in `.env.local`

### Issue: Contest Auto-Starts Too Quickly

**Problem:** Contest auto-starts before you're ready.

**Why:** If `sessionStorage` was set from a previous attempt, the timer continues.

**Solution:** 
1. Clear browser `sessionStorage`: Press F12, Console, type: `sessionStorage.clear()`
2. Refresh the page
3. New 2-minute timer will start

---

## Part 8: Environment Configuration

### Required Environment Variables

**File:** `.env.local`

```bash
# Enable seed mode (simulated WebSocket)
NEXT_PUBLIC_USE_SEED_WS=true

# Socket URL (not used in seed mode)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### All Available Contests (for Testing)

| Contest ID | Name | Type | Duration | Questions |
|-----------|------|------|----------|-----------|
| `contest-001` | National Mathematics Olympiad | Hard | 180 min | 30 |
| `contest-002` | CodeSprint Championship | Hard | 180 min | 25 |
| `contest-003` | General Knowledge Challenge | Medium | 90 min | 20 |
| `contest-004` | Science Mastery Test | Medium | 120 min | 25 |
| `contest-005` | Business Management Quiz | Medium | 120 min | 30 |
| `contest-006` | English Language Test | Easy | 60 min | 15 |
| **`contest-sim-001`** | **QuizBuzz Live Demo** | **Medium** | **30 min** | **10** |

---

## Summary

**Quick Checklist:**

- [ ] Use phone number: `9800000001` to `9800000050`
- [ ] Use OTP: Any 6 digits (e.g., `123456`)
- [ ] Contest always active: `contest-sim-001`
- [ ] Auto-starts in 2 minutes (or Ctrl+Shift+S to skip)
- [ ] Admin dashboard at: `/admin/contests/contest-sim-001/live`
- [ ] Real-time updates in seed mode (every 2 seconds)
- [ ] Camera permission required for proctoring

**You're all set! Start testing the full platform now.** 🎯
