import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  BrainCircuit, Target, Briefcase, Copy, CheckSquare, 
  Megaphone, Palette, DollarSign, Settings, Box, Sparkles,
  LineChart, HeartHandshake, BarChart3, Handshake, Lock, Mail, ExternalLink, ArrowRight, Star, Plus, Scale, Users, LogIn, LogOut, MessageSquarePlus, LifeBuoy, MessageCircle
} from "lucide-react";

import { auth, db, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { usePaystackPayment } from "react-paystack";

// Base categories before randomization
const BASE_CATEGORIES = [
  {
    id: "product",
    title: "Product & Strategy",
    icon: <Box className="w-5 h-5 text-blue-500" />,
    isPremium: false,
    options: [
      { id: "p1", label: "Define the Minimum Viable Product (MVP) features" },
      { id: "p2", label: "Create a 6-month product roadmap" },
      { id: "p3", label: "Suggest a pricing model and tiers" },
      { id: "p4", label: "Conduct a mock competitor analysis" },
      { id: "p5", label: "Draft user stories for the development team" },
      { id: "p6", label: "Create a wireframe structure for the core app/site" },
      { id: "p7", label: "Identify key technical risks and mitigations" },
      { id: "p8", label: "Outline a pivot strategy if the MVP fails" }
    ]
  },
  {
    id: "branding",
    title: "Branding & Identity",
    icon: <Palette className="w-5 h-5 text-purple-500" />,
    isPremium: false,
    options: [
      { id: "b1", label: "Develop a brand voice and personality" },
      { id: "b2", label: "Suggest brand name ideas and domain names" },
      { id: "b3", label: "Create a mission and vision statement" },
      { id: "b4", label: "Recommend a color palette and typography" },
      { id: "b5", label: "Design a logo brief for a designer" },
      { id: "b6", label: "Create a brand guidelines outline" },
      { id: "b7", label: "Draft a founder's story for the 'About Us' page" },
      { id: "b8", label: "Suggest 3 core brand values" }
    ]
  },
  {
    id: "marketing",
    title: "Marketing & Growth",
    icon: <Megaphone className="w-5 h-5 text-pink-500" />,
    isPremium: false,
    options: [
      { id: "m1", label: "Create a 30-day go-to-market strategy" },
      { id: "m2", label: "Suggest 5 high-converting SEO content ideas" },
      { id: "m3", label: "Draft a social media launch calendar" },
      { id: "m4", label: "Identify key marketing channels for acquisition" },
      { id: "m5", label: "Draft 3 Facebook/Instagram Ad copies" },
      { id: "m6", label: "Create an influencer outreach list and strategy" },
      { id: "m7", label: "Design a viral waitlist loop" },
      { id: "m8", label: "Outline a PR press release for launch" }
    ]
  },
  {
    id: "sales",
    title: "Sales & Outreach",
    icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
    isPremium: false,
    options: [
      { id: "s1", label: "Write 3 cold email outreach templates" },
      { id: "s2", label: "Draft a sales script for discovery calls" },
      { id: "s3", label: "Create an objection handling cheat sheet" },
      { id: "s4", label: "Define the ideal customer profile (ICP) and buyer personas" },
      { id: "s5", label: "Design a B2B sales funnel" },
      { id: "s6", label: "Draft a LinkedIn outreach sequence" },
      { id: "s7", label: "Outline a sales commission structure" },
      { id: "s8", label: "Create a follow-up email sequence for lost leads" }
    ]
  },
  {
    id: "operations",
    title: "Operations & Tech",
    icon: <Settings className="w-5 h-5 text-orange-500" />,
    isPremium: false,
    options: [
      { id: "o1", label: "Recommend a scalable tech stack" },
      { id: "o2", label: "Create a checklist for legal and compliance basics" },
      { id: "o3", label: "Draft a 1-year hiring plan and key roles" },
      { id: "o4", label: "Suggest operational tools for CRM and project management" },
      { id: "o5", label: "Create a standard operating procedure (SOP) template" },
      { id: "o6", label: "Draft a data privacy policy outline" },
      { id: "o7", label: "Outline a disaster recovery plan" },
      { id: "o8", label: "Suggest a remote work communication policy" }
    ]
  },
  {
    id: "finance",
    title: "Financials & Fundraising",
    icon: <LineChart className="w-5 h-5 text-green-600" />,
    isPremium: true,
    options: [
      { id: "f1", label: "Outline a 10-slide investor pitch deck" },
      { id: "f2", label: "Define key unit economics (CAC, LTV, Payback Period)" },
      { id: "f3", label: "Draft a 12-month financial projection structure" },
      { id: "f4", label: "Create an investor outreach email template" },
      { id: "f5", label: "Draft a break-even analysis framework" },
      { id: "f6", label: "Create a pricing psychology strategy" },
      { id: "f7", label: "Outline an equity distribution plan for early employees" },
      { id: "f8", label: "Suggest alternative funding sources (Grants, Debt)" }
    ]
  },
  {
    id: "success",
    title: "Customer Success & Retention",
    icon: <HeartHandshake className="w-5 h-5 text-rose-500" />,
    isPremium: true,
    options: [
      { id: "cs1", label: "Design a 14-day user onboarding email sequence" },
      { id: "cs2", label: "Create a churn reduction and win-back strategy" },
      { id: "cs3", label: "Draft a customer feedback and NPS survey" },
      { id: "cs4", label: "Outline a VIP customer loyalty program" },
      { id: "cs5", label: "Draft a knowledge base structure" },
      { id: "cs6", label: "Create customer support macro templates" },
      { id: "cs7", label: "Design a community building strategy" },
      { id: "cs8", label: "Outline a user generated content (UGC) campaign" }
    ]
  },
  {
    id: "data",
    title: "Data & Analytics",
    icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
    isPremium: true,
    options: [
      { id: "d1", label: "Define the North Star metric and 5 key KPIs" },
      { id: "d2", label: "Design an A/B testing framework for the landing page" },
      { id: "d3", label: "Outline a user behavior tracking plan" },
      { id: "d4", label: "Suggest a data dashboard layout for the founding team" },
      { id: "d5", label: "Design a cohort analysis framework" },
      { id: "d6", label: "Draft a weekly reporting template for stakeholders" },
      { id: "d7", label: "Suggest tools for product analytics (e.g., Mixpanel)" },
      { id: "d8", label: "Outline a data governance and security policy" }
    ]
  },
  {
    id: "partnerships",
    title: "Partnerships & BizDev",
    icon: <Handshake className="w-5 h-5 text-amber-600" />,
    isPremium: true,
    options: [
      { id: "bd1", label: "Identify 5 strategic partnership opportunities" },
      { id: "bd2", label: "Draft an affiliate/referral program structure" },
      { id: "bd3", label: "Write a joint venture (JV) outreach email" },
      { id: "bd4", label: "Create a B2B channel sales strategy" },
      { id: "bd5", label: "Draft a co-marketing agreement outline" },
      { id: "bd6", label: "Create a partnership tier structure" },
      { id: "bd7", label: "Outline a white-labeling strategy" },
      { id: "bd8", label: "Suggest API integration partners" }
    ]
  },
  {
    id: "legal",
    title: "Legal & Risk Management",
    icon: <Scale className="w-5 h-5 text-slate-600" />,
    isPremium: true,
    options: [
      { id: "l1", label: "Outline Terms of Service and Privacy Policy requirements" },
      { id: "l2", label: "Identify key regulatory compliance risks (GDPR, CCPA)" },
      { id: "l3", label: "Draft an IP protection strategy (Trademarks, Patents)" },
      { id: "l4", label: "Create a vendor agreement checklist" },
      { id: "l5", label: "Outline an employee NDA and non-compete structure" },
      { id: "l6", label: "Suggest business insurance requirements" },
      { id: "l7", label: "Draft a co-founder agreement outline" },
      { id: "l8", label: "Identify cross-border tax implications" }
    ]
  },
  {
    id: "team",
    title: "Team & Culture",
    icon: <Users className="w-5 h-5 text-cyan-600" />,
    isPremium: true,
    options: [
      { id: "t1", label: "Define core company values and culture manifesto" },
      { id: "t2", label: "Draft a 30-60-90 day onboarding plan for new hires" },
      { id: "t3", label: "Create an employee performance review framework" },
      { id: "t4", label: "Suggest team building and morale initiatives" },
      { id: "t5", label: "Outline a compensation and benefits philosophy" },
      { id: "t6", label: "Draft a diversity, equity, and inclusion (DEI) policy" },
      { id: "t7", label: "Create an interview process and scoring rubric" },
      { id: "t8", label: "Suggest tools for asynchronous team collaboration" }
    ]
  }
];

const AFFILIATES = [
  { name: "Paystack", desc: "Payments for Africa", link: "#paystack-affiliate" },
  { name: "Shopify", desc: "Best for E-commerce", link: "#shopify-affiliate" },
  { name: "Notion", desc: "Workspace & Planning", link: "#notion-affiliate" },
  { name: "Hostinger", desc: "Affordable Web Hosting", link: "#hostinger-affiliate" }
];

export default function App() {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [email, setEmail] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  
  // Dynamic categories (shuffled on load)
  const [categories, setCategories] = useState(BASE_CATEGORIES);
  
  // Custom user options
  const [customOptions, setCustomOptions] = useState<Record<string, {id: string, label: string}[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  // Modals state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  
  // Feedback state
  const [feedbackType, setFeedbackType] = useState('feature');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [hasUnlockedPremium, setHasUnlockedPremium] = useState(false);
  const [hasProvidedEmail, setHasProvidedEmail] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Paystack Configuration
  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || email || "founder@startup.com",
    amount: 1500 * 100, // $15.00 in cents (assuming USD or equivalent local currency)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    currency: 'USD',
    metadata: {
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "userId",
          value: user?.uid || ""
        }
      ],
      userId: user?.uid // Also pass directly for easier webhook parsing
    }
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setEmail(currentUser.email || "");
        setHasProvidedEmail(true);
        
        // Check Firestore for Pro status
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setHasUnlockedPremium(userDoc.data().isPro === true);
          } else {
            // Create profile
            await setDoc(userDocRef, {
              email: currentUser.email,
              isPro: false,
              createdAt: serverTimestamp()
            });
            setHasUnlockedPremium(false);
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          if (error?.message?.includes("client is offline") || error?.message?.includes("offline")) {
            toast.error("Database connection blocked. Please disable your AdBlocker or VPN.");
          }
        }
      } else {
        setHasUnlockedPremium(false);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error?.code === 'auth/unauthorized-domain') {
        toast.error("Vercel domain must be authorized in Firebase Console.");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast.error("Login cancelled. You closed the popup.");
      } else {
        toast.error(`Login failed: ${error?.message || "Try again later."}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error(error);
    }
  };

  // Shuffle options on mount to prevent copying
  useEffect(() => {
    const shuffled = BASE_CATEGORIES.map(cat => ({
      ...cat,
      options: [...cat.options].sort(() => Math.random() - 0.5)
    }));
    setCategories(shuffled);
  }, []);

  const handleToggleOption = (id: string, isLocked: boolean, categoryId: string, maxSelect: number) => {
    if (isLocked) {
      setShowPremiumDialog(true);
      return;
    }

    setSelectedOptions(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        // Check limits
        const categoryOpts = categories.find(c => c.id === categoryId)?.options || [];
        const customOpts = customOptions[categoryId] || [];
        const allCatOptIds = [...categoryOpts, ...customOpts].map(o => o.id);
        
        let currentSelectedCount = 0;
        newSet.forEach(optId => {
          if (allCatOptIds.includes(optId)) currentSelectedCount++;
        });

        if (currentSelectedCount >= maxSelect) {
          toast.error(`You can only select up to ${maxSelect} items in this category.`);
          return prev;
        }
        
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (categoryOptions: {id: string}[], categoryId: string, isPremiumCategory: boolean) => {
    setSelectedOptions(prev => {
      const newSet = new Set(prev);
      
      // Only select unlocked options
      const unlockedOptions = categoryOptions.filter((_, index) => {
        const isLocked = isPremiumCategory && !hasUnlockedPremium && index >= 3;
        return !isLocked;
      });

      // Include custom options in the "Select All" logic
      const customOpts = customOptions[categoryId] || [];
      const allAvailable = [...unlockedOptions, ...customOpts];

      const allSelected = allAvailable.length > 0 && allAvailable.every(opt => newSet.has(opt.id));
      
      allAvailable.forEach(opt => {
        if (allSelected) {
          newSet.delete(opt.id);
        } else {
          newSet.add(opt.id);
        }
      });
      return newSet;
    });
  };

  const handleAddCustomOption = (categoryId: string, maxSelect: number) => {
    const text = customInputs[categoryId];
    if (!text || !text.trim()) return;
    
    // Check limits before adding and selecting
    const categoryOpts = categories.find(c => c.id === categoryId)?.options || [];
    const customOpts = customOptions[categoryId] || [];
    const allCatOptIds = [...categoryOpts, ...customOpts].map(o => o.id);
    
    let currentSelectedCount = 0;
    selectedOptions.forEach(optId => {
      if (allCatOptIds.includes(optId)) currentSelectedCount++;
    });

    if (currentSelectedCount >= maxSelect) {
      toast.error(`You can only select up to ${maxSelect} items in this category.`);
      return;
    }

    const newOpt = { id: `custom-${Date.now()}-${Math.random()}`, label: text.trim() };
    
    setCustomOptions(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newOpt]
    }));
    
    setCustomInputs(prev => ({ ...prev, [categoryId]: "" }));
    
    // Automatically select the newly added option
    setSelectedOptions(prev => new Set(prev).add(newOpt.id));
  };

  const generatePrompt = useMemo(() => {
    if (!niche || !audience) return "Please enter your business niche and target audience first.";
    if (selectedOptions.size === 0) return "Please select at least one aspect of your business to generate a prompt.";

    let prompt = `Act as an expert startup founder, business consultant, and strategist. I am building a new business in the **${niche}** space, specifically targeting **${audience}**.\n\n`;
    
    prompt += `### CRITICAL INSTRUCTIONS & GUARDRAILS\n`;
    prompt += `1. **Do not generate the entire plan at once.**\n`;
    prompt += `2. **Initiate Clarifications:** Start by asking me 3 to 5 highly specific, clarifying questions about my business model, budget, and unique value proposition.\n`;
    prompt += `3. **Wait for my response** before proceeding.\n`;
    prompt += `4. **Iterative Process:** Once I answer, guide me through the required sections ONE BY ONE. Ask questions per section to ensure the output is perfectly tailored.\n`;
    prompt += `5. **Limit Hallucinations:** Only recommend tools, strategies, and frameworks that are proven, factual, and currently relevant. Do not invent statistics or fake software.\n`;
    prompt += `6. **Provide Guardrails:** For each section, explicitly list 2-3 common pitfalls or "what NOT to do".\n\n`;

    prompt += `### REQUIRED SECTIONS TO COVER\n\n`;

    categories.forEach(category => {
      const allCatOptions = [...category.options, ...(customOptions[category.id] || [])];
      const selectedInCategory = allCatOptions.filter(opt => selectedOptions.has(opt.id));
      
      if (selectedInCategory.length > 0) {
        prompt += `#### ${category.title}\n`;
        selectedInCategory.forEach(opt => {
          prompt += `- ${opt.label}\n`;
        });
        prompt += `\n`;
      }
    });

    prompt += `Format your response clearly using markdown headers, bullet points, and bold text for emphasis. Remember: Start ONLY with your clarifying questions.`;

    return prompt;
  }, [niche, audience, selectedOptions, categories, customOptions]);

  const generatedPrompt = generatePrompt;

  const handleCopyRequest = () => {
    if (!niche || !audience || selectedOptions.size === 0) {
      toast.error("Please fill out the details and select options first.");
      return;
    }
    
    if (!user && !hasProvidedEmail) {
      setShowEmailDialog(true);
      return;
    }

    executeCopy();
  };

  const executeCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Prompt copied to clipboard!");
    setShowEmailDialog(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setHasProvidedEmail(true);
    toast.success("Email saved! You're subscribed to our growth newsletter.");
    executeCopy();
  };

  const handleUnlockPremium = async () => {
    if (!user) {
      toast.error("Please log in first to unlock Pro.");
      handleLogin();
      return;
    }

    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast.info("Test mode: Mocking payment since no Paystack key is set.");
      executeMockPayment();
      return;
    }

    initializePayment({
      onSuccess: async () => {
        await executeMockPayment();
      },
      onClose: () => {
        toast.error("Payment window closed.");
      }
    });
  };

  const executeMockPayment = async () => {
    try {
      toast.info("Processing payment on server...");
      
      // Call our backend test endpoint instead of updating Firestore directly
      // because the Firestore rules are now hardened!
      const response = await fetch('/api/test-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.uid })
      });
      
      if (!response.ok) throw new Error("Backend upgrade failed");
      
      toast.success("Payment successful! Pro features unlocked.");
      // We don't need to manually setHasUnlockedPremium(true) because the onSnapshot listener
      // will automatically detect the database change and update the UI!
      setShowPremiumDialog(false);
    } catch (error) {
      console.error("Error unlocking premium:", error);
      toast.error("Failed to unlock premium.");
    }
  };

  const handleExpertRequest = () => {
    if (!user && !email) {
      toast.error("Please provide your email first so we can contact you.");
      setShowEmailDialog(true);
      setShowExpertDialog(false);
      return;
    }
    
    const userEmail = user?.email || email;
    const subject = encodeURIComponent("[Business Prompt Idea] New Expert Review Request - Foundeck");
    const body = encodeURIComponent(`Hello,\n\nI would like to request an Expert Review.\n\nMy Email: ${userEmail}\nTier: ${expertPricing.tier}\nItems Selected: ${selectedOptions.size}\n\nPlease send me the payment link.`);
    
    // Open the user's default email client
    window.location.href = `mailto:madebyyouni@gmail.com?subject=${subject}&body=${body}`;

    toast.success("Redirecting to your email client...");
    setShowExpertDialog(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    
    setIsSubmittingFeedback(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user?.uid || null,
        email: user?.email || email || null,
        type: feedbackType,
        message: feedbackMessage.trim(),
        createdAt: serverTimestamp()
      });
      toast.success("Thanks! Your feedback helps us improve Foundeck.");
      setShowFeedbackDialog(false);
      setFeedbackMessage("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getExpertPricing = () => {
    const count = selectedOptions.size;
    if (count === 0) return { flat: 0, equity: 0, tier: "None" };
    if (count <= 5) return { flat: 150, equity: 100, tier: "Basic" };
    if (count <= 15) return { flat: 250, equity: 150, tier: "Standard" };
    return { flat: 400, equity: 250, tier: "Comprehensive" };
  };

  const expertPricing = getExpertPricing();

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-foreground selection:bg-indigo-500/30 pb-24 font-sans isolation-auto transition-colors duration-300">
      {/* Subtle modern background radial gradient for depth */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-transparent to-transparent dark:from-indigo-900/20 dark:via-background dark:to-background pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-inner shadow-white/20">
              <BrainCircuit className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Foundeck</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <Button variant="ghost" size="sm" onClick={() => setShowFeedbackDialog(true)} className="hidden md:flex text-muted-foreground hover:text-foreground">
              <LifeBuoy className="w-4 h-4 mr-2" />
              Community & Help
            </Button>
            
            {!hasUnlockedPremium && (
              <Button variant="outline" size="sm" onClick={() => setShowPremiumDialog(true)} className="hidden sm:flex border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 bg-amber-50 dark:bg-amber-500/10 shadow-sm">
                <Lock className="w-3.5 h-3.5 mr-2" />
                Unlock Pro ($15)
              </Button>
            )}
            <Button size="sm" onClick={() => setShowExpertDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
              <Star className="w-3.5 h-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Expert Review</span>
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLogin} className="text-muted-foreground hover:text-foreground">
                <LogIn className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 md:py-16 max-w-7xl animate-in fade-in duration-500 slide-in-from-bottom-6">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance text-slate-900 dark:text-slate-50">
            Build Your Ultimate <span className="text-indigo-600 dark:text-indigo-400">Business Prompt</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-balance leading-relaxed">
            Select the exact aspects of your business you need help with. We generate a robust, hallucination-free prompt for AI that guarantees high-quality results.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inputs & Checkboxes */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-border/50 shadow-md transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-muted/10 border-b border-border/40">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Core Business Details
                </CardTitle>
                <CardDescription>Define what you are building and who it is for.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="niche">Business Niche / Idea</Label>
                  <Input 
                    id="niche" 
                    placeholder="e.g., AI-powered CRM, Vegan Bakery" 
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input 
                    id="audience" 
                    placeholder="e.g., Real Estate Agents, Gen Z" 
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Select Requirements</h2>
                <Badge variant="outline">{selectedOptions.size} Selected</Badge>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {categories.map(category => {
                  const customOpts = customOptions[category.id] || [];
                  const allCatOptions = [...category.options, ...customOpts];
                  
                  // Check if all UNLOCKED options are selected
                  const unlockedOptions = category.options.filter((_, idx) => !(category.isPremium && !hasUnlockedPremium && idx >= 3));
                  const allAvailable = [...unlockedOptions, ...customOpts];
                  const allSelected = allAvailable.length > 0 && allAvailable.every(opt => selectedOptions.has(opt.id));
                  
                  // Count selected in this category
                  let currentSelectedCount = 0;
                  selectedOptions.forEach(optId => {
                    if (allCatOptions.map(o => o.id).includes(optId)) currentSelectedCount++;
                  });
                  
                  return (
                    <Card key={category.id} className="border-border/50 shadow-sm overflow-hidden flex flex-col">
                      <CardHeader className="p-4 bg-muted/5 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          {category.icon}
                          <CardTitle className="text-base flex items-center gap-2">
                            {category.title}
                          </CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {currentSelectedCount} / {category.isPremium ? 2 : 5} max
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 flex-grow">
                        <div className="space-y-3">
                          {/* Default Options */}
                          {category.options.map((opt, index) => {
                            const isLocked = category.isPremium && !hasUnlockedPremium && index >= 3;
                            const isMaxReached = currentSelectedCount >= (category.isPremium ? 2 : 5);
                            const isSelected = selectedOptions.has(opt.id);
                            const isDisabled = isLocked || (isMaxReached && !isSelected);
                            
                            return (
                              <div key={opt.id} className={`flex items-start space-x-3 ${isLocked ? 'opacity-50' : (isDisabled ? 'opacity-40' : '')}`}>
                                <Checkbox 
                                  id={opt.id} 
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleOption(opt.id, isLocked, category.id, category.isPremium ? 2 : 5)}
                                  disabled={isDisabled}
                                  className={`mt-0.5 ${isLocked ? 'border-amber-500/50 data-[state=checked]:bg-amber-500' : ''}`}
                                />
                                <Label 
                                  htmlFor={opt.id} 
                                  className={`text-sm font-normal leading-snug cursor-pointer flex items-center gap-1.5 ${isDisabled ? 'text-muted-foreground select-none cursor-not-allowed' : ''}`}
                                  onClick={(e) => {
                                    if (isLocked) {
                                      e.preventDefault();
                                      setShowPremiumDialog(true);
                                    } else if (isDisabled) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {isLocked ? (
                                    <span className="flex items-center gap-1.5 blur-[4px] hover:blur-none transition-all duration-300">
                                      🔒 Premium Option Hidden
                                    </span>
                                  ) : (
                                    opt.label
                                  )}
                                </Label>
                              </div>
                            );
                          })}

                          {/* Custom Options */}
                          {customOpts.map(opt => {
                            const isMaxReached = currentSelectedCount >= (category.isPremium ? 2 : 5);
                            const isSelected = selectedOptions.has(opt.id);
                            const isDisabled = isMaxReached && !isSelected;

                            return (
                            <div key={opt.id} className={`flex items-start space-x-3 ${isDisabled ? 'opacity-40' : ''}`}>
                              <Checkbox 
                                id={opt.id} 
                                checked={isSelected}
                                onCheckedChange={() => handleToggleOption(opt.id, false, category.id, category.isPremium ? 2 : 5)}
                                disabled={isDisabled}
                                className="mt-0.5 border-primary/50"
                              />
                              <Label 
                                htmlFor={opt.id} 
                                className={`text-sm font-normal leading-snug cursor-pointer ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'text-primary/90'}`}
                                onClick={(e) => {
                                  if (isDisabled) e.preventDefault();
                                }}
                              >
                                {opt.label}
                              </Label>
                            </div>
                            );
                          })}
                        </div>
                      </CardContent>
                      
                      {/* Add Custom Option Input */}
                      <div className="p-3 border-t border-border/40 bg-muted/10 mt-auto">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add custom requirement..." 
                            className="h-8 text-xs bg-background"
                            value={customInputs[category.id] || ""}
                            onChange={(e) => setCustomInputs(prev => ({...prev, [category.id]: e.target.value}))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomOption(category.id, category.isPremium ? 2 : 5);
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 px-2"
                            onClick={() => handleAddCustomOption(category.id, category.isPremium ? 2 : 5)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Generated Prompt & Affiliates */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 space-y-6">
              <Card className="border-primary/20 shadow-xl shadow-indigo-600/5 bg-gradient-to-b from-card to-card/50 backdrop-blur-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Your Master Prompt
                    </CardTitle>
                    <Button onClick={handleCopyRequest} size="sm" className="font-semibold w-full sm:w-auto shadow-sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                  </div>
                  <CardDescription className="text-balance leading-relaxed">
                    Paste this into ChatGPT, Claude, or Gemini. It forces the AI to structure a perfect response.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] lg:h-[500px] w-full rounded-b-xl bg-slate-100/50 dark:bg-slate-900/50">
                    <div className="p-6">
                      <pre className="whitespace-pre-wrap font-mono text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed selection:bg-indigo-200 dark:selection:bg-indigo-900">
                        {generatedPrompt}
                      </pre>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Affiliate / Partner Section */}
              <Card className="border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Recommended Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {AFFILIATES.map((aff, idx) => (
                    <a key={idx} href={aff.link} className="flex flex-col p-3 rounded-lg border border-border/50 bg-background hover:border-primary/50 transition-colors group">
                      <span className="font-semibold text-sm group-hover:text-primary flex items-center justify-between">
                        {aff.name}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">{aff.desc}</span>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>

      {/* Email Capture Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Where should we send your prompt?
            </DialogTitle>
            <DialogDescription>
              Enter your email to copy the prompt. You'll also receive our free weekly newsletter on scaling startups, plus exclusive offers on our consulting services.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="founder@startup.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Unlock & Copy Prompt
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleLogin}>
              <LogIn className="w-4 h-4 mr-2" />
              Or Login with Google
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </DialogContent>
      </Dialog>

      {/* Premium Unlock Dialog */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Lock className="w-5 h-5" />
              Unlock Pro Features
            </DialogTitle>
            <DialogDescription>
              Get access to all advanced prompt options across Financials, Legal, Data Analytics, and more to build a truly robust business plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-amber-700 mb-2">Pro Plan Includes:</h4>
              <ul className="space-y-2 text-sm text-amber-700/80">
                <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> 30+ Advanced Prompt Options</li>
                <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Legal & Risk Management Frameworks</li>
                <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Financial Projections & KPIs</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={handleUnlockPremium} className="w-full bg-[#092E20] hover:bg-[#092E20]/90 text-white h-12 text-base">
                Unlock Pro for $15.00 (Paystack)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expert Review Dialog */}
      <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Star className="w-5 h-5" />
              Get an Expert Review
            </DialogTitle>
            <DialogDescription>
              Don't want to rely solely on AI? Have a human startup expert review your business plan, compare it against market realities, and provide a custom file deliverable.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expert-email">Your Email Address</Label>
              <Input 
                id="expert-email" 
                type="email" 
                placeholder="founder@startup.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 shadow-inner p-4 rounded-xl text-sm border border-border/40">
              {selectedOptions.size === 0 ? (
                <p className="text-amber-600 font-medium">Please select some business aspects first to calculate your review pricing.</p>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                    <span className="font-semibold text-foreground">Your Scope:</span>
                    <Badge variant="secondary">{selectedOptions.size} items selected ({expertPricing.tier} Tier)</Badge>
                  </div>
                  <p className="font-semibold mb-2 text-foreground">Dynamic Pricing Options:</p>
                  <ul className="list-disc pl-4 text-muted-foreground space-y-2 mb-4 marker:text-indigo-400">
                    <li><strong className="text-foreground">Option A (Flat Fee):</strong> ${expertPricing.flat}</li>
                    <li><strong className="text-foreground">Option B (Equity Split):</strong> ${expertPricing.equity} + 10% Equity <span className="text-xs opacity-70">(for early-stage)</span></li>
                  </ul>
                  <p className="font-semibold mb-1 text-foreground">What you get:</p>
                  <ul className="list-disc pl-4 text-muted-foreground space-y-1 marker:text-emerald-500">
                    <li>Full review of your AI-generated business plan</li>
                    <li>Competitor analysis by a real human</li>
                    <li>30-minute strategy call</li>
                  </ul>
                </>
              )}
            </div>
            <Button 
              onClick={handleExpertRequest} 
              disabled={selectedOptions.size === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-base h-11"
            >
              Request Review & Payment Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback & Community Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-indigo-500" />
              Community & Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve Foundeck or join our WhatsApp community to connect with other founders.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            
            {/* WhatsApp Link / Community Section */}
            <a 
              href="https://whatsapp.com/channel/0029VbC9GQK1SWsvjgBy291t" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-4 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
            >
              <div className="bg-emerald-500/10 p-2 rounded-lg mr-4">
                <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-700 transition-colors">Join our WhatsApp Channel</h4>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70">Connect, share ideas, and get support.</p>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or send direct feedback</span>
              </div>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button" 
                  variant={feedbackType === 'feature' ? 'default' : 'outline'}
                  onClick={() => setFeedbackType('feature')}
                  className="h-9 text-xs"
                >
                  Feature Idea
                </Button>
                <Button 
                  type="button" 
                  variant={feedbackType === 'bug' ? 'destructive' : 'outline'}
                  onClick={() => setFeedbackType('bug')}
                  className="h-9 text-xs"
                >
                  Report Bug
                </Button>
                <Button 
                  type="button" 
                  variant={feedbackType === 'help' ? 'secondary' : 'outline'}
                  onClick={() => setFeedbackType('help')}
                  className="h-9 text-xs"
                >
                  Need Help
                </Button>
              </div>
              <div className="space-y-2">
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Tell us what's on your mind... (We read everything!)"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmittingFeedback || !feedbackMessage.trim()} className="w-full">
                {isSubmittingFeedback ? "Sending..." : "Send to Founder"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Mobile Feedback */}
      <Button 
        size="icon" 
        onClick={() => setShowFeedbackDialog(true)} 
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white z-40"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </Button>

    </div>
  );
}
