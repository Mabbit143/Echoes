import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory Echoes store pre-seeded with rich Springfield & Eugene locations
export interface ColabContribution {
  id: string;
  author: string;
  text: string;
  year?: number;
  imageUrl?: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  verifiedLocal?: boolean;
}

export interface EchoItem {
  id: string;
  title: string;
  type: 'history' | 'whisper' | 'shout' | 'quest';
  year?: number;
  eraLabel?: string;
  lat: number;
  lng: number;
  author: string;
  distanceThresholdMeters: number;
  summary: string;
  fullStory: string;
  thenImageUrl?: string;
  nowImageUrl?: string;
  audioDuration?: string;
  audioTranscript?: string;
  soundType?: 'ambient-water' | 'city-echo' | 'vintage-radio' | 'whisper-voice' | 'pioneer-wind';
  tags: string[];
  resonanceScore: number;
  upvotes?: number;
  downvotes?: number;
  isLockedWhisper?: boolean;
  passcodeHint?: string;
  secretPasscode?: string;
  isPrivateWhisper?: boolean;
  encryptedPayload?: string;
  encryptionIv?: string;
  encryptionSalt?: string;
  inviteToken?: string;
  inviteRecipient?: string;
  contributions?: ColabContribution[];
  questStep?: number;
  questTotal?: number;
  mapsUri?: string;
  verifiedLocal?: boolean;
  zone: string;
  createdAt: string;
}

