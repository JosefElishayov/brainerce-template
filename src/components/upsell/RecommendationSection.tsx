import type { Product, ProductRecommendation } from "brainerce";
import { ProductCard } from "@/components/ProductCard";

interface Props {
  title: string;
  eyebrow?: string;
  items: ProductRecommendation[];
  limit?: number;
}

export const RecommendationSection = ({ title, eyebrow, items, limit = 4 }: Props) => {
  if (!items?.length) return null;
  const list = items.slice(0, limit);
  return (
    <section className="py-16 md:py-20 border-t border-border">
      <div className="container-full">
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl md:text-4xl mb-10">{title}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p as unknown as Product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
