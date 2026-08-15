import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Joyride, STATUS } from "react-joyride";
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
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, addDoc, query, orderBy, onSnapshot, getDocs, limit, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
import { usePaystackPayment } from "react-paystack";

import { History, Save, Share2, Loader2, Trash2, Lightbulb, PlayCircle, Download, Settings2, Search } from "lucide-react";

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

const EXAMPLES = [
  {
    title: "E-commerce Startup",
    niche: "Direct-to-consumer organic supplements",
    audience: "Health-conscious millennials",
    selections: ["p1", "m1", "m3"]
  },
  {
    title: "SaaS for Developers",
    niche: "AI-powered code review tool",
    audience: "Engineering managers and CTOs",
    selections: ["t3", "s2", "o2"]
  },
  {
    title: "Local Service Business",
    niche: "Premium mobile car detailing",
    audience: "High-income suburban homeowners",
    selections: ["m2", "f1", "o1"]
  }
];

// Admin configuration
export const ADMIN_EMAILS = ["marinamary202122@gmail.com"];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export default function App() {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [email, setEmail] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [promptStyle, setPromptStyle] = useState("Standard");
  const [generationMode, setGenerationMode] = useState<"Draft" | "Final">("Final");
  
  // Tour State
  const [{ runTour, tourSteps }, setTourState] = useState({
    runTour: false,
    tourSteps: [
      {
        target: '.tour-step-1',
        content: 'Welcome to Foundeck! Start by defining your core business niche and idea.',
        disableBeacon: true,
      },
      {
        target: '.tour-step-2',
        content: 'Select the specific deliverables you need the AI to generate for your business.',
      },
      {
        target: '.tour-step-3',
        content: 'Adjust the prompt generation strategy (A/B testing) to change the tone and structure of your output.',
      },
      {
        target: '.tour-step-4',
        content: 'Review, copy, or share your newly generated master prompt.',
      },
      {
        target: '.tour-step-5',
        content: 'Access your previously saved prompts or export them.',
      },
      {
        target: '.tour-step-6',
        content: 'Need more power? Unlock Pro for unlimited options and advanced features.',
      }
    ]
  });

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setTourState((prev) => ({ ...prev, runTour: false }));
      localStorage.setItem('foundeckTourCompleted', 'true');
    }
  };

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('foundeckTourCompleted');
    if (!hasCompletedTour) {
      // Small delay to let UI elements render
      setTimeout(() => {
        setTourState(prev => ({ ...prev, runTour: true }));
      }, 1000);
    }
  }, []);
  
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

  // Admin and effective Pro status computation
  const isUserAdmin = useMemo(() => isAdminEmail(user?.email), [user?.email]);
  const effectiveIsPro = useMemo(() => hasUnlockedPremium || isUserAdmin, [hasUnlockedPremium, isUserAdmin]);

  // History state
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyPrompts, setHistoryPrompts] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [historyLastDoc, setHistoryLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [historySortOption, setHistorySortOption] = useState<string>("date_desc");
  const [historyTab, setHistoryTab] = useState<"all" | "favorites">("all");
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarFiles, setAvatarFiles] = useState<string[]>([
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Brian",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia"
  ]);

  const toggleFavorite = async (promptId: string, currentFav: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "prompts", promptId), { isFavorite: !currentFav });
      setHistoryPrompts(prev => prev.map(p => p.id === promptId ? { ...p, isFavorite: !currentFav } : p));
      toast.success(currentFav ? "Removed from favorites" : "Added to favorites");
    } catch (e) {
      toast.error("Failed to update favorite status." + e);
    }
  };

  // Generation state
  const [displayPrompt, setDisplayPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Complexity limit state
  const [showComplexityDialog, setShowComplexityDialog] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Set<string> | null>(null);

  // Deletion state
  const [deleteConfDialog, setDeleteConfDialog] = useState<{isOpen: boolean, type: 'single' | 'all', id?: string}>({isOpen: false, type: 'single'});

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
        const adminAccount = isAdminEmail(currentUser.email);
        
        // Immediately grant Pro access to admin
        if (adminAccount) {
          setHasUnlockedPremium(true);
        }
        
        // Check Firestore for Pro status
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const shouldBePro = adminAccount || data.isPro === true;
            setHasUnlockedPremium(shouldBePro);
            
            // Auto-heal admin record in Firestore so isPro is saved as true
            if (adminAccount && !data.isPro) {
              await setDoc(userDocRef, { ...data, isPro: true }, { merge: true });
            }
          } else {
            // Create profile with isPro true for admin
            await setDoc(userDocRef, {
              email: currentUser.email,
              isPro: adminAccount,
              createdAt: serverTimestamp()
            });
            setHasUnlockedPremium(adminAccount);
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          if (adminAccount) {
            setHasUnlockedPremium(true);
          }
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get('niche');
    const a = params.get('audience');
    const o = params.get('options');
    const s = params.get('style');

    if (n) setNiche(n);
    if (a) setAudience(a);
    if (o) setSelectedOptions(new Set(o.split(',')));
    if (s) setPromptStyle(s);

    // Clear URL to prevent stale shares if they reload or navigate
    if (n || a || o || s) {
       window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Shuffle options on mount to prevent copying
  useEffect(() => {
    const shuffled = BASE_CATEGORIES.map(cat => ({
      ...cat,
      options: [...cat.options].sort(() => Math.random() - 0.5)
    }));
    setCategories(shuffled);
  }, []);

  const applySelectionChange = (newSet: Set<string>) => {
    // 1. Enforce Free tier global limit (max 9)
    if (!effectiveIsPro && newSet.size > 9) {
      setShowPremiumDialog(true);
      toast.error("Free tier is limited to 9 total selections. Unlock Pro for unlimited access.");
      return;
    }

    // 2. Master Prompt Warning (15 or more selections)
    if (newSet.size >= 15 && selectedOptions.size < 15) {
      setPendingSelection(newSet);
      setShowComplexityDialog(true);
      return;
    }

    setSelectedOptions(newSet);
  };

  const handleToggleOption = (id: string, isLocked: boolean, categoryId: string) => {
    if (isLocked) {
      setShowPremiumDialog(true);
      return;
    }

    const newSet = new Set<string>(selectedOptions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    applySelectionChange(newSet);
  };

  const handleSelectAll = (categoryOptions: {id: string}[], categoryId: string, isPremiumCategory: boolean) => {
    const newSet = new Set<string>(selectedOptions);
    
    // Only select unlocked options
    const unlockedOptions = categoryOptions.filter((_, index) => {
      const isLocked = isPremiumCategory && !effectiveIsPro && index >= 3;
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
    
    applySelectionChange(newSet);
  };

  const handleAddCustomOption = (categoryId: string) => {
    const text = customInputs[categoryId];
    if (!text || !text.trim()) return;
    
    const newOpt = { id: `custom-${Date.now()}-${Math.random()}`, label: text.trim() };
    
    setCustomOptions(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newOpt]
    }));
    
    setCustomInputs(prev => ({ ...prev, [categoryId]: "" }));
    
    const newSet = new Set<string>(selectedOptions);
    newSet.add(newOpt.id);
    applySelectionChange(newSet);
  };

  const generatePrompt = useMemo(() => {
    if (!niche || !audience) return "Please enter your business niche and target audience first.";
    if (selectedOptions.size === 0) return "Please select at least one aspect of your business to generate a prompt.";

    const styleMap: Record<string, string> = {
      "Standard": "Maintain a professional, clear, and balanced tone.",
      "Creative": "Use out-of-the-box thinking, be highly creative, innovative, and propose unique approaches. Challenge industry norms.",
      "Concise": "Be extremely brief, direct to the point, and eliminate any fluff. Use bullet points heavily and synthesize strictly.",
      "Detailed": "Provide incredibly comprehensive and thorough details, deep-dive analysis, step-by-step guidance, and exhaustive reasoning."
    };

    if (generationMode === "Draft") {
      let draft = `### DRAFT PROMPT TEMPLATE\n> *Review and customize the bracketed [ ] sections below before copying to your AI tool.*\n\n`;
      draft += `Act as an expert startup founder, business consultant, and strategist. I am building a new business in the **[Your specific sub-niche, e.g., ${niche}]** space, specifically targeting **[Your exact customer persona, e.g., ${audience}]**.\n\n`;
      draft += `**Key Differentiators:**\n- [Insert what makes you unique 1]\n- [Insert what makes you unique 2]\n\n`;
      draft += `**Current Challenges:**\n- [Insert your biggest hurdle here]\n\n`;
      draft += `### STRATEGY & TONE\n`;
      draft += `${styleMap[promptStyle] || styleMap["Standard"]} [Adjust tone instructions here if needed]\n\n`;
      
      draft += `### REQUIRED SECTIONS TO COVER\n\nPlease help me develop the following areas:\n\n`;
      categories.forEach(category => {
        const allCatOptions = [...category.options, ...(customOptions[category.id] || [])];
        const selectedInCategory = allCatOptions.filter(opt => selectedOptions.has(opt.id));
        if (selectedInCategory.length > 0) {
          draft += `#### ${category.title}\n`;
          selectedInCategory.forEach(opt => { draft += `- ${opt.label}: [Add specific context or requirements for this]\n`; });
          draft += `\n`;
        }
      });
      draft += `Please ask me 3 to 5 clarifying questions before generating the full plan.`;
      return draft;
    }

    let prompt = `Act as an expert startup founder, business consultant, and strategist. I am building a new business in the **${niche}** space, specifically targeting **${audience}**.\n\n`;
    
    prompt += `### STRATEGY & TONE\n`;
    prompt += `${styleMap[promptStyle] || styleMap["Standard"]}\n\n`;

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
  }, [niche, audience, selectedOptions, categories, customOptions, promptStyle, generationMode]);

  const generatedPrompt = generatePrompt;

  useEffect(() => {
    setIsGenerating(true);
    const timer = setTimeout(() => {
      setDisplayPrompt(generatedPrompt);
      setIsGenerating(false);
    }, 400); // simulate thinking
    return () => clearTimeout(timer);
  }, [generatedPrompt]);

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
    navigator.clipboard.writeText(displayPrompt);
    toast.success("Prompt copied to clipboard!");
    setShowEmailDialog(false);
  };

  const handleShare = async () => {
    if (!niche || !audience || selectedOptions.size === 0) {
      toast.error("Please fill out the details and select options first.");
      return;
    }

    const shareData = {
      title: 'Foundeck | My Master Business Prompt',
      text: `I just built an elite AI business strategy prompt for my startup using Foundeck! Check it out:\n\n${displayPrompt.substring(0, 150)}...\n\nBuild yours here:`,
      url: window.location.href,
    };

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to Twitter/X compose if Web Share isn't supported or on Desktop
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url || 'https://foundeck.vercel.app')}`;
      window.open(twitterUrl, '_blank');
      toast.success("Opened Twitter to share");
    }
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

  const handleSavePrompt = async () => {
    if (!niche || !audience || selectedOptions.size === 0) {
      toast.error("Please fill out the details and select options first.");
      return;
    }
    if (!user) {
      toast.error("Please log in to save prompts to your history.");
      return;
    }

    setIsSavingPrompt(true);
    try {
      await addDoc(collection(db, "users", user.uid, "prompts"), {
        userId: user.uid,
        niche: niche,
        audience: audience,
        promptText: displayPrompt,
        options: Array.from(selectedOptions),
        style: promptStyle,
        createdAt: serverTimestamp()
      });
      toast.success("Prompt saved to history!");
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const exportHistory = () => {
    if (historyPrompts.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(historyPrompts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "foundeck_history_export.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("JSON exported successfully!");
  };

  const exportHistoryCSV = () => {
    if (historyPrompts.length === 0) return;
    const headers = ["ID", "CreatedAt", "Niche", "Audience", "IsFavorite", "PromptText"];
    const rows = historyPrompts.map(p => {
      const date = p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : "";
      const text = p.promptText ? p.promptText.replace(/"/g, '""') : "";
      return `"${p.id}","${date}","${p.niche}","${p.audience}","${!!p.isFavorite}","${text}"`;
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "foundeck_history_export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("CSV exported successfully!");
  };

  const loadHistory = async (reset = false) => {
    if (!user) return;
    if (reset) {
      setIsLoadingHistory(true);
      setHistoryPrompts([]);
      setHistoryLastDoc(null);
      setHasMoreHistory(true);
    } else {
      if (!hasMoreHistory || isLoadingHistory || isLoadingMoreHistory) return;
      setIsLoadingMoreHistory(true);
    }

    try {
      let sortField = "createdAt";
      let sortDir: "asc" | "desc" = "desc";
      if (historySortOption === "date_asc") { sortDir = "asc"; }
      else if (historySortOption === "niche_asc") { sortField = "niche"; sortDir = "asc"; }
      else if (historySortOption === "niche_desc") { sortField = "niche"; sortDir = "desc"; }
      else if (historySortOption === "audience_asc") { sortField = "audience"; sortDir = "asc"; }
      else if (historySortOption === "audience_desc") { sortField = "audience"; sortDir = "desc"; }
      
      let q = query(collection(db, "users", user.uid, "prompts"), orderBy(sortField, sortDir), limit(15));
      if (!reset && historyLastDoc) {
        q = query(collection(db, "users", user.uid, "prompts"), orderBy(sortField, sortDir), startAfter(historyLastDoc), limit(15));
      }
      
      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (reset) {
         setHistoryPrompts(historyData);
      } else {
         setHistoryPrompts(prev => [...prev, ...historyData]);
      }
      
      if (snapshot.docs.length > 0) {
        setHistoryLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMoreHistory(false);
      }
      if (snapshot.docs.length < 15) {
         setHasMoreHistory(false);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load prompt history.");
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMoreHistory(false);
    }
  };

  const observerTarget = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreHistory && !isLoadingHistory && !isLoadingMoreHistory) {
          loadHistory(false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMoreHistory, isLoadingHistory, isLoadingMoreHistory, observerTarget.current]);

  const confirmDeletePrompt = (promptId: string) => {
    setDeleteConfDialog({ isOpen: true, type: 'single', id: promptId });
  };

  const confirmClearHistory = () => {
    setDeleteConfDialog({ isOpen: true, type: 'all' });
  };

  const deletePrompt = async (promptId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "prompts", promptId));
      setHistoryPrompts(prev => prev.filter(p => p.id !== promptId));
      toast.success("Prompt deleted.");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt.");
    }
  };

  const clearHistory = async () => {
    if (!user || historyPrompts.length === 0) return;
    setIsLoadingHistory(true);
    try {
      // In a real app we might batch this or do it via edge function, 
      // but for <100 items running a loop of deletes is fine client side.
      const promises = historyPrompts.map(p => deleteDoc(doc(db, "users", user.uid, "prompts", p.id)));
      await Promise.all(promises);
      setHistoryPrompts([]);
      toast.success("Prompt history cleared.");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear prompt history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryDialog) {
      loadHistory(true);
      setHistorySearchQuery("");
    }
  }, [showHistoryDialog, user, historySortOption]);

  const handleUnlockPremium = async () => {
    if (!user) {
      toast.error("Please log in first to unlock Pro.");
      handleLogin();
      return;
    }

    if (isUserAdmin) {
      toast.success("Admin bypass active: Free Pro features are permanently enabled!");
      setHasUnlockedPremium(true);
      setShowPremiumDialog(false);
      return;
    }

    if (effectiveIsPro) {
      toast.info("You already have full access to Foundeck Pro!");
      setShowPremiumDialog(false);
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
      <Joyride
        {...({
          steps: tourSteps,
          run: runTour,
          continuous: true,
          showProgress: true,
          showSkipButton: true,
          callback: handleJoyrideCallback,
          styles: {
            options: {
              primaryColor: '#4f46e5',
            }
          }
        } as any)}
      />
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
            <Button variant="ghost" size="sm" onClick={() => setTourState(prev => ({...prev, runTour: true}))} className="text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100">
              <PlayCircle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Tour</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowFeedbackDialog(true)} className="hidden md:flex text-muted-foreground hover:text-foreground">
              <LifeBuoy className="w-4 h-4 mr-2" />
              Community & Help
            </Button>
            
            {effectiveIsPro ? (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm"
                title={isUserAdmin ? "Admin account with permanent free Pro access" : "Foundeck Pro Active"}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isUserAdmin ? "Admin Pro (Free)" : "Pro Plan"}</span>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowPremiumDialog(true)} className="flex border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 bg-amber-50 dark:bg-amber-500/10 shadow-sm tour-step-6">
                <Lock className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Unlock Pro ($15)</span>
                <span className="inline sm:hidden">Pro</span>
              </Button>
            )}
            <Button size="sm" onClick={() => setShowExpertDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
              <Star className="w-3.5 h-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Expert Review</span>
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => setShowHistoryDialog(true)} className="text-muted-foreground hover:text-foreground tour-step-5">
                <History className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">History</span>
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => setShowAvatarDialog(true)}
                  className="rounded-full overflow-hidden transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background"
                  title="Change Avatar"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full border border-border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
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
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance text-slate-900 dark:text-slate-50">
            Build Your Ultimate <span className="text-indigo-600 dark:text-indigo-400">Business Prompt</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-balance leading-relaxed">
            Select the exact aspects of your business you need help with. We generate a robust, hallucination-free prompt for AI that guarantees high-quality results.
          </p>
        </div>

        {/* Examples Section */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Inspiration: Try an Example</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAMPLES.map((example, idx) => (
              <Card 
                key={idx} 
                className="cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all group active:scale-[0.98] bg-card/50"
                onClick={() => {
                  setNiche(example.niche);
                  setAudience(example.audience);
                  setSelectedOptions(new Set(example.selections));
                  toast.success(`Loaded example: ${example.title}`);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
              >
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center justify-between group-hover:text-indigo-600 transition-colors">
                    {example.title}
                    <PlayCircle className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">Niche: {example.niche}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inputs & Checkboxes */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-border/50 shadow-md transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm tour-step-1">
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

            <Card className="border-border/50 shadow-md transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm tour-step-3">
              <CardHeader className="bg-muted/10 border-b border-border/40 py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Prompt Settings
                </CardTitle>
                <CardDescription>Select the tone, output structure, and mode for your AI generation.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Prompt Tone (A/B Test)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Standard", "Creative", "Concise", "Detailed"].map((style) => (
                      <Button
                        key={style}
                        variant={promptStyle === style ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPromptStyle(style)}
                        className="w-full font-medium transition-all"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Generation Mode</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={generationMode === "Final" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGenerationMode("Final")}
                      className="font-medium transition-all flex-1"
                    >
                      Final (Ready to send)
                    </Button>
                    <Button
                      variant={generationMode === "Draft" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGenerationMode("Draft")}
                      className="font-medium transition-all flex-1"
                    >
                      Draft (Structured template to refine)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 tour-step-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Select Requirements</h2>
                <Badge variant="outline">{selectedOptions.size} Selected</Badge>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {categories.map(category => {
                  const customOpts = customOptions[category.id] || [];
                  const allCatOptions = [...category.options, ...customOpts];
                  
                  // Check if all UNLOCKED options are selected
                  const unlockedOptions = category.options.filter((_, idx) => !(category.isPremium && !effectiveIsPro && idx >= 3));
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
                          {currentSelectedCount} selected
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 flex-grow">
                        <div className="space-y-3">
                          {/* Default Options */}
                          {category.options.map((opt, index) => {
                            const isLocked = category.isPremium && !effectiveIsPro && index >= 3;
                            const isSelected = selectedOptions.has(opt.id);
                            const hitFreeLimit = !effectiveIsPro && selectedOptions.size >= 9;
                            const isDisabled = isLocked || (hitFreeLimit && !isSelected);
                            
                            return (
                              <div key={opt.id} className={`flex items-start space-x-3 ${isLocked ? 'opacity-50' : (isDisabled ? 'opacity-40' : '')}`}>
                                <Checkbox 
                                  id={opt.id} 
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleOption(opt.id, isLocked, category.id)}
                                  disabled={isDisabled}
                                  className={`mt-0.5 ${isLocked ? 'border-amber-500/50 data-[state=checked]:bg-amber-500' : ''}`}
                                />
                                <Label 
                                  htmlFor={opt.id} 
                                  className={`text-sm font-normal leading-snug cursor-pointer flex items-center gap-1.5 ${isDisabled ? 'text-muted-foreground select-none cursor-not-allowed' : ''}`}
                                  onClick={(e) => {
                                    if (isLocked || (hitFreeLimit && !isSelected)) {
                                      e.preventDefault();
                                      if (isLocked || hitFreeLimit) setShowPremiumDialog(true);
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
                            const isSelected = selectedOptions.has(opt.id);
                            const hitFreeLimit = !effectiveIsPro && selectedOptions.size >= 9;
                            const isDisabled = hitFreeLimit && !isSelected;

                            return (
                            <div key={opt.id} className={`flex items-start space-x-3 ${isDisabled ? 'opacity-40' : ''}`}>
                              <Checkbox 
                                id={opt.id} 
                                checked={isSelected}
                                onCheckedChange={() => handleToggleOption(opt.id, false, category.id)}
                                disabled={isDisabled}
                                className="mt-0.5 border-primary/50"
                              />
                              <Label 
                                htmlFor={opt.id} 
                                className={`text-sm font-normal leading-snug cursor-pointer ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'text-primary/90'}`}
                                onClick={(e) => {
                                  if (isDisabled) {
                                    e.preventDefault();
                                    setShowPremiumDialog(true);
                                  }
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
                                handleAddCustomOption(category.id);
                              }
                            }}
                            disabled={!hasUnlockedPremium && selectedOptions.size >= 9}
                          />
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 px-2"
                            onClick={() => handleAddCustomOption(category.id)}
                            disabled={!hasUnlockedPremium && selectedOptions.size >= 9}
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
              <Card className="border-primary/20 shadow-xl shadow-indigo-600/5 bg-gradient-to-b from-card to-card/50 backdrop-blur-md tour-step-4">
                <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Your Master Prompt
                    </CardTitle>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                      <Button onClick={handleSavePrompt} size="sm" variant="secondary" className="font-semibold shadow-sm flex-1 sm:flex-none transition-all" disabled={isSavingPrompt}>
                        {isSavingPrompt ? <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-1 sm:mr-2" />}
                        {isSavingPrompt ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleCopyRequest} size="sm" className="font-semibold shadow-sm flex-1 sm:flex-none transition-all">
                        <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                        Copy
                      </Button>
                      <Button onClick={handleShare} size="sm" variant="outline" className="font-semibold shadow-sm flex-1 sm:flex-none transition-all group">
                        <Share2 className="w-4 h-4 mr-1 sm:mr-2 group-hover:text-indigo-500" />
                        Share
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-balance leading-relaxed">
                    Paste this into ChatGPT, Claude, or Gemini. It forces the AI to structure a perfect response.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] lg:h-[500px] w-full rounded-b-xl bg-slate-100/50 dark:bg-slate-900/50 relative">
                    <div className="p-6">
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 py-16 sm:py-20 text-muted-foreground animate-pulse text-center">
                          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-indigo-500" />
                          <p className="text-sm sm:text-base font-medium">Synthesizing prompt modules...</p>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed selection:bg-indigo-200 dark:selection:bg-indigo-900 animate-in fade-in duration-300">
                          {displayPrompt}
                        </pre>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {displayPrompt && !isGenerating && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Related Strategies to Explore
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card
                      className="cursor-pointer hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-muted/20"
                      onClick={() => setPromptStyle(promptStyle === "Creative" ? "Detailed" : "Creative")}
                    >
                      <CardContent className="p-4 flex gap-3 text-sm">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg h-fit">
                          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Change the Tone</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            Tap to rewrite this prompt using a <span className="font-bold text-foreground">{promptStyle === 'Creative' ? 'Detailed' : 'Creative'}</span> strategy.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-muted/20"
                      onClick={() => setAudience(audience.toLowerCase().includes('enterprise') ? 'Startups & SMBs' : 'Enterprise / B2B')}
                    >
                      <CardContent className="p-4 flex gap-3 text-sm">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg h-fit">
                          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Pivot Audience</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            What if you targeted <span className="font-bold text-foreground">{audience.toLowerCase().includes('enterprise') ? 'Startups & SMBs' : 'Enterprise'}</span> instead? Tap to test.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

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

      {/* Avatar Selection Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>
              Select an avatar to personalize your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            {avatarFiles.map((url, i) => (
              <button
                key={i}
                onClick={async () => {
                  if (!user) return;
                  try {
                    await updateProfile(user, { photoURL: url });
                    setShowAvatarDialog(false);
                    // Force a re-render of user state (re-auth check or manual object update)
                    setUser({ ...user, photoURL: url } as any);
                    toast.success("Avatar updated!");
                  } catch (e) {
                    toast.error("Failed to update avatar.");
                  }
                }}
                className={`rounded-full overflow-hidden border-2 w-16 h-16 transition-all hover:scale-105 hover:border-primary focus:outline-none ${user?.photoURL === url ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-transparent'}`}
              >
                <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover bg-indigo-50" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setShowAvatarDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Prompt History
                </DialogTitle>
                <DialogDescription>
                  Previously generated prompts saved to your account.
                </DialogDescription>
              </div>
              {historyPrompts.length > 0 && !isLoadingHistory && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportHistory}>
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export JSON</span>
                    <span className="sm:hidden">JSON</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportHistoryCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={confirmClearHistory}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {historyPrompts.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex gap-4">
                  <button 
                    className={`pb-2 text-sm font-medium transition-colors border-b-2 ${historyTab === 'all' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setHistoryTab('all')}
                  >
                    All Prompts
                  </button>
                  <button 
                    className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1 ${historyTab === 'favorites' ? 'border-amber-400 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setHistoryTab('favorites')}
                  >
                    <Star className={`w-3.5 h-3.5 ${historyTab === 'favorites' ? 'fill-amber-400 text-amber-400' : ''}`} />
                    Favorites
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sort By:</span>
                  <select 
                    title="Sort History"
                    className="text-sm bg-transparent border-none outline-none font-medium cursor-pointer"
                    value={historySortOption}
                    onChange={(e) => setHistorySortOption(e.target.value)}
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="niche_asc">Niche A-Z</option>
                    <option value="niche_desc">Niche Z-A</option>
                    <option value="audience_asc">Audience A-Z</option>
                    <option value="audience_desc">Audience Z-A</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search history..."
                  className="pl-9 bg-muted/50 w-full"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
            {isLoadingHistory ? (
              <div className="py-8 text-center text-muted-foreground">Loading history...</div>
            ) : historyPrompts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No saved prompts yet. Generate a prompt and click "Save".
              </div>
            ) : (() => {
              const filteredHistory = historyPrompts.filter(prompt => {
                const matchesSearch = (prompt.niche || "").toLowerCase().includes(historySearchQuery.toLowerCase()) || 
                                      (prompt.promptText || "").toLowerCase().includes(historySearchQuery.toLowerCase());
                const matchesTab = historyTab === 'favorites' ? prompt.isFavorite === true : true;
                return matchesSearch && matchesTab;
              });
              
              if (filteredHistory.length === 0) {
                return <div className="py-8 text-center text-muted-foreground">{historyTab === 'favorites' ? 'No favorite prompts found.' : 'No prompts match your search.'}</div>;
              }

              return (
                <div className="space-y-4 pb-4">
                  {filteredHistory.map((prompt) => (
                    <Card key={prompt.id} className="border-border relative">
                      <CardHeader className="py-4 bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 pl-8 relative">
                            <button
                              onClick={() => toggleFavorite(prompt.id, prompt.isFavorite)}
                              className="absolute left-0 top-0.5 text-muted-foreground hover:text-amber-400 transition-colors"
                              title={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star className={`w-5 h-5 ${prompt.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            <CardTitle className="text-lg truncate">{prompt.niche}</CardTitle>
                            <CardDescription className="truncate">Targeting: {prompt.audience}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => {
                                navigator.clipboard.writeText(prompt.promptText);
                                toast.success("Prompt copied!");
                              }}
                            >
                              <Copy className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Copy</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const opts = (prompt.options || []).join(',');
                                const st = prompt.style || 'Standard';
                                const url = `${window.location.origin}?niche=${encodeURIComponent(prompt.niche)}&audience=${encodeURIComponent(prompt.audience)}&options=${opts}&style=${encodeURIComponent(st)}`;
                                navigator.clipboard.writeText(url);
                                toast.success("Shareable link copied to clipboard!");
                              }}
                            >
                              <Share2 className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Share</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => confirmDeletePrompt(prompt.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4">
                        <div className="relative">
                          <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground line-clamp-3">
                            {prompt.promptText}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div ref={observerTarget} className="h-4 w-full" />
                  {isLoadingMoreHistory && (
                    <div className="py-4 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/> Loading more...</div>
                  )}
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfDialog.isOpen} onOpenChange={(open) => !open && setDeleteConfDialog({ isOpen: false, type: 'single' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {deleteConfDialog.type === 'all' ? 'Clear History' : 'Delete Prompt'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {deleteConfDialog.type === 'all' 
                ? 'Are you sure you want to delete ALL saved prompts? This action cannot be undone.'
                : 'Are you sure you want to delete this prompt? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteConfDialog({ isOpen: false, type: 'single' })}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteConfDialog.type === 'all') {
                  clearHistory();
                } else if (deleteConfDialog.id) {
                  deletePrompt(deleteConfDialog.id);
                }
                setDeleteConfDialog({ isOpen: false, type: 'single' });
              }}
            >
              {deleteConfDialog.type === 'all' ? 'Clear All' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Complexity Warning Dialog */}
      <Dialog open={showComplexityDialog} onOpenChange={setShowComplexityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-amber-500" />
              Cognitive Overload Warning
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-foreground/90">
              This will generate a highly complex output. Do you want to split this into phases? We guide you to success, rather than letting you drown in the output.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              size="lg"
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold"
              onClick={() => {
                setShowComplexityDialog(false);
                setPendingSelection(null);
                toast.info("Try to focus your prompt on 3-5 core areas first for the best result.");
              }}
            >
              Split into Phases (Recommended)
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="w-full font-medium"
              onClick={() => {
                if (pendingSelection) {
                  setSelectedOptions(pendingSelection);
                }
                setShowComplexityDialog(false);
                setPendingSelection(null);
              }}
            >
              Generate Master Prompt Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            {isUserAdmin ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Admin Bypass Active</span>
                </div>
                <p className="text-xs opacity-90">
                  Logged in as <strong className="underline">{user?.email}</strong>. All Pro features, advanced categories, and unlimited selections are free and active.
                </p>
              </div>
            ) : null}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-amber-700 mb-2">Pro Plan Includes:</h4>
              <ul className="space-y-2 text-sm text-amber-700/80">
                <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> 30+ Advanced Prompt Options</li>
                <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Legal & Risk Management Frameworks</li>
                <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Financial Projections & KPIs</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {isUserAdmin ? (
                <Button onClick={() => setShowPremiumDialog(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base">
                  Got it (Pro Active)
                </Button>
              ) : (
                <Button onClick={handleUnlockPremium} className="w-full bg-[#092E20] hover:bg-[#092E20]/90 text-white h-12 text-base">
                  Unlock Pro for $15.00 (Paystack)
                </Button>
              )}
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