let echoesData: EchoItem[] = [
  {
    id: 'springfield-the-pipe',
    title: 'The Pipe (550 Walnut Pl)',
    type: 'whisper',
    year: 1978,
    eraLabel: 'Late 20th Century Cult Lore',
    lat: 44.0416,
    lng: -123.0082,
    author: 'MysticDrifter78',
    distanceThresholdMeters: 30,
    summary: 'The iconic concrete water passage revered by generations as modern-day zen and urban folklore.',
    fullStory: 'Locals have treated this unassuming industrial crossing over the Millrace as a sacred threshold since the late 1970s. Runners, artists, and nocturnal walkers pause here to listen to the resonance of rushing water beneath the concrete.',
    thenImageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:42',
    audioTranscript: 'Listen closely to the low hum under the culvert. When the dusk falls in October, the moss glows almost electric green.',
    soundType: 'ambient-water',
    tags: ['Cult Legend', 'Urban Myth', 'The Pipe', 'Zen Walk'],
    resonanceScore: 342,
    upvotes: 48,
    downvotes: 1,
    isLockedWhisper: true,
    passcodeHint: 'What color is the October moss?',
    secretPasscode: 'green',
    zone: 'Springfield Millrace',
    verifiedLocal: true,
    contributions: [
      {
        id: 'contrib-pipe-1',
        author: 'Springfield Nightrunner',
        text: 'Midnight mist over the water under the culvert. When the freight train passes a quarter mile away, the whole concrete pipe vibrates in harmonic resonance.',
        year: 2022,
        imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-09-28T22:45:00Z',
        upvotes: 56,
        downvotes: 0,
        verifiedLocal: true,
      }
    ],
    createdAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'simpsons-mural-downtown',
    title: 'The Simpsons Official Mural',
    type: 'quest',
    year: 2014,
    eraLabel: '2014 Pop Heritage',
    lat: 44.0463,
    lng: -123.0182,
    author: 'Springfield Arts Alliance',
    distanceThresholdMeters: 25,
    summary: 'Matt Groening endorsed tribute mural celebrating the real-life Oregon namesake of America’s cartoon family.',
    fullStory: 'Painted directly onto the historic Emerald Art Center building wall, this iconic mural immortalizes Springfield as the authentic inspiration for The Simpsons. Look closely at the hidden references to local timber history.',
    thenImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:35',
    audioTranscript: 'Groening confirmed in 2012 that Springfield, Oregon was the town he had in mind since childhood.',
    soundType: 'city-echo',
    tags: ['Simpsons Trail', 'Mural Quest', 'Pop Culture', 'Emerald Art'],
    resonanceScore: 512,
    upvotes: 82,
    downvotes: 2,
    questStep: 1,
    questTotal: 4,
    zone: 'Downtown Springfield',
    verifiedLocal: true,
    contributions: [
      {
        id: 'contrib-simpsons-1',
        author: 'Maya Lin, UO Art Grad',
        text: 'I sketched the original linework on this brick alleyway during my freshman year. Every summer the community touches up Homer’s donut with fresh enamel.',
        year: 2015,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-09-12T14:00:00Z',
        upvotes: 42,
        downvotes: 1,
        verifiedLocal: true,
      },
      {
        id: 'contrib-simpsons-2',
        author: 'Coach Dave & Runners',
        text: 'Brought our high school cross-country team here for our 10-year reunion photo right beside Bart’s skateboard. A living community landmark.',
        year: 2021,
        imageUrl: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-10-02T11:20:00Z',
        upvotes: 28,
        downvotes: 0,
        verifiedLocal: true,
      }
    ],
    createdAt: '2026-10-08T09:30:00Z',
  },
  {
    id: 'washburne-historic-district',
    title: 'Washburne Historic District (1890s)',
    type: 'history',
    year: 1892,
    eraLabel: '1890s Timber Boom',
    lat: 44.0505,
    lng: -123.0162,
    author: 'Lane County Historical Society',
    distanceThresholdMeters: 50,
    summary: 'Craftsman homes and Victorian cottages built for sawmill supervisors and millwrights during the Booth-Kelly timber surge.',
    fullStory: 'In the 1890s, steam whistles from the Booth-Kelly mill dictated the rhythm of daily life here. Dirt lanes lined with wooden plank sidewalks connected homes to the railroad depots.',
    thenImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:50',
    audioTranscript: 'Archival audio recording of timber train chugging along the Main Street depot line in 1898.',
    soundType: 'vintage-radio',
    tags: ['Washburne', 'Archival Photo', '1890s Architecture', 'Pioneer'],
    resonanceScore: 289,
    zone: 'Washburne District',
    verifiedLocal: true,
    createdAt: '2026-10-05T14:15:00Z',
  },
  {
    id: 'dorris-ranch-filbert-orchard',
    title: 'Dorris Ranch Living History Farm',
    type: 'history',
    year: 1892,
    eraLabel: '1892 Pioneer Hazelnut Groves',
    lat: 44.0298,
    lng: -123.0168,
    author: 'Dorris Heritage Trust',
    distanceThresholdMeters: 40,
    summary: 'The oldest commercial filbert (hazelnut) orchard in the United States, nestled along the Willamette River.',
    fullStory: 'George Dorris planted 50 Barcelona hazelnut trees in 1892. Over 130 years later, the historic barn and canopy paths whisper with the agricultural ingenuity that defined the Willamette Valley.',
    thenImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:48',
    audioTranscript: 'The Barcelona hazelnut trees survived great frosts and river surges, anchoring families for four generations.',
    soundType: 'pioneer-wind',
    tags: ['Dorris Ranch', 'Hazelnuts', 'Willamette River', 'Living History'],
    resonanceScore: 418,
    zone: 'South Springfield',
    verifiedLocal: true,
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'springfield-depot-museum',
    title: 'Springfield History Museum & Southern Pacific Depot',
    type: 'shout',
    year: 1902,
    eraLabel: '1902 Rail Depot',
    lat: 44.0458,
    lng: -123.0205,
    author: 'Springfield Historical Archives',
    distanceThresholdMeters: 30,
    summary: 'The heart of passenger transport and telegraph communication that connected Oregon lumber to the world.',
    fullStory: 'Now home to museum archives, this wooden depot was where travelers arrived with steamer trunks and where telegrams brought news of the Pacific fleet during wartime.',
    thenImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:38',
    audioTranscript: 'Telegrams tapped out on Morse keys in this exact telegraph booth on Main Street.',
    soundType: 'vintage-radio',
    tags: ['Depot', 'Railroad', 'Community Colab', 'Museum'],
    resonanceScore: 367,
    questStep: 2,
    questTotal: 4,
    zone: 'Downtown Springfield',
    verifiedLocal: true,
    createdAt: '2026-10-09T16:20:00Z',
  },
  {
    id: 'pres-rock-memorial',
    title: 'Pre’s Rock Memorial & Skyline Trail',
    type: 'shout',
    year: 1975,
    eraLabel: '1975 Athletic Shrine',
    lat: 44.0435,
    lng: -123.0488,
    author: 'TrackTown Legacy',
    distanceThresholdMeters: 35,
    summary: 'The hallowed granite monument where runners from around the globe leave race bibs and personal tributes to Steve Prefontaine.',
    fullStory: 'On May 30, 1975, legendary runner Steve Prefontaine passed away at this rocky curve on Birch Lane. It has transformed into an emotional outdoor sanctuary where thousands of runners touch the stone for inspiration before personal races.',
    thenImageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:45',
    audioTranscript: '"To give anything less than your best is to sacrifice the gift." - archival recording tribute.',
    soundType: 'whisper-voice',
    tags: ['Running', 'Prefontaine', 'Pilgrimage', 'TrackTown'],
    resonanceScore: 840,
    zone: 'Hendricks Park / Eugene Hills',
    verifiedLocal: true,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'skinner-butte-lookout',
    title: 'Skinner Butte Summit & Skinner’s Cabin',
    type: 'history',
    year: 1846,
    eraLabel: '1846 Founding Cabin',
    lat: 44.0583,
    lng: -123.0915,
    author: 'Oregon Pioneer Chronicles',
    distanceThresholdMeters: 50,
    summary: 'Where Eugene Skinner built his trading post overlooking the Willamette Valley floodplains.',
    fullStory: 'In the spring of 1846, Skinner climbed this 682-foot butte and realized it sat above the treacherous river floods. Standing here today, you can see how an entire metropolis fanned out from this single summit lookout.',
    thenImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:55',
    audioTranscript: 'Looking south toward Spencer Butte, Skinner remarked that the river would feed mills for a hundred miles.',
    soundType: 'pioneer-wind',
    tags: ['Founding', 'Lookout', 'Eugene Skinner', 'Panorama'],
    resonanceScore: 615,
    questStep: 3,
    questTotal: 4,
    zone: 'Eugene Riverfront',
    verifiedLocal: true,
    createdAt: '2026-10-03T11:45:00Z',
  },
  {
    id: 'washburne-cafe-whisper',
    title: 'Secret Booth at Washburne Cafe',
    type: 'whisper',
    year: 2018,
    eraLabel: 'Contemporary Whisper',
    lat: 44.0468,
    lng: -123.0192,
    author: 'Clara & Devon',
    distanceThresholdMeters: 20,
    summary: 'A time-capsule whisper left at the corner brick window table where lifelong promises were made.',
    fullStory: 'We sat here over warm cardamom buns on a stormy November morning in 2018, with wet umbrellas dripping beside the radiator, and decided to take the leap to build our dream studio together.',
    thenImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:28',
    audioTranscript: 'If you are sitting at the round table with the copper teapot, smile at the barista. This place has warmth.',
    soundType: 'whisper-voice',
    tags: ['Cafe Memories', 'Love Story', 'Private Whisper', 'Main Street'],
    resonanceScore: 219,
    isLockedWhisper: false,
    zone: 'Downtown Springfield',
    verifiedLocal: true,
    createdAt: '2026-10-11T15:30:00Z',
  }
];

