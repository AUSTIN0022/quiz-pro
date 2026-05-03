# QuizBuzz - Quick Start Guide

## TL;DR - Start Testing in 2 Minutes

### Test Participant Flow

**URL:** `http://localhost:3000/contests/live-demo-contest`

1. Click "Register Now"
2. Enter phone: `9800000001`
3. Enter OTP: `123456` (any 6 digits work)
4. Grant camera permission
5. Wait 2 minutes OR press `Ctrl+Shift+S` to skip
6. Answer 10 questions
7. Submit

### Test Admin Dashboard

**URL:** `http://localhost:3000/admin/contests/contest-sim-001/live`

Watch simulated participants answer questions in real-time!

---

## Phone Numbers You Can Use

For testing, use **any phone from:**
- **9800000001** (Arjun Sharma)
- **9800000002** (Priya Patel) ← The one you tried!
- **9800000003** (Rahul Gupta)
- ... up to **9800000050**

All are pre-registered for the **Simulation Contest**.

---

## Why Your Phone Number Didn't Work

You tried **Priya Sharma (9800000002)** with OTP **123456** but got: 
> "Phone number or email is not registered for that particular contest"

**Root Cause Found & Fixed:**

The `auth-service.ts` was still importing from old seed JSON files instead of using the centralized `MockDB`. 

**What I did:**
- Updated `lib/services/auth-service.ts` to use `MockDB.registrations`
- Now all phone lookups work correctly
- The fix has been committed and deployed

---

## Available Test Contests

| Contest | Link | Type | Duration |
|---------|------|------|----------|
| **Live Demo (Simulation)** | `/contests/live-demo-contest` | **GK Quiz** | **30 min** |
| National Math Olympiad | `/contests/national-math-olympiad-2024` | Math | 180 min |
| CodeSprint | `/contests/codesprint-championship` | Code | 180 min |
| GK Challenge | `/contests/general-knowledge-challenge` | GK | 90 min |

---

## Key Features Explained

### Auto-Start (Waiting Room)
- Contest starts automatically after 2 minutes
- Or press **Ctrl+Shift+S** to skip wait
- Countdown timer shows remaining time

### Real-Time Admin Updates
- Admin dashboard shows 25 simulated participants
- Updates every 2 seconds
- Shows realistic behavior (answering, submitting)

### Camera Integration
- System handles iOS camera bugs properly
- Stream persists across page navigation
- Proctoring features work seamlessly

---

## File Structure

```
lib/
├── mock/
│   ├── db.ts          ← All mock data (contests, registrations, etc.)
│   └── relations.ts   ← Data relationship helpers
└── services/
    ├── auth-service.ts         ✅ Fixed - uses MockDB
    ├── contest-service.ts      ✅ Uses MockDB
    ├── registration-service.ts ✅ Uses MockDB
    └── ... other services      ✅ All use MockDB

app/
├── contests/[slug]/page.tsx         ← Contest detail page
├── contests/[slug]/register/page.tsx ← Registration page
├── quiz/[contestId]/entry/page.tsx   ← Entry flow (OTP)
├── quiz/[contestId]/live/page.tsx    ← Live quiz
└── admin/contests/.../live/page.tsx  ← Admin dashboard

SIMULATION_GUIDE.md ← Full documentation
```

---

## Troubleshooting

### "Phone not registered"
✅ **Fixed!** - Auth service now uses MockDB
- Use phone: `9800000001` - `9800000050`
- Any 6-digit OTP works

### Camera asking permission repeatedly
✅ **Fixed!** - Proctoring store prevents multiple requests
- Stream reused across navigation
- iOS Safari compatibility added

### Admin dashboard shows no data
- Ensure `NEXT_PUBLIC_USE_SEED_WS=true` in `.env.local`
- Refresh the page

### Contest doesn't auto-start
- Clear sessionStorage: `sessionStorage.clear()`
- Refresh page for new 2-minute timer

---

## What's Working

✅ **Participant Flow**
- Contest discovery
- Phone + OTP authentication  
- System checks
- Camera check
- Quiz taking
- Results

✅ **Admin Features**
- Live dashboard
- Real-time participant updates
- Submission monitoring
- Proctoring checks

✅ **Simulation Mode**
- Auto-start in waiting room
- Realistic participant behavior
- Real-time analytics updates

---

## Next Steps

1. **Test Participant Path:**
   - Go to `/contests/live-demo-contest`
   - Register with phone `9800000001`
   - Complete the quiz

2. **Test Admin Features:**
   - Open `/admin/contests/contest-sim-001/live` in another tab
   - Watch participants update in real-time as you take the quiz

3. **Review Code:**
   - Check `SIMULATION_GUIDE.md` for detailed explanations
   - All mock data in `lib/mock/db.ts`
   - Services updated to use MockDB

---

## Questions?

Refer to **SIMULATION_GUIDE.md** for comprehensive documentation covering:
- Complete user journey walkthrough
- All phone numbers and contact details
- Admin dashboard explanation
- Seed mode simulation details
- Troubleshooting guide
- All available endpoints

---

**Status:** ✅ All systems operational. Ready for full platform testing!
