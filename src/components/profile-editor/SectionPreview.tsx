import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import {
  ProfileSection,
  TextContent,
  ImageContent,
  ImageWithTextContent,
  GalleryContent,
  VideoContent,
  CollectionContent,
  AboutMeContent,
  HeadlineContent,
  DividerContent,
} from './types';

interface SectionPreviewProps {
  section: ProfileSection;
  onClick: () => void;
}

export function SectionPreview({ section, onClick }: SectionPreviewProps) {
  const renderPreview = () => {
    switch (section.section_type) {
      case 'text':
        return <TextPreview content={section.content as TextContent} />;
      case 'image':
        return <ImagePreview content={section.content as ImageContent} />;
      case 'image_with_text':
        return <ImageWithTextPreview content={section.content as ImageWithTextContent} />;
      case 'gallery':
        return <GalleryPreview content={section.content as GalleryContent} />;
      case 'video':
        return <VideoPreview content={section.content as VideoContent} />;
      case 'collection':
        return <CollectionPreview content={section.content as CollectionContent} />;
      case 'about_me':
        return <AboutMePreview content={section.content as AboutMeContent} />;
      case 'headline':
        return <HeadlinePreview content={section.content as HeadlineContent} />;
      case 'divider':
        return <DividerPreview content={section.content as DividerContent} />;
      default:
        return <div className="p-4 text-muted-foreground">Unknown section type</div>;
    }
  };

  return (
    <div
      className="group relative border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer bg-card"
      onClick={onClick}
    >
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="sm">
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>
      </div>
      {renderPreview()}
    </div>
  );
}

function TextPreview({ content }: { content: TextContent }) {
  const alignClass = 
    content.alignment === 'center' ? 'text-center' :
    content.alignment === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={`p-6 ${alignClass}`}>
      {content.title && (
        <h3 className="text-xl font-semibold text-foreground mb-2">{content.title}</h3>
      )}
      <p className="text-muted-foreground whitespace-pre-wrap">{content.body}</p>
    </div>
  );
}

function ImagePreview({ content }: { content: ImageContent }) {
  const sizeClass = 
    content.layout === 'small' ? 'max-w-md mx-auto' :
    content.layout === 'medium' ? 'max-w-2xl mx-auto' : 'w-full';

  return (
    <div className={`${sizeClass}`}>
      {content.imageUrl ? (
        <img
          src={content.imageUrl}
          alt={content.altText || ''}
          className="w-full rounded-lg"
        />
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
          <span className="text-muted-foreground">No image</span>
        </div>
      )}
      {content.caption && (
        <p className="text-sm text-muted-foreground mt-2 text-center">{content.caption}</p>
      )}
    </div>
  );
}

function ImageWithTextPreview({ content }: { content: ImageWithTextContent }) {
  const isLeft = content.imagePosition === 'left';

  return (
    <div className={`flex flex-col md:flex-row ${isLeft ? '' : 'md:flex-row-reverse'} gap-6 p-6`}>
      <div className="md:w-1/2">
        {content.imageUrl ? (
          <img
            src={content.imageUrl}
            alt=""
            className="w-full h-64 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <div className="md:w-1/2 flex flex-col justify-center">
        <h3 className="text-2xl font-bold text-foreground mb-3">{content.title}</h3>
        <p className="text-muted-foreground mb-4">{content.body}</p>
        {content.buttonText && (
          <Button className="w-fit">{content.buttonText}</Button>
        )}
      </div>
    </div>
  );
}

function GalleryPreview({ content }: { content: GalleryContent }) {
  if (content.images.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No images in gallery
      </div>
    );
  }

  return (
    <div
      className="p-6 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${content.columns}, 1fr)` }}
    >
      {content.images.map((img, idx) => (
        <img
          key={idx}
          src={img.url}
          alt={img.altText || ''}
          className="w-full aspect-square object-cover rounded-lg"
        />
      ))}
    </div>
  );
}

function VideoPreview({ content }: { content: VideoContent }) {
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(content.videoUrl);

  return (
    <div className="p-6">
      {content.title && (
        <h3 className="text-xl font-semibold text-foreground mb-3 text-center">
          {content.title}
        </h3>
      )}
      {embedUrl ? (
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Enter a YouTube URL</span>
        </div>
      )}
      {content.description && (
        <p className="text-muted-foreground mt-3 text-center">{content.description}</p>
      )}
    </div>
  );
}

function CollectionPreview({ content }: { content: CollectionContent }) {
  return (
    <div className="p-6 text-center">
      <div className="py-8 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">
          {content.collectionId
            ? `Collection: ${content.collectionId}`
            : 'No collection selected'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Display: {content.displayStyle}
        </p>
      </div>
    </div>
  );
}

function AboutMePreview({ content }: { content: AboutMeContent }) {
  return (
    <div className="p-6 text-center">
      {content.showAvatar && (
        <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-4 overflow-hidden flex items-center justify-center">
          {content.imageUrl ? (
            <img 
              src={content.imageUrl} 
              alt="About me" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-primary">A</span>
          )}
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground mb-2">{content.title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">{content.description}</p>
    </div>
  );
}

function HeadlinePreview({ content }: { content: HeadlineContent }) {
  const sizeClass = 
    content.size === 'small' ? 'text-2xl' :
    content.size === 'medium' ? 'text-3xl' : 'text-4xl';

  return (
    <div className="p-6 text-center">
      <h2 className={`font-bold text-foreground ${sizeClass}`}>{content.text}</h2>
    </div>
  );
}

function DividerPreview({ content }: { content: DividerContent }) {
  return (
    <div className="py-4">
      {content.style === 'line' && <hr className="border-border" />}
      {content.style === 'space' && <div className="h-8" />}
      {content.style === 'dots' && (
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
