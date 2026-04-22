import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: Array<{
    path:       string;
    priority:   number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }> = [
    { path: '/',         priority: 1.0, changeFrequency: 'daily'   },
    { path: '/fridge',   priority: 0.9, changeFrequency: 'daily'   },
    { path: '/closet',   priority: 0.9, changeFrequency: 'daily'   },
    { path: '/mypage',   priority: 0.8, changeFrequency: 'weekly'  },
    { path: '/seasonal', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/settings', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/legal',    priority: 0.3, changeFrequency: 'yearly'  },
  ];

  return routes.map((r) => ({
    url:        `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority:   r.priority,
  }));
}
