"use client";

import { motion } from "framer-motion";
import { Award, Crown, Medal, Shield } from "lucide-react";
import { PRIZES } from "@/lib/constants";

export function PrizeGrid() {
  return (
    <div className="prize-grid">
      {PRIZES.map((prize, index) => {
        const Icon = index < 3 ? Medal : index === 3 || index === 7 ? Crown : index === 8 ? Shield : Award;
        return (
          <motion.article
            key={prize.label}
            className={`prize-card tone-${prize.tone} ${"emphasis" in prize && prize.emphasis ? "emphasis" : ""}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: .25 }}
            transition={{ duration: .35, delay: Math.min(index * .04, .24) }}
          >
            <span className="prize-label">{prize.label}</span>
            <strong className="prize-amount">{prize.amount}</strong>
            <Icon size={24} strokeWidth={1.5} />
          </motion.article>
        );
      })}
    </div>
  );
}
