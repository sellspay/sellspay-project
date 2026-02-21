import { Link } from 'react-router-dom';

interface CategoryItem {
  label: string;
  image: string | null;
  link: string;
}

interface CategoryCardProps {
  title: string;
  items: CategoryItem[];
  footerLink?: { label: string; to: string };
}

export function CategoryCard({ title, items, footerLink }: CategoryCardProps) {
  return (
    <div className="bg-card border border-border/40 rounded-lg p-5 flex flex-col h-full hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <h3 className="text-base font-bold text-foreground mb-3 tracking-tight">{title}</h3>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {items.slice(0, 4).map((item) => (
          <Link key={item.label} to={item.link} className="group">
            <div className="aspect-square rounded-md bg-muted overflow-hidden mb-1.5">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
                  📦
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors truncate">
              {item.label}
            </p>
          </Link>
        ))}
      </div>
      {footerLink && (
        <Link
          to={footerLink.to}
          className="text-xs text-primary hover:underline mt-3 inline-block"
        >
          {footerLink.label}
        </Link>
      )}
    </div>
  );
}
