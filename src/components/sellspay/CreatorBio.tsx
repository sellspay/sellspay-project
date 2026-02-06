import React from 'react';

interface CreatorBioProps {
  name: string;
  avatar: string;
  bio: string;
  socialLinks?: { platform: string; url: string }[];
  className?: string;
}

export function CreatorBio({ name, avatar, bio, socialLinks, className = '' }: CreatorBioProps) {
  return (
    <section className={`py-16 px-6 ${className}`}>
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <img 
          src={avatar} 
          alt={name}
          className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-border"
        />
        <h2 className="text-2xl font-bold text-foreground">{name}</h2>
        <p className="text-muted-foreground leading-relaxed">{bio}</p>
        {socialLinks && socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 pt-4">
            {socialLinks.map((link, i) => (
              <a 
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default CreatorBio;
