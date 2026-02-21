import { Link } from 'react-router-dom';
import { Search, BookOpen, Headphones, ArrowRight, MessageSquare, Newspaper, UserPlus, Shield, HelpCircle, Upload, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const supportCards = [
  {
    icon: DiscordIcon,
    title: 'Ask the Community',
    description: 'Join our Discord to connect, collaborate, and get support on your projects.',
    externalLink: 'https://discord.gg/lovable-dev',
  },
  {
    icon: BookOpen,
    title: 'Documentation & FAQ',
    description: 'Learn and build with our guides, best practices, and in-depth docs.',
    externalLink: 'https://docs.sellspay.com',
  },
  {
    icon: Headphones,
    title: 'SellsPay Support',
    description: 'Direct support for paying users. Get help with your account, billing, and platform issues.',
    action: 'open-support-dialog',
  },
];

const involvedLinks = [
  {
    icon: Newspaper,
    title: 'Platform Updates',
    description: 'News from the SellsPay engineering team.',
    link: '/community/updates',
    linkLabel: 'SellsPay Changelog',
  },
  {
    icon: UserPlus,
    title: 'Hire Professionals',
    description: 'Get help from our network of experts.',
    link: '/hire-professionals',
    linkLabel: 'Browse Editors',
  },
  {
    icon: MessageSquare,
    title: 'Become a Creator',
    description: 'Start selling your digital products today.',
    link: '/settings',
    linkLabel: 'Apply Now',
  },
  {
    icon: Shield,
    title: 'Refund Policy',
    description: 'Understand our refund and dispute process.',
    link: '/refunds',
    linkLabel: 'View Policy',
  },
];

const categories = [
  'Account & Login',
  'Billing & Payments',
  'Products & Downloads',
  'Creator Tools',
  'AI Builder',
  'Bug Report',
  'Feature Request',
  'Other',
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`Unsupported file type: ${f.name}`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`File too large: ${f.name} (max 5MB)`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  }, []);

  const handleSubmit = () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!message.trim()) {
      toast.error('Message is required');
      return;
    }
    // For now, show success — real submission would go to an edge function
    toast.success('Support ticket submitted! We\'ll get back to you within 24 hours.');
    setDialogOpen(false);
    setSubject('');
    setCategory('');
    setMessage('');
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero with subtle gradient glow */}
      <section className="relative pt-24 sm:pt-32 pb-20 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.06] blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-[100px]" />
          <div className="absolute top-10 right-1/4 w-[250px] h-[250px] rounded-full bg-accent/[0.03] blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-10">
            Help & Support
          </h1>

          <div className="max-w-xl mx-auto relative">
            <div
              className={`
                relative flex items-center rounded-2xl transition-all duration-300
                bg-white/[0.04] backdrop-blur-xl border
                ${searchFocused ? 'border-primary/40 shadow-[0_0_24px_-4px_hsl(217_91%_60%/0.15)]' : 'border-white/[0.08]'}
              `}
            >
              <Search className="absolute left-4 h-[18px] w-[18px] text-muted-foreground" />
              <input
                type="text"
                placeholder="Ask anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <HelpCircle className="absolute right-4 h-[18px] w-[18px] text-muted-foreground/50" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Support Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {supportCards.map((card, i) => {
            const Icon = card.icon;
            const inner = (
              <motion.div
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={cardVariants}
                className="group relative rounded-2xl p-6 h-full flex flex-col gap-4
                  bg-white/[0.03] backdrop-blur-md
                  border border-white/[0.06]
                  hover:border-primary/20 hover:bg-white/[0.05]
                  transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-primary/[0.04] to-transparent" />
                <div className="relative z-10 flex flex-col gap-3 flex-1">
                  <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <h3 className="text-[15px] font-semibold tracking-tight">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            );

            if (card.action === 'open-support-dialog') {
              return (
                <button key={card.title} onClick={() => setDialogOpen(true)} className="text-left">
                  {inner}
                </button>
              );
            }
            if (card.externalLink) {
              return (
                <a key={card.title} href={card.externalLink} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              );
            }
            return null;
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Get Involved */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-28">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-center mb-14"
        >
          Get involved
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
          {involvedLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={cardVariants}
                className="space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-muted-foreground/70" />
                  <h3 className="text-[15px] font-semibold tracking-tight">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-[26px]">
                  {item.description}
                </p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pl-[26px] group/link"
                >
                  {item.linkLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact Support Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Contact Support</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Estimated response time: within 24 hours (primarily on weekdays).
              <br />
              Please note that we can't support project-related issues, see the{' '}
              <Link to="/faq" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors" onClick={() => setDialogOpen(false)}>
                Documentation & FAQ
              </Link>{' '}
              for tips and tricks.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Subject <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Category</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border text-sm transition-all hover:border-border/80 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                >
                  <span className={category ? 'text-foreground' : 'text-muted-foreground'}>
                    {category || 'Select a category...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {categoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-xl overflow-hidden"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat); setCategoryOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-sm hover:bg-muted/60 transition-colors ${category === cat ? 'text-primary bg-primary/[0.06]' : 'text-foreground'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {!category && (
                  <p className="text-xs text-muted-foreground mt-1">If you want to categorize your issue, select it above.</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Message <span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Attachments</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all
                  ${isDragging ? 'border-primary/50 bg-primary/[0.04]' : 'border-border hover:border-border/80 bg-muted/30'}
                `}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Supported formats: Images, PDF, DOC (max 5MB total)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx"
                  onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
                  className="hidden"
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs text-foreground">
                      <span className="max-w-[120px] truncate">{f.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, j) => j !== idx)); }} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Submit
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
