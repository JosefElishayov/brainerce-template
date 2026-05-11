import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export interface CollectionLike {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

interface CollectionCardProps {
  collection: CollectionLike;
  index?: number;
  variant?: "default" | "wide" | "tall";
}

export const CollectionCard = ({ collection, index = 0, variant = "default" }: CollectionCardProps) => {
  const image =
    collection.image ||
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80";
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to={`/products?category=${collection.slug}`} className="group block relative">
        <div
          className={`relative overflow-hidden bg-muted/50 ${
            variant === "wide" ? "aspect-[16/9]" : variant === "tall" ? "aspect-[2/3]" : "aspect-[3/4]"
          }`}
        >
          <img
            src={image}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-8">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/60 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
              Collection
            </p>
            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">{collection.name}</h3>
            {collection.description && (
              <p className="text-sm text-white/70 leading-relaxed max-w-xs">{collection.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150">
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/90">Explore</span>
              <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
