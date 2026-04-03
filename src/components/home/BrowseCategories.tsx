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
      <section className="px-6 sm:px-8 lg:px-10 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Browse by Category
          </h2>
          <Link
            to="/explore"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Explore All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Horizontal scroll row like Artlist's category strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              className="group relative flex-shrink-0 w-40 sm:w-48 overflow-hidden rounded-xl"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-sm font-bold text-foreground">{cat.label}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
