import { useState } from "react";
import { Link } from "wouter";
import { WalletButton } from "@/components/wallet-button";
import { 
  FileText, 
  Lock, 
  Zap, 
  Shield, 
  ArrowRight, 
  Check,
  CreditCard,
  Users,
  BarChart3,
  Globe
} from "lucide-react";

export default function InvoiceLanding() {
  const [activeTab, setActiveTab] = useState("features");

  const features = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Privacy-First",
      description: "End-to-end encryption with Arcium v0.5. Only you and your customer see invoice details."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Settlement",
      description: "Get paid in seconds on Solana. No banks, no delays, just instant on-chain payments."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Multi-Currency",
      description: "Accept payments in USDC, SOL, or any SPL token. Your choice, your terms."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Compliant",
      description: "GDPR and SOC 2 ready. Military-grade encryption protects your financial data."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Customer Management",
      description: "Track payment history, set custom terms, and manage all your customers in one place."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Real-time insights on cash flow, overdue invoices, and average payment times."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$0.01",
      unit: "per invoice",
      features: [
        "Unlimited invoices",
        "Multi-currency support",
        "Basic analytics",
        "Email notifications",
        "USDC/SOL payments"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$0.01",
      unit: "per invoice",
      features: [
        "Everything in Starter",
        "Arcium encryption",
        "Priority support",
        "Custom templates",
        "Advanced analytics",
        "API access"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      unit: "pricing",
      features: [
        "Everything in Professional",
        "Dedicated support",
        "SLA guarantees",
        "Custom integrations",
        "White-label option",
        "Volume discounts"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navbar */}
      <nav className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                SolanaInvoice
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setActiveTab("features")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "features" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Features
              </button>
              <button 
                onClick={() => setActiveTab("pricing")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "pricing" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pricing
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "security" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Security
              </button>
              <Link href="/docs">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Docs
                </a>
              </Link>
            </div>

            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-card mb-6 smoke-shadow">
            <Globe className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Privacy-First B2B Invoicing on Solana</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Get Paid in{" "}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              Seconds
            </span>
            <br />Not Days
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            The only invoicing platform built for crypto-native businesses. 
            Create encrypted invoices, accept instant payments, and maintain complete privacy—all on Solana.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/new">
              <button className="glass-strong px-8 py-4 rounded-xl font-semibold text-primary-foreground bg-primary/90 hover:bg-primary transition-all smoke-shadow group">
                Create Invoice
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <Link href="/stats">
              <button className="glass px-8 py-4 rounded-xl font-semibold hover:glass-strong transition-all smoke-shadow">
                View Public Stats
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Transaction Time", value: "< 1s" },
              { label: "Transaction Fee", value: "$0.00025" },
              { label: "Privacy Level", value: "Military" },
              { label: "Uptime", value: "99.99%" }
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-6 rounded-xl smoke-shadow">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {activeTab === "features" && (
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose SolanaInvoice?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the decentralized economy with enterprise-grade features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-8 rounded-2xl hover:glass-strong transition-all smoke-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="text-primary">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {activeTab === "pricing" && (
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pay only for what you use. No subscriptions, no hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`p-8 rounded-2xl ${
                  plan.highlighted 
                    ? "glass-strong border-2 border-primary shadow-lg shadow-primary/20" 
                    : "glass-card"
                } smoke-shadow`}
              >
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                    MOST POPULAR
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.unit}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/dashboard/new">
                  <button 
                    className={`w-full py-3 rounded-xl font-semibold transition-all smoke-shadow ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "glass-card hover:glass-strong"
                    }`}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Security Section */}
      {activeTab === "security" && (
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-4xl font-bold mb-4">Bank-Level Security</h2>
              <p className="text-xl text-muted-foreground">
                Your financial data is protected by military-grade encryption
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Arcium v0.5 Encryption",
                  description: "Multi-party encryption ensures only you and your customer can decrypt invoice details. No one else—not even us."
                },
                {
                  title: "On-Chain Verification",
                  description: "Every payment is verified on Solana blockchain. Immutable, transparent, and tamper-proof."
                },
                {
                  title: "GDPR Compliant",
                  description: "Built with privacy by design. Data minimization, right to erasure, and full compliance with EU regulations."
                },
                {
                  title: "SOC 2 Ready",
                  description: "Enterprise-grade access controls, audit logs, and security monitoring for peace of mind."
                }
              ].map((item, index) => (
                <div key={index} className="glass-card p-6 rounded-xl smoke-shadow">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 glass-strong p-8 rounded-2xl text-center smoke-shadow">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Zero-Knowledge Architecture</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We can't see your invoice amounts, customer details, or payment information. 
                Everything is encrypted end-to-end before it ever reaches our servers.
              </p>
              <Link href="/docs/security">
                <button className="glass px-6 py-3 rounded-xl font-semibold hover:glass-strong transition-all smoke-shadow">
                  Read Security Docs
                  <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto glass-strong p-12 rounded-3xl text-center smoke-shadow">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the future of B2B payments. Create your first invoice in under a minute.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/new">
              <button className="glass-strong px-8 py-4 rounded-xl font-semibold text-primary-foreground bg-primary/90 hover:bg-primary transition-all smoke-shadow group">
                Create Your First Invoice
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <Link href="/docs">
              <button className="glass px-8 py-4 rounded-xl font-semibold hover:glass-strong transition-all smoke-shadow">
                View Documentation
              </button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • $0.01 per invoice • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 glass">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">SolanaInvoice</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Privacy-first B2B invoicing on Solana. Built for the decentralized economy.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features"><a className="hover:text-foreground transition-colors">Features</a></Link></li>
                <li><Link href="/pricing"><a className="hover:text-foreground transition-colors">Pricing</a></Link></li>
                <li><Link href="/security"><a className="hover:text-foreground transition-colors">Security</a></Link></li>
                <li><Link href="/roadmap"><a className="hover:text-foreground transition-colors">Roadmap</a></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs"><a className="hover:text-foreground transition-colors">Documentation</a></Link></li>
                <li><Link href="/whitepaper"><a className="hover:text-foreground transition-colors">Whitepaper</a></Link></li>
                <li><Link href="/learn"><a className="hover:text-foreground transition-colors">Learn</a></Link></li>
                <li><Link href="/api"><a className="hover:text-foreground transition-colors">API Reference</a></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about"><a className="hover:text-foreground transition-colors">About</a></Link></li>
                <li><Link href="/blog"><a className="hover:text-foreground transition-colors">Blog</a></Link></li>
                <li><Link href="/careers"><a className="hover:text-foreground transition-colors">Careers</a></Link></li>
                <li><Link href="/contact"><a className="hover:text-foreground transition-colors">Contact</a></Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 SolanaInvoice. All rights reserved. Built with ❤️ for the decentralized economy.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
