import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ArrowRight } from 'lucide-react';
import catBeats from '@/assets/cat-beats.jpg';
import catDigitalArt from '@/assets/cat-digital-art.jpg';
import catPhotography from '@/assets/cat-photography.jpg';
import catSoftware from '@/assets/cat-software.jpg';
import catSfx from '@/assets/cat-sfx.jpg';
import catCourses from '@/assets/cat-courses.jpg';
import catTemplates from '@/assets/cat-templates.jpg';

const categories = [
  { label: 'Beats & Music', image: catBeats, path: '/explore?type=beat' },
  { label: 'Digital Art', image: catDigitalArt, path: '/explore?type=digital_art' },
  { label: 'Photography', image: catPhotography, path: '/explore?type=photography' },
  { label: 'Software', image: catSoftware, path: '/explore?type=software' },
  { label: 'Sound Effects', image: catSfx, path: '/explore?type=sfx' },
  { label: 'Courses', image: catCourses, path: '/explore?type=course' },
  { label: 'Templates', image: catTemplates, path: '/explore?type=template' },
];

export function BrowseCategories() {
  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-16 sm:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              Marketplace
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 shrink-0"
          >
            Explore All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Grid layout for larger presence */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-0 border border-border/10 rounded-2xl group-hover:border-primary/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <span className="text-sm sm:text-base font-bold text-foreground">{cat.label}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