// Routes

// 1. Get all echoes
app.get('/api/echoes', (req, res) => {
  res.json({ success: true, count: echoesData.length, echoes: echoesData });
});

// 2. Add an echo (Supports both Public Colabs and Encrypted Private Whispers)
app.post('/api/echoes', (req, res) => {
  const {
    title,
    type,
    year,
    eraLabel,
    lat,
    lng,
    author,
    summary,
    fullStory,
    tags,
    isLockedWhisper,
    passcodeHint,
    secretPasscode,
    isPrivateWhisper,
    encryptedPayload,
    encryptionIv,
    encryptionSalt,
    inviteToken,
    inviteRecipient,
    zone,
    soundType,
    thenImageUrl,
    nowImageUrl
  } = req.body;

  if (!title || !lat || !lng || !summary) {
    return res.status(400).json({ error: 'Title, coordinates (lat, lng), and summary are required.' });
  }

  const newEcho: any = {
    id: `echo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    type: type || 'whisper',
    year: year ? Number(year) : new Date().getFullYear(),
    eraLabel: eraLabel || `${year || new Date().getFullYear()} Reflection`,
    lat: Number(lat),
    lng: Number(lng),
    author: author || 'Springfield Wanderer',
    distanceThresholdMeters: 30,
    summary,
    fullStory: fullStory || summary,
    thenImageUrl: thenImageUrl || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    nowImageUrl: nowImageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    audioDuration: '0:30',
    audioTranscript: summary,
    soundType: soundType || 'whisper-voice',
    tags: Array.isArray(tags) ? tags : ['Local Echo', type || 'whisper'],
    resonanceScore: 1,
    upvotes: 1,
    downvotes: 0,
    isLockedWhisper: !!isLockedWhisper,
    passcodeHint: passcodeHint || '',
    secretPasscode: secretPasscode || '',
    isPrivateWhisper: !!isPrivateWhisper,
    encryptedPayload: encryptedPayload || '',
    encryptionIv: encryptionIv || '',
    encryptionSalt: encryptionSalt || '',
    inviteToken: inviteToken || '',
    inviteRecipient: inviteRecipient || '',
    contributions: [],
    verifiedLocal: true,
    zone: zone || 'Local Explorer',
    createdAt: new Date().toISOString(),
  };

  echoesData.unshift(newEcho);
  res.status(201).json({ success: true, echo: newEcho });
});

// 3. React to echo (+1 Resonance)
app.post('/api/echoes/:id/react', (req, res) => {
  const echo = echoesData.find(e => e.id === req.params.id);
  if (!echo) {
    return res.status(404).json({ error: 'Echo not found' });
  }
  echo.resonanceScore += 1;
  res.json({ success: true, echoId: echo.id, resonanceScore: echo.resonanceScore });
});

// 4. Upvote / Downvote a Pin (Colab Engine)
app.post('/api/echoes/:id/vote', (req, res) => {
  const { direction } = req.body; // 'up' or 'down'
  const echo = echoesData.find(e => e.id === req.params.id);
  if (!echo) {
    return res.status(404).json({ error: 'Echo not found' });
  }

  if (direction === 'up') {
    echo.resonanceScore += 5;
    (echo as any).upvotes = ((echo as any).upvotes || 0) + 1;
  } else if (direction === 'down') {
    echo.resonanceScore = Math.max(0, echo.resonanceScore - 3);
    (echo as any).downvotes = ((echo as any).downvotes || 0) + 1;
  }

  res.json({
    success: true,
    echoId: echo.id,
    resonanceScore: echo.resonanceScore,
    upvotes: (echo as any).upvotes,
    downvotes: (echo as any).downvotes
  });
});

// 5. Add a Community Contribution (Photo + Text) to a Public Pin (Colab Engine)
app.post('/api/echoes/:id/contribute', (req, res) => {
  const { author, text, year, imageUrl } = req.body;
  const echo = echoesData.find(e => e.id === req.params.id);
  if (!echo) {
    return res.status(404).json({ error: 'Echo not found' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Story text is required.' });
  }

  const newContribution = {
    id: `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    author: author || 'Community Contributor',
    text: text.trim(),
    year: year ? Number(year) : new Date().getFullYear(),
    imageUrl: imageUrl || '',
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
    verifiedLocal: true,
  };

  if (!(echo as any).contributions) {
    (echo as any).contributions = [];
  }
  (echo as any).contributions.unshift(newContribution);
  echo.resonanceScore += 10; // Community contribution elevates pin glow

  res.status(201).json({
    success: true,
    echoId: echo.id,
    contribution: newContribution,
    contributionsCount: (echo as any).contributions.length,
    resonanceScore: echo.resonanceScore
  });
});

