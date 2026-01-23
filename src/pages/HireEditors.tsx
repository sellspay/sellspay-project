import { Search, Filter, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const featuredEditors = [
  {
    id: 1,
    name: 'Alex Chen',
    username: 'alexedits',
    avatar: '/placeholder.svg',
    specialty: 'Motion Graphics',
    rating: 4.9,
    projects: 150,
    verified: true,
    hourlyRate: '$50-75',
  },
  {
    id: 2,
    name: 'Sarah Miller',
    username: 'sarahmiller',
    avatar: '/placeholder.svg',
    specialty: 'Color Grading',
    rating: 4.8,
    projects: 120,
    verified: true,
    hourlyRate: '$40-60',
  },
  {
    id: 3,
    name: 'Marcus Johnson',
    username: 'mjcreative',
    avatar: '/placeholder.svg',
    specialty: 'VFX & Compositing',
    rating: 5.0,
    projects: 89,
    verified: true,
    hourlyRate: '$75-100',
  },
];

const categories = [
  'All Editors',
  'Motion Graphics',
  'Color Grading',
  'VFX',
  'Sound Design',
  'Thumbnail Design',
  'Video Editing',
];

export default function HireEditors() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Hire Top Editors
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find skilled video editors, motion designers, and creative professionals 
            for your next project.
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search editors by skill or name..." 
                className="pl-10 h-12 bg-card"
              />
            </div>
            <Button variant="outline" className="h-12 gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category, index) => (
              <Button
                key={category}
                variant={index === 0 ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Editors */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Editors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEditors.map((editor) => (
              <Card key={editor.id} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <img 
                      src={editor.avatar} 
                      alt={editor.name}
                      className="w-16 h-16 rounded-full object-cover bg-muted"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{editor.name}</CardTitle>
                        {editor.verified && (
                          <CheckCircle className="h-4 w-4 text-primary fill-primary" />
                        )}
                      </div>
                      <CardDescription>@{editor.username}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge variant="secondary">{editor.specialty}</Badge>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{editor.rating}</span>
                        <span className="text-muted-foreground">({editor.projects} projects)</span>
                      </div>
                      <span className="text-muted-foreground">{editor.hourlyRate}/hr</span>
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
