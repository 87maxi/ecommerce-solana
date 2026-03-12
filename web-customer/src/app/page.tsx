import { ArrowRight, Shield, Zap, Globe, Lock, Coins, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="hero bg-gradient-to-b from-background via-secondary/20 to-background py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50 text-xs font-medium text-muted-foreground mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live on Sepolia Testnet
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 font-display tracking-tight">
            The Future of <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Decentralized Commerce
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            Shop securely with cryptocurrency. Experience transparent, instant, and borderless payments powered by Ethereum and EURT.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/products"
              className={cn(
                "group flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold",
                "hover:bg-primary/90 transition-all duration-300 transform hover:scale-105",
                "shadow-lg shadow-primary/25 hover:shadow-primary/40"
              )}
            >
              Start Shopping
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="http://localhost:3033?redirect=http://localhost:3030"
              className={cn(
                "flex items-center gap-2 px-8 py-4 bg-secondary/50 text-foreground rounded-full font-semibold",
                "hover:bg-secondary/80 transition-all duration-300 border border-border/50",
                "backdrop-blur-sm"
              )}
            >
              Get EURT Tokens
            </a>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50 hover:border-primary/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Secure Payments</h3>
            <p className="text-muted-foreground leading-relaxed">
              Transactions are secured by smart contracts on the Ethereum blockchain, ensuring safety and transparency.
            </p>
          </div>

          <div className="p-8 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50 hover:border-accent/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Instant Settlement</h3>
            <p className="text-muted-foreground leading-relaxed">
              Say goodbye to waiting days for payments to clear. Blockchain transactions settle in seconds.
            </p>
          </div>

          <div className="p-8 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50 hover:border-secondary/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Global Access</h3>
            <p className="text-muted-foreground leading-relaxed">
              Shop from anywhere in the world without currency conversion fees or banking restrictions.
            </p>
          </div>
        </div>
      </div>

      {/* Web3 Features */}
      <div className="border-t border-border/40 bg-secondary/5">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-display">Powered by Web3</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on cutting-edge decentralized technology to provide a trustless and efficient shopping experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Smart Contracts', desc: 'Automated, secure logic' },
              { icon: Coins, title: 'EURT Stablecoin', desc: '1:1 Euro backed value' },
              { icon: Wallet, title: 'Wallet Connect', desc: 'Seamless integration' },
              { icon: BarChart3, title: 'Transparent', desc: 'On-chain history' }
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-secondary/30 transition-colors duration-300">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-foreground">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold mb-2 text-foreground">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}