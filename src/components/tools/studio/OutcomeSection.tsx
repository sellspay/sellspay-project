import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface OutcomeSectionProps {
  title: string;
  emoji: string;
  children: ReactNode;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export function OutcomeSection({ title, emoji, children }: OutcomeSectionProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={container}
      className="max-w-7xl mx-auto px-4 sm:px-6"
    >
      <motion.h2 variants={item} className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </motion.h2>
      <motion.div variants={container} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </motion.div>
    </motion.section>
  );
}

export { item as outcomeItemVariant };
