import React from "react";

const Testimonials: React.FC = () => {
  return (
    <section aria-labelledby="testimonials" className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 id="testimonials" className="text-xl font-semibold text-foreground">What people say</h2>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <figure className="space-y-2">
          <blockquote className="text-sm text-muted-foreground">“I finally stopped doom‑adding to cart. Pocket Pause helps me breathe.”</blockquote>
          <figcaption className="text-xs text-foreground/80">— Jordan, mindful shopper</figcaption>
        </figure>
        <figure className="space-y-2">
          <blockquote className="text-sm text-muted-foreground">“Simple, kind, and effective. I’ve saved more than I expected.”</blockquote>
          <figcaption className="text-xs text-foreground/80">— Priya, new parent</figcaption>
        </figure>
        <figure className="space-y-2">
          <blockquote className="text-sm text-muted-foreground">“The pause makes all the difference. I buy less and enjoy more.”</blockquote>
          <figcaption className="text-xs text-foreground/80">— Alex, designer</figcaption>
        </figure>
      </div>
    </section>
  );
};

export default Testimonials;