// 6. Upvote / Downvote a specific Community Contribution
app.post('/api/echoes/:id/contributions/:cid/vote', (req, res) => {
  const { direction } = req.body;
  const echo = echoesData.find(e => e.id === req.params.id);
  if (!echo || !(echo as any).contributions) {
    return res.status(404).json({ error: 'Echo or contributions not found' });
  }

  const contrib = (echo as any).contributions.find((c: any) => c.id === req.params.cid);
  if (!contrib) {
    return res.status(404).json({ error: 'Contribution not found' });
  }

  if (direction === 'up') {
    contrib.upvotes += 1;
    echo.resonanceScore += 2;
  } else if (direction === 'down') {
    contrib.downvotes += 1;
    contrib.upvotes = Math.max(0, contrib.upvotes - 1);
  }

  res.json({
    success: true,
    contributionId: contrib.id,
    upvotes: contrib.upvotes,
    downvotes: contrib.downvotes,
    echoResonanceScore: echo.resonanceScore
  });
});

// 4. Gemini Maps Grounding Exploration
// Uses @google/genai with model gemini-3.8-flash and tools: [{ googleMaps: {} }]
app.post('/api/gemini/maps-explore', async (req, res) => {
  const { query, latitude, longitude, cityName } = req.body;
  const lat = typeof latitude === 'number' ? latitude : 44.0463;
  const lng = typeof longitude === 'number' ? longitude : -123.0182;
  const locationLabel = cityName || 'Springfield and Eugene, Oregon';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      fallback: true,
      message: 'GEMINI_API_KEY is not configured in environment. Displaying curated Springfield & Eugene archives.',
      query: query || 'Local landmarks and historic points',
      places: echoesData.slice(0, 4).map(e => ({
        title: e.title,
        description: e.summary,
        lat: e.lat,
        lng: e.lng,
        category: e.type,
        mapsUri: `https://maps.google.com/?q=${e.lat},${e.lng}`
      }))
    });
  }

  try {
    const ai = new GoogleGenAI();
    const prompt = `You are the narrative engine for "Echoes: The Human Map". 
Research and identify real, specific historical landmarks, famous public murals, cultural spots, or legendary lore in or around "${locationLabel}" (User search/interest: "${query || 'historic landmarks, hidden gems, and murals'}").
For each spot, provide:
1. Exact Name of the place
2. Street address or approximate coordinates
3. The historical or community story / why people remember it
4. What year or era it is associated with (e.g., 1890s, 1970s, 2010s)
5. A suggested category (History, Community Shout, or Hidden Whisper)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng,
            }
          }
        }
      }
    });

    const responseText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract place links from groundingChunks
    const extractedMapSources: Array<{ uri: string; title?: string }> = [];
    for (const chunk of groundingChunks as any[]) {
      if (chunk.maps?.uri) {
        extractedMapSources.push({
          uri: chunk.maps.uri,
          title: chunk.maps.title || 'View on Google Maps'
        });
      }
    }

    res.json({
      success: true,
      text: responseText,
      groundingSources: extractedMapSources,
      location: { lat, lng, label: locationLabel }
    });
  } catch (error: any) {
    console.error('Gemini Maps Grounding error:', error);
    res.status(200).json({
      fallback: true,
      error: error?.message || 'Error executing Maps Grounding',
      message: 'Displaying curated heritage archives with Google Maps verified links.',
      groundingSources: [
        { uri: 'https://maps.google.com/?q=Emerald+Art+Center+Springfield+OR', title: 'Emerald Art Center & Simpsons Couch' },
        { uri: 'https://maps.google.com/?q=The+Pipe+550+Walnut+Pl+Springfield+OR', title: 'The Pipe (550 Walnut Pl)' },
        { uri: 'https://maps.google.com/?q=Dorris+Ranch+Springfield+OR', title: 'Dorris Ranch Living History Farm' },
        { uri: 'https://maps.google.com/?q=Pres+Rock+Eugene+OR', title: 'Pre’s Rock Memorial' },
        { uri: 'https://maps.google.com/?q=Washburne+Historic+District+Springfield+OR', title: 'Washburne Historic District' },
      ],
      text: `### Verified Local Highlights in ${locationLabel}\n\n1. **The Simpsons Official Mural (Emerald Art Center)**: Celebrating Matt Groening's real-life Oregon inspiration for The Simpsons.\n2. **The Pipe (550 Walnut Pl)**: A cult-favorite urban landmark where locals pause by the rushing Millrace canal.\n3. **Dorris Ranch**: The oldest commercial hazelnut orchard in the United States, planted in 1892 along the Willamette River.\n4. **Pre’s Rock**: A global pilgrimage site on Birch Lane where runners leave medals and track bibs for Steve Prefontaine.\n5. **Washburne Historic District**: Victorian and Craftsman residences built during the 1890s Booth-Kelly timber surge.`,
      location: { lat, lng, label: locationLabel }
    });
  }
});

// Error handler for API routes to always return JSON and handle large payloads
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Uploaded photo is too large. Please select an image under 20MB.',
    });
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server error processing request',
  });
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Echoes server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
