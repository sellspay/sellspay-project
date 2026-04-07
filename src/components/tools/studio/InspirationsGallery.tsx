import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, Play, X, Sparkles, ArrowRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Image imports
import insp1 from "@/assets/inspirations/insp-1.jpg";
import insp2 from "@/assets/inspirations/insp-2.jpg";
import insp3 from "@/assets/inspirations/insp-3.jpg";
import insp4 from "@/assets/inspirations/insp-4.jpg";
import insp5 from "@/assets/inspirations/insp-5.jpg";
import insp6 from "@/assets/inspirations/insp-6.jpg";
import insp7 from "@/assets/inspirations/insp-7.jpg";
import insp8 from "@/assets/inspirations/insp-8.jpg";
import insp9 from "@/assets/inspirations/insp-9.jpg";
import insp10 from "@/assets/inspirations/insp-10.jpg";
import insp11 from "@/assets/inspirations/insp-11.jpg";
import insp12 from "@/assets/inspirations/insp-12.jpg";
import insp13 from "@/assets/inspirations/insp-13.jpg";
import insp14 from "@/assets/inspirations/insp-14.jpg";
import insp15 from "@/assets/inspirations/insp-15.jpg";
import insp16 from "@/assets/inspirations/insp-16.jpg";
import insp17 from "@/assets/inspirations/insp-17.jpg";
import insp18 from "@/assets/inspirations/insp-18.jpg";
import insp19 from "@/assets/inspirations/insp-19.jpg";
import insp20 from "@/assets/inspirations/insp-20.jpg";
import insp21 from "@/assets/inspirations/insp-21.jpg";
import insp22 from "@/assets/inspirations/insp-22.jpg";
import insp23 from "@/assets/inspirations/insp-23.jpg";
import insp24 from "@/assets/inspirations/insp-24.jpg";
import insp25 from "@/assets/inspirations/insp-25.jpg";
import insp26 from "@/assets/inspirations/insp-26.jpg";
import insp27 from "@/assets/inspirations/insp-27.jpg";
import insp28 from "@/assets/inspirations/insp-28.jpg";
import insp29 from "@/assets/inspirations/insp-29.jpg";
import insp30 from "@/assets/inspirations/insp-30.jpg";
import insp31 from "@/assets/inspirations/insp-31.jpg";

// Video thumbnail imports
import vid1Thumb from "@/assets/inspirations/vid-1.jpg";
import vid2Thumb from "@/assets/inspirations/vid-2.jpg";
import vid3Thumb from "@/assets/inspirations/vid-3.jpg";
import vid4Thumb from "@/assets/inspirations/vid-4.jpg";
import vid5Thumb from "@/assets/inspirations/vid-5.jpg";
import vid6Thumb from "@/assets/inspirations/vid-6.jpg";
import vid7Thumb from "@/assets/inspirations/vid-7.jpg";
import vid8Thumb from "@/assets/inspirations/vid-8.jpg";
import vid9Thumb from "@/assets/inspirations/vid-9.jpg";
import vid10Thumb from "@/assets/inspirations/vid-10.jpg";
import vid11Thumb from "@/assets/inspirations/vid-11.jpg";
import vid12Thumb from "@/assets/inspirations/vid-12.jpg";
import vid13Thumb from "@/assets/inspirations/vid-13.jpg";
import vid14Thumb from "@/assets/inspirations/vid-14.jpg";
import vid15Thumb from "@/assets/inspirations/vid-15.jpg";
import vid16Thumb from "@/assets/inspirations/vid-16.jpg";
import vid17Thumb from "@/assets/inspirations/vid-17.jpg";
import vid18Thumb from "@/assets/inspirations/vid-18.jpg";
import vid19Thumb from "@/assets/inspirations/vid-19.jpg";
import vid20Thumb from "@/assets/inspirations/vid-20.jpg";
import vid21Thumb from "@/assets/inspirations/vid-21.jpg";
import vid22Thumb from "@/assets/inspirations/vid-22.jpg";
import vid23Thumb from "@/assets/inspirations/vid-23.jpg";
import vid24Thumb from "@/assets/inspirations/vid-24.jpg";
import vid25Thumb from "@/assets/inspirations/vid-25.jpg";
import vid26Thumb from "@/assets/inspirations/vid-26.jpg";
import vid27Thumb from "@/assets/inspirations/vid-27.jpg";

// Video asset imports
import vid1Video from "@/assets/inspirations/vid-1.mp4.asset.json";
import vid2Video from "@/assets/inspirations/vid-2.mp4.asset.json";
import vid3Video from "@/assets/inspirations/vid-3.mp4.asset.json";
import vid4Video from "@/assets/inspirations/vid-4.mp4.asset.json";
import vid5Video from "@/assets/inspirations/vid-5-v2.mp4.asset.json";
import vid6Video from "@/assets/inspirations/vid-6-v2.mp4.asset.json";
import vid7Video from "@/assets/inspirations/vid-7.mp4.asset.json";
import vid8Video from "@/assets/inspirations/vid-8.mp4.asset.json";
import vid9Video from "@/assets/inspirations/vid-9-v2.mp4.asset.json";
import vid10Video from "@/assets/inspirations/vid-10.mp4.asset.json";
import vid11Video from "@/assets/inspirations/vid-11.mp4.asset.json";
import vid12Video from "@/assets/inspirations/vid-12.mp4.asset.json";
import vid13Video from "@/assets/inspirations/vid-13.mp4.asset.json";
import vid14Video from "@/assets/inspirations/vid-14.mp4.asset.json";
import vid15Video from "@/assets/inspirations/vid-15.mp4.asset.json";
import vid16Video from "@/assets/inspirations/vid-16.mp4.asset.json";
import vid17Video from "@/assets/inspirations/vid-17.mp4.asset.json";
import vid18Video from "@/assets/inspirations/vid-18.mp4.asset.json";
import vid19Video from "@/assets/inspirations/vid-19.mp4.asset.json";
import vid20Video from "@/assets/inspirations/vid-20.mp4.asset.json";
import vid21Video from "@/assets/inspirations/vid-21.mp4.asset.json";
import vid22Video from "@/assets/inspirations/vid-22.mp4.asset.json";
import vid23Video from "@/assets/inspirations/vid-23.mp4.asset.json";
import vid24Video from "@/assets/inspirations/vid-24.mp4.asset.json";
import vid25Video from "@/assets/inspirations/vid-25.mp4.asset.json";
import vid26Video from "@/assets/inspirations/vid-26.mp4.asset.json";
import vid27Video from "@/assets/inspirations/vid-27.mp4.asset.json";

type Tab = "image" | "video";

interface GalleryItem {
  src: string;
  videoUrl?: string;
  label: string;
  prompt: string;
  toolId: string;
}

const IMAGE_ITEMS: GalleryItem[] = [
  { src: insp1, label: "Sushi chef cat", prompt: "Style & Lighting: Hyper-realistic editorial food photography with a comedic twist. Shot with a shallow depth of field on a full-frame mirrorless camera at f/1.8, creating a creamy bokeh background. Natural warm afternoon sunlight streams from the upper left, casting soft golden highlights across the subject's fur. The overall tone is warm and saturated with slight orange-teal color grading reminiscent of a Wes Anderson film still.\n\nSubject & Pose: A plump orange tabby cat sitting upright on a pristine white marble kitchen countertop, wearing a tiny white chef's hat (toque blanche) that tilts slightly to one side. The cat's expression is one of dignified seriousness — half-closed eyes, slightly raised chin — as it holds a single perfectly formed sushi roll between both front paws.\n\nDetails: The sushi roll features vibrant orange salmon, white rice, dark nori wrapper, and a tiny dollop of wasabi on top. Beside the cat sits a small ceramic sake cup and a pair of lacquered red chopsticks resting on a bamboo mat. The chef's hat has a subtle golden embroidered star.\n\nBackground: A softly blurred professional kitchen with stainless steel surfaces, hanging copper pots, and warm pendant lighting creating golden bokeh circles.", toolId: "image-generator" },
  { src: insp2, label: "Lavender storm phone booth", prompt: "Style & Lighting: Cinematic wide-angle landscape photography with dramatic chiaroscuro lighting. The scene is captured during the fleeting moments of blue hour, just after sunset, with the last traces of amber light on the horizon contrasting against deep indigo storm clouds rolling in from the east. Filmic grain structure reminiscent of Kodak Portra 800, with slightly lifted blacks and rich midtone contrast. Rain is beginning to fall, creating a silvery veil in the distance.\n\nSubject & Composition: A solitary vintage red telephone box (classic British K6 design) standing in the middle of an impossibly vast lavender field in Provence, France. The lavender rows create dramatic leading lines converging toward the phone box. The booth's interior light is on, casting a warm golden glow through its glass panels.\n\nDetails: The phone box paint is slightly weathered with small chips revealing black primer beneath. Condensation beads on the glass panels. A handwritten 'OUT OF ORDER' sign hangs inside. A lone crow perches on top of the booth. Lightning flickers silently in the distant clouds.", toolId: "image-generator" },
  { src: insp3, label: "Midnight Shelby GT500", prompt: "Style & Lighting: High-end luxury automotive photography with a dramatic low-angle perspective. The primary light source is a massive softbox directly overhead, creating a perfect specular reflection running the length of the car's body. Additional rim lights in cool blue accent the car's silhouette. The floor is polished black epoxy, reflecting the vehicle and lights like a dark mirror.\n\nSubject: A 1967 Ford Mustang Shelby GT500 in deep midnight blue metallic paint, positioned at a three-quarter front angle. The car has been meticulously restored with period-correct chrome bumpers, dual racing stripes in white pearl, and Shelby snake emblems. The headlights are on, casting warm tungsten beams forward.\n\nDetails: Tiny water droplets bead across the hood and roof, each droplet catching and refracting the neon lighting. The interior is visible through the driver's window — red leather bucket seats, wood-grain steering wheel. A thin wisp of exhaust smoke curls from the chrome tailpipes.\n\nBackground: A vast, dark industrial space — an abandoned aircraft hangar — with two vertical strips of magenta and cyan neon tubing framing the car in the deep background.", toolId: "image-generator" },
  { src: insp4, label: "Dewdrop world", prompt: "Style & Lighting: Ultra-realistic macro photography captured with a specialized tilt-shift macro lens at 5:1 magnification. Focus stacking technique reveals extraordinary detail. Backlighting from early morning sun creates a luminous, translucent quality. Slight lens flare adds cinematic quality. The color palette is dominated by jewel tones — deep emerald greens, brilliant sapphire blues, and warm amber highlights.\n\nSubject: A single large dewdrop clinging to the edge of a deep green leaf, acting as a natural fisheye lens that perfectly refracts and inverts a miniature world inside it — a complete garden scene with red roses, a white picket fence, and a bright blue sky with fluffy clouds.\n\nDetails: The leaf has visible cellular structure and fine translucent veins. Tiny secondary water droplets scatter across the leaf surface like scattered diamonds. A thin strand of spider silk connects to the main dewdrop, bending under the weight of an even tinier droplet. The leaf's edge shows natural imperfections — a small nibbled section and a subtle curl.\n\nBackground: Layers of out-of-focus vegetation with scattered points of golden light creating a dreamy, ethereal bokeh pattern. A single out-of-focus red flower creates a warm color accent.", toolId: "image-generator" },
  { src: insp5, label: "Monarch butterfly crown", prompt: "Style & Lighting: Dramatic high-fashion editorial photography in the style of Annie Leibovitz meets surrealism. Shot on a medium format Hasselblad. The lighting uses a large octabox as key light from upper right, creating dramatic Rembrandt lighting with a distinct triangular highlight on the shadow-side cheek. A hair light from behind creates a luminous rim. Deep, saturated color palette with rich crimsons, golds, and deep blacks.\n\nSubject & Pose: A striking woman in her 30s with sharp angular features and dark skin, captured in a three-quarter portrait. She wears an elaborate headpiece made entirely of hundreds of living Monarch butterflies in various stages of wing-spread. Her expression is serene and regal, eyes closed, chin slightly elevated, lips painted in deep burgundy.\n\nDetails: Each butterfly is individually detailed with characteristic orange and black wing patterns, visible fuzzy thorax. Some have slight wing damage adding authenticity. The woman's skin has a subtle golden highlight powder. She wears a high-necked black velvet dress with intricate jet beading. One butterfly has landed on her lower lip.\n\nBackground: A painterly gradient from deep charcoal to warm umber, with subtle traces of golden dust particles floating in the backlight, reminiscent of a Renaissance painting.", toolId: "image-generator" },
  { src: insp6, label: "Osaka midnight ramen", prompt: "Style & Lighting: Atmospheric street photography with a lo-fi analog film aesthetic, mimicking Fujifilm Superia 400 pushed to 1600 ISO — prominent but pleasing grain, slightly shifted greens, warm shadow tones. Lit entirely by practical lights — neon signage, steam from street vents, and warm restaurant interiors. Shot at f/2.0 on a wide-angle 28mm lens. Light rain creates streaks in the neon reflections on wet pavement.\n\nSubject & Scene: A narrow backstreet in Osaka's Shinsekai district at 2 AM, nearly empty. A lone elderly man in a rumpled tan raincoat and flat cap stands at a tiny street-side ramen counter (yatai), hunched over a steaming bowl. Only four red vinyl stools, three empty.\n\nDetails: Steam rises dramatically from the ramen bowl, backlit by a warm pendant bulb. The old man's chopsticks are poised mid-lift, capturing a tangle of noodles. Hand-painted menu boards with Japanese characters flank the counter. A rusted bicycle with a wire basket is parked against a telephone pole. Overlapping neon signs in katakana create a patchwork of color on the wet asphalt. A sleeping calico cat curls up on the empty stool nearest the camera.\n\nBackground: The narrow alley recedes into misty darkness with a single vending machine glowing electric blue against the far wall.", toolId: "image-generator" },
  { src: insp7, label: "Impossible floating city", prompt: "Style & Lighting: Surreal digital art with photorealistic rendering quality, combining M.C. Escher's impossible architecture with James Turrell's dreamlike color palettes. The scene is illuminated by an otherworldly ambient glow — warm peach and coral tones from the buildings contrast with cool cerulean and lavender from the sky. Volumetric fog rolls between structures. The mood is tranquil, meditative, and slightly unsettling.\n\nSubject & Composition: An impossible floating city of interconnected pastel-colored buildings and staircases that defy gravity — some structures hang inverted from above, others spiral sideways. Bridges connect buildings at impossible angles. Waterfalls flow upward along the sides, creating prismatic mist. Small glowing lanterns dot the pathways.\n\nDetails: The architecture blends Mediterranean whitewashed walls with Japanese pagoda-style roofing in soft mint and blush pink. Lush green hanging gardens and cascading bougainvillea in deep magenta drape from balconies. Tiny silhouettes of people walk calmly along the staircases — some on the undersides of structures. A flock of white doves spirals through the central void.\n\nSky: A gradient from warm amber through soft pink to deep celestial purple at the zenith, dotted with oversized stars and a massive crescent moon.", toolId: "image-generator" },
  { src: insp8, label: "Whiskey ice sphere", prompt: "Style & Lighting: High-end product photography with a dark, moody luxury aesthetic. Shot on a Phase One IQ4 medium format digital back. Single large strip softbox at 45-degree angle creating a long specular highlight across the glass surface. A second strip light behind creates a thin rim light. The exposure is deliberately dark and dramatic — lifted only in the highlights.\n\nSubject: A crystal-clear double old fashioned glass containing a single massive sphere of ice, perfectly transparent with visible micro-fractures and tiny trapped air bubbles refracting light like diamonds. Amber-colored whiskey fills the glass two-thirds, its warm honey tones contrasted against the cold clarity of the ice sphere. A thin curl of orange peel rests on the rim, twisted into a perfect spiral.\n\nDetails: Condensation beads cover the lower portion of the glass exterior — dozens of perfectly spherical water droplets, each one catching and reflecting the strip light. The ice sphere has a single vertical crack running through its center, splitting the refracted image. Three droplets of condensation have rolled down to pool on the black reflective surface beneath.\n\nBackground & Surface: Absolute black background — no visible horizon line. The glass sits on a polished black obsidian-like surface providing a mirror reflection.", toolId: "image-generator" },
  { src: insp9, label: "Autumn torii gate", prompt: "Style & Lighting: Epic wide-angle landscape photography in the tradition of Ansel Adams meets modern HDR processing. Shot during a rare atmospheric phenomenon where fog fills a valley floor while mountain peaks pierce through into golden morning light. The lighting creates a dramatic two-layer effect: warm honey-colored direct sunlight illuminating peaks and canopy tops, while fog below is lit in cool blue-gray from scattered skylight.\n\nSubject & Composition: A sweeping vista of a Japanese mountain valley during peak autumn color season. A traditional red-painted wooden torii gate stands at the edge of a cliff in the foreground, partially draped in golden ginkgo leaves and crimson maple branches. Beyond the gate, the valley drops away into a sea of cotton-white fog with dark green conifer peaks poking through like islands. Mount Fuji rises above the fog layer, its peak catching the first pink and gold rays of sunrise.\n\nDetails: The torii gate's vermillion paint is weathered and chipped, revealing gray wood grain — covered in sage-green lichen and moss at the base. A thick braided shimenawa rope with white paper zigzag streamers hangs between the posts. Individual maple leaves are sharp enough to see serrated edges and vein patterns. A stone lantern sits beside the gate, its chamber glowing with a candle. Morning dew clings to spider webs between gate posts.\n\nAtmosphere: God-rays stream through gaps in the distant mountain ridge, creating visible shafts of golden light in the mist.", toolId: "image-generator" },
  { src: insp10, label: "Laughing fisherman", prompt: "Style & Lighting: Intimate candid portrait photography with a warm, nostalgic quality reminiscent of golden-era National Geographic portraiture. Shot on an 85mm prime lens at f/1.4, creating extremely shallow depth of field. Late afternoon sun filtering through a window with sheer curtains, creating soft, diffused directional light with warm amber tones. Slight backlight catches wisps of hair.\n\nSubject: An elderly Japanese fisherman (around 80 years old) with deeply weathered, sun-darkened skin. He's captured mid-laugh, eyes crinkled nearly shut with genuine joy, revealing a gap-toothed smile. His white hair is cropped close, silver stubble catches the window light. He wears a faded indigo-dyed cotton kimono (samue work clothes) with visible mending patches in slightly different shades of blue.\n\nDetails: His hands — thick, calloused fingers with short square nails and age spots — are wrapped around a small ceramic tea cup (yunomi) with a crackled blue glaze. The veins and tendons are prominent. The texture of his skin is rendered in extraordinary detail — individual pores, tiny white hairs on his cheeks, the translucent quality of aged skin.\n\nBackground: A softly blurred traditional Japanese interior — warm wooden beams, a paper shoji screen with soft light behind it, the faintest suggestion of a hanging scroll calligraphy.", toolId: "image-generator" },
  { src: insp11, label: "Split-level ocean dress", prompt: "Style & Lighting: Dramatic underwater photography with a split-level perspective — half above water, half below — captured during golden hour. The above-water portion is bathed in warm amber light, while the underwater portion is illuminated by scattered cyan-tinted light. The waterline creates a natural division, slightly distorted by gentle ripples.\n\nSubject: A young woman floating peacefully in crystal-clear tropical water, wearing a flowing white linen dress that spreads out around her like a blooming flower. Her eyes are closed, face serene, arms spread wide. Her long dark hair fans out in the water. Schools of tiny iridescent silver fish swim beneath her. A sea turtle swims in the mid-ground below.\n\nDetails: Scattered white frangipani flowers float on the water surface. A jagged volcanic island rises in the soft-focus background. The dress fabric billows and undulates, creating organic sculptural shapes. Bubbles cluster along the underside of the dress. The white sandy seabed shows gentle ripple patterns caused by sunlight refraction.\n\nColor palette: Rich contrast between warm golden above-water tones and cool aquamarine underwater world, unified by the white dress.", toolId: "image-generator" },
  { src: insp12, label: "Miniature Italian coast", prompt: "Style & Lighting: Hyper-detailed miniature diorama photography with extreme tilt-shift effect creating the illusion that a real-world scene is a tiny model. Shot from a high bird's-eye angle at approximately 60 degrees. The tilt-shift lens creates an ultra-narrow band of sharp focus in the center third. Late afternoon warm directional lighting casts long dramatic shadows. Saturated and cheerful palette — think miniature train set brought to life.\n\nSubject & Scene: A bustling Italian coastal village (reminiscent of Cinque Terre) compressed into what appears to be a miniature model world. Colorful buildings in terracotta, sunflower yellow, ocean blue, mint green, and salmon pink stack up the hillside. Tiny boats — fishing vessels with red and blue hulls — dot the small harbor. Miniature people sit at outdoor café tables with checkered tablecloths.\n\nDetails: Laundry lines strung between buildings with tiny colored garments. A minuscule Vespa scooter parked on a narrow cobblestone street. Window boxes overflowing with red geraniums. A tiny church bell tower with a copper-green patina roof. The water is impossibly turquoise with visible pebbles on the seafloor. A single seagull appears frozen mid-flight.", toolId: "image-generator" },
  { src: insp13, label: "Renaissance tiger portrait", prompt: "Style & Lighting: Cinematic portrait with baroque dramatic lighting inspired by Caravaggio's chiaroscuro technique. A single powerful spot light from the upper left creates intense contrast — deep velvety blacks and luminous highlights. Shot on medium format at f/2.8. The image has a painterly, timeless quality with subtle warm undertones in highlights and cool blue in shadows.\n\nSubject: A magnificent Bengal tiger sitting upright in a classic portrait pose, wearing an elaborate Elizabethan ruff collar — the large pleated white lace collar from the 16th century. The tiger's head is turned three-quarters to the viewer, its amber eyes catching the key light with an intelligent, aristocratic expression. Its mouth is slightly open, revealing just the tips of the upper canines.\n\nDetails: The ruff collar is exquisitely detailed — hundreds of individual knife-pleats in cream-colored silk organza, slightly disheveled on one side. The tiger's fur shows incredible texture variation: short dense velvet-like fur on the face transitioning to longer coarser hair around the cheeks. Each whisker is individually rendered — some bent, some perfectly straight — catching light like fiber optic threads. The nose leather is a rich pink with visible moisture.\n\nBackground: Absolute darkness — a void of pure black — echoing the Dutch Master portrait tradition.", toolId: "image-generator" },
  { src: insp14, label: "Mountain library", prompt: "Style & Lighting: Dark fantasy concept art with volumetric lighting and an epic sense of scale. Lighting comes from a massive full moon breaking through storm clouds above (casting silver-blue light) and the warm amber glow of a thousand lanterns from the structure below. Atmospheric fog weaves between elements. The color palette is dominated by deep midnight blues, warm ambers, and cold silver.\n\nSubject & Composition: A colossal ancient library carved into the interior of a hollowed-out mountain. The viewer looks up from the base level through a vast cylindrical void extending hundreds of meters upward. Massive stone bookshelves spiral upward in a continuous helix, connected by ornate iron walkways, precarious wooden ladders, and arched stone bridges spanning the void.\n\nDetails: Millions of leather-bound books in burgundy, forest green, navy blue, and aged gold. Some massive tomes are chained to shelves. Wooden reading desks with green glass banker's lamps nestle into rock alcoves. A waterfall cascades down one side. Tiny robed scholars walk the spiraling pathways with lanterns. Owls perch on upper railings. Ivy and ancient roots have begun to reclaim the upper levels. At the very top, the mountain opens to moonlit sky through a rough circular opening.\n\nAtmosphere: Dust motes float in moonbeams streaming down through the opening. Each human figure is dwarfed by the architecture.", toolId: "image-generator" },
  { src: insp15, label: "Rainy café window", prompt: "Style & Lighting: Candid street photography with the gritty authentic feel of 1970s New York documentary style, reminiscent of Saul Leiter's color work. Shot through a rain-streaked window adding texture — water rivulets, condensation patches, and slight blur — between camera and scene. Muted and desaturated with selective pops of saturated color (a red umbrella, a yellow taxi). Natural ambient lighting from overcast skies. Prominent film grain.\n\nSubject & Scene: A rainy evening on a busy city street seen through the fogged-up window of a corner coffee shop. The interior is faintly reflected — a warm, amber-lit space with a partially visible espresso machine and the back of a person reading a newspaper. Through the glass: pedestrians with umbrellas crossing at various angles, reflections stretching on wet sidewalk. A yellow taxi frozen mid-splash through a puddle.\n\nDetails: The window has handwritten daily specials in white chalk marker — partially legible backward text ('LATTE $4.50'). Through the glass, a woman in a bright red coat stands out against the gray, looking at her phone under a black umbrella. A colorful flower stand — chrysanthemums in yellow and orange — adds color bursts. Traffic lights create soft diffused green and red glows in the rain. Neon 'OPEN' signs reflect in puddles.\n\nMood: Contemplative, warm-inside-cold-outside duality.", toolId: "image-generator" },
  { src: insp16, label: "Dutch vanitas still life", prompt: "Style & Lighting: Ultra-detailed photorealistic still life in the style of Dutch Golden Age vanitas paintings. Single-source warm amber candlelight quality from the upper left — rich luminous highlights and deep brown-black shadows. Dark and sumptuous palette: deep burgundies, gold, warm brown, and cream against near-black background. Focus stacking for extreme sharpness front to back.\n\nSubject & Composition: An elaborate tabletop on carved oak: a half-peeled blood orange with glistening juice, a crystal wine glass of deep ruby port, a pocket watch with exposed golden gears, antique leather-bound books with gilded edges, a human skull (memento mori) as bookend. A white candle in brass holder burns with wax dripping.\n\nDetails: Full-blown cream roses with browning petal edges, deep purple tulips, pale blue delphiniums, trailing ivy from a dark ceramic vase. A pearl necklace draped across the scene. A brass key with ornate bow near the edge. A small brown moth perched on a rose petal with eye-spot wings. Drops of port wine near the glass base catch light like tiny rubies. A half-eaten fig exposes its pink interior.\n\nBackground: Deep darkness with faintest suggestion of a cracked plaster wall.", toolId: "image-generator" },
  { src: insp17, label: "Neon cyberpunk portrait", prompt: "Style & Lighting: Cinematic cyberpunk portrait photography with heavy atmospheric effects. Drenched in neon — electric blue, hot magenta, acid green — bouncing off every wet surface. Practical lighting only — environmental neon signage and a single LED strip reflected in the subject's visor. Shot at f/1.2, creating razor-thin focus while neon background dissolves into beautiful colored bokeh circles. Heavy rain streaks across the frame, each droplet catching neon and becoming a tiny prism.\n\nSubject: A young woman with a sharp angular jawline and platinum-white buzz cut in a narrow Tokyo-style alley. She wears a transparent PVC raincoat over matte black techwear — tactical vest with multiple buckles and magnetic closures, high-collar base layer. Her eyes are hidden behind a matte black wraparound cybernetic visor reflecting the neon cityscape in perfect miniature. Small metallic dermal piercings along her right eyebrow. Rain runs down her face.\n\nDetails: The PVC raincoat is beaded with hundreds of water droplets, each refracting a different color from surrounding neon. Her tactical vest has a glowing strip of fiber-optic trim in cyan. Her lips are painted matte dark purple. Chrome metallic nail polish. A holographic sticker on her raincoat shows Japanese katakana. Vapor rises from a grate behind her.\n\nBackground: A vertical canyon of illuminated signage in Japanese — all reduced to gorgeous circular bokeh. A distant figure with an umbrella is a silhouette at the vanishing point.", toolId: "image-generator" },
  { src: insp18, label: "Milky Way salt flat", prompt: "Style & Lighting: Breathtaking astrophotography composited with landscape photography, capturing the Milky Way core arching over an otherworldly terrain. Shot during astronomical twilight on a moonless night with a tracked equatorial mount for pinpoint stars. The landscape is illuminated by faint natural airglow in subtle green-yellow gradient near the horizon, mixed with last traces of deep blue twilight. No artificial light pollution.\n\nSubject & Composition: A vast, mirror-still salt flat (similar to Salar de Uyuni) after rain, creating a perfect reflection of the entire night sky. The horizon line is placed at center, creating symmetry where the galactic core is reflected perfectly below — the illusion of standing in infinite space. A lone figure stands at the exact center with a headlamp casting a faint warm cone of light forward — the only warm tone in the cold scene.\n\nDetails: The Milky Way core rendered with extraordinary detail — visible dust lanes in dark sienna, stellar nurseries glowing in pink-magenta, dense galactic center in warm gold and orange. Individual bright stars show tiny diffraction spikes. Airglow bands in faint green stripe the horizon. The salt flat surface has subtle crystalline hexagonal patterns visible in the shallow water where the person's feet disturb the perfect reflection.\n\nAtmosphere: Absolute silence and solitude — the kind of night sky that reminds a person of their insignificance in the cosmos.", toolId: "image-generator" },
  { src: insp19, label: "Fox reading by firelight", prompt: "Style & Lighting: Whimsical children's storybook illustration — think Studio Ghibli meets Beatrix Potter. The rendering style sits between watercolor and digital painting, with visible brushstroke textures, soft edges, and warm golden light from an imagined fireplace. Colors are warm and saturated but never garish — honey gold, forest green, rust orange, cream, and periwinkle blue. Slightly low perspective as if seen from a child's eye level.\n\nSubject & Scene: A tiny fox wearing a knitted red scarf and round wire-rimmed spectacles, sitting cross-legged in a miniature armchair upholstered in green velvet, reading a comically oversized book titled 'The Art of Being Small.' The fox is inside a cozy burrow home carved into the base of a massive ancient oak tree.\n\nDetails: A braided rug on the earthen floor with geometric patterns in red and cream. A round wooden door with brass hinges stands ajar, showing a moonlit meadow outside. Miniature bookshelves carved from root formations overflow with tiny books. A copper kettle sits on a cast-iron wood stove, thin thread of steam rising. A tiny framed painting of a mouse family hangs on the curved wall. Dried herbs and lavender bundles hang from the root-beam ceiling. A half-eaten acorn and thimble-sized cup of tea sit on a tree-stump side table. The fox's bushy tail curls around the armchair's side.\n\nMood: Hygge, warmth, the deep comfort of being small and safe.", toolId: "image-generator" },
  { src: insp20, label: "Luxury levitating sneaker", prompt: "Style & Lighting: High-end sneaker product photography meets fine art still life. Dramatic top-down directional lighting from a large beauty dish directly above, creating intense highlights and deep rich shadows. Colored rim lights — electric blue (camera left) and hot pink (camera right) — create vivid color-separated edges. Matte black background and surface. Shot on medium format for exceptional sharpness.\n\nSubject: A pristine, unworn luxury sneaker (original design) rendered in exquisite detail. Minimalist silhouette with a chunky sculpted sole in translucent smoky glass-like material revealing complex internal air cushion structures. Upper crafted from hand-tumbled Italian leather in rich cream white with subtle pebble grain texture. Gold metallic accents on heel tab, eyelets, and minimalist logo deboss.\n\nDetails: The shoe is levitating about 2 inches above the reflective black surface. Tiny particles of gold dust are frozen in mid-air around the shoe, catching colored rim lights as blue or pink sparkles. The translucent sole clearly shows three air chambers with visible internal honeycomb structures. The leather surface catches overhead light revealing every pore and grain. Water mist droplets cling to the cold translucent sole.\n\nAtmosphere: Premium craftsmanship and technological innovation — a sneaker as art object, photographed like a rare jewel.", toolId: "image-generator" },
  { src: insp21, label: "Aerial salt terraces", prompt: "Style & Lighting: Aerial drone photography at extreme altitude (approximately 300 meters) capturing a vast geometric landscape pattern. Camera looks straight down in a perfect top-down perspective. Late afternoon sun creates long shadows defining three-dimensional terrain structure. The color palette is almost abstract — terracotta oranges, deep burnt sienna, jade green irrigation channels, and stark white salt deposits.\n\nSubject: Ancient salt pans of Maras, Peru — thousands of small rectangular and polygonal pools carved into a mountainside, each at a different evaporation stage and therefore a different color. The pools create a mesmerizing mosaic pattern stretching edge to edge. Narrow earthen walkways separate each pool, creating a dark grid overlay.\n\nDetails: Shadows cast by pool walls create depth and dimension. A narrow stream of turquoise mineral water snakes through the center, feeding pools in sequence. Two tiny human figures — salt workers carrying baskets — provide breathtaking scale reference. The surrounding hillside is barren brown earth with sparse green scrub.\n\nMood: The collision of ancient human ingenuity with natural geology, rendered as accidental abstract art when seen from above.", toolId: "image-generator" },
  { src: insp22, label: "Rustic Italian pappardelle", prompt: "Style & Lighting: Cinematic wide-angle food photography with dramatic moody lighting. A single overhead pendant lamp with a warm Edison bulb creates a focused pool of honey-gold light on the table, falling off rapidly into deep shadow at the edges. Steam rises from the food, backlit, creating ethereal wisps. Shot on a 35mm prime at f/2.0. Color grading is warm and rich — deep browns, amber gold, cream, and green herb touches.\n\nSubject: A rustic Italian kitchen scene — a massive hand-thrown ceramic bowl of fresh pappardelle with a rich, glossy wild boar ragù, placed on a thick slab of weathered olive wood serving board. Pasta ribbons are wide and irregular, glistening with sauce. A generous shower of freshly grated Parmigiano-Reggiano melts into the sauce. A sprig of fresh rosemary rests on top.\n\nDetails: A half-empty bottle of Chianti with a hand-applied paper label, partially peeled. A crusty sourdough bread loaf torn open revealing airy crumb structure with visible flour dust. A small terracotta dish of rich green olive oil with a floating chili flake. A wooden pepper grinder on its side. Scattered peppercorns and sea salt flakes. A linen napkin in faded terracotta red. A vintage silver fork rests against the bowl's edge. Flour dust hangs in the air.\n\nBackground: Dark, indistinct — hanging copper pots and dried herbs in shadow.", toolId: "image-generator" },
  { src: insp23, label: "Desert grand piano", prompt: "Style & Lighting: Surreal conceptual fine art photography with a dreamlike, impossible quality. Clean, slightly desaturated palette dominated by soft powder blue sky, warm sand tones, and rich crimson. Bright diffused daylight — overcast midday — creating minimal shadows and a flat graphic quality. Shot with a medium telephoto for slight compression. Calm, contemplative, quietly impossible.\n\nSubject & Composition: A towering grand piano, colored in glossy deep crimson red, stands upright in the middle of a vast empty white sand desert. The piano is in perfect condition — as if teleported there seconds ago. Its lid is propped fully open, revealing the golden harp and hammers. Sheet music sits on the stand, pages caught mid-flutter by a desert breeze. A man in a formal black tuxedo sits at the bench playing, hands a slight blur of motion.\n\nDetails: The desert stretches to the horizon with gentle rolling dunes. Wind has created fine ripple patterns in the sand around the piano's legs, which have sunk slightly into the soft surface. A thin trail of footprints leads from the left edge to the piano bench. The polished surface reflects the blue sky in distorted curves. A vulture circles high in the pale sky. A small sand devil whirls in the distant background.\n\nAtmosphere: The profound absurdity of finding the most civilized of instruments in the most uncivilized of landscapes.", toolId: "image-generator" },
  { src: insp24, label: "Abandoned mech colossus", prompt: "Style & Lighting: Hyper-detailed digital concept art with AAA video game cinematic quality. Dramatically backlit by a massive setting sun in deep amber and blood red. Foreground in deep shadow with only rim-lighting defining silhouettes. Volumetric dust and smoke fill the atmosphere with visible god-rays streaming between structures. Palette: warm blacks, deep amber, molten gold, dark steel gray.\n\nSubject: A colossal post-apocalyptic mech (approximately 200 feet tall) standing half-submerged in shallow water in a ruined city. The mech is ancient, powered down for centuries — covered in rust, verdigris corrosion, and climbing ivy. Birds have nested in its open chest cavity. One massive arm has collapsed and lies half-buried in water. The head tilts slightly downward with dark visor eyes giving a melancholic expression.\n\nDetails: The shallow water reflects the sunset and rusted silhouette. Ruined skyscrapers (stripped to steel skeletons) frame the scene. A small wooden fishing boat with a single person rowing passes between the mech's legs — devastating scale contrast. Moss and small trees grow from shoulder joints. A flock of starlings creates a murmuration around the head. The water surface has thin oil film creating iridescent rainbow patterns near the mech's feet.\n\nMood: The awe of standing before a monument to a forgotten war, nature slowly reclaiming what humans abandoned.", toolId: "image-generator" },
  { src: insp25, label: "Persian cat on pink velvet", prompt: "Style & Lighting: Intimate boudoir-style pet photography with high-fashion editorial quality. Beauty dish with diffusion — soft, flattering, wrapping around the subject. Key light from camera left with fill reflector on right. Color palette deliberately limited to warm neutrals — cream, blush pink, champagne gold, soft gray. Shot on 85mm portrait lens at f/2.0.\n\nSubject: A ridiculously pampered long-haired Persian cat with cloud-white fur, lying regally on a blush pink velvet chaise lounge. The cat wears a delicate rose gold charm necklace with a tiny diamond-shaped pendant. Its enormous copper-colored eyes stare directly into the camera with absolute superiority and bored elegance. One paw extended casually over the chaise edge.\n\nDetails: The cat's fur is immaculately groomed — each strand catching light differently, creating a halo effect. The Persian's distinctive flat face with button nose and tiny downturned mouth. Whiskers fan out symmetrically as fine silver threads. The blush pink velvet shows visible crush patterns. Scattered rose petals in dusty pink on the fabric. A crystal champagne coupe filled with cream sits on a small gold side table. A pearl-handled grooming brush lies nearby.\n\nBackground: Soft out-of-focus blush pink fabric draped in gentle folds. Faint gold bokeh dots suggest fairy lights.", toolId: "image-generator" },
  { src: insp26, label: "Fjord cabin interior", prompt: "Style & Lighting: Hyperreal architectural visualization with clean ultra-modern Scandinavian aesthetic. Soft even diffused daylight from a massive floor-to-ceiling window wall occupying the entire right side. Outside, a misty Nordic pine forest is barely visible. Interior light is cool blue-gray from overcast sky, supplemented by a warm brass pendant lamp emitting honey-gold light over a dining area. Shot with an architectural tilt-shift lens for perfectly corrected verticals.\n\nSubject: A stunning open-concept living space in a contemporary cabin perched on a fjord cliff edge. Minimalist luxury — raw concrete walls polished to silk finish, white oak wide-plank floors, massive exposed laminated timber beams. A sunken conversation pit lined with deep charcoal wool boucle cushions. A suspended circular fireplace (black matte steel) hovers above center.\n\nDetails: A large abstract painting in muted earth tones and sage green on the concrete wall. A sheepskin throw over one arm. A low walnut coffee table with a ceramic vase of dried eucalyptus and architecture books. The window wall frames a breathtaking view: misty fjord waters far below, green-black pine forest on steep gray cliffs, low clouds threading between peaks. Rain droplets on exterior glass. A reading nook in a window alcove with cashmere blanket. A black Labrador retriever sleeps on a round woven floor cushion near the fireplace.\n\nAtmosphere: Profound serenity, the luxury of simplicity and spectacular nature.", toolId: "image-generator" },
  { src: insp27, label: "Strawberry chocolate splash", prompt: "Style & Lighting: High-speed flash photography frozen at 1/10000th of a second. Single speedlight with small grid creating a dramatic spotlight against absolute darkness. Every droplet and particle in perfect sharpness. High-contrast, high-saturation look with deep blacks and vivid colors. Shot on a macro-capable lens.\n\nSubject: The exact moment a ripe strawberry impacts the surface of a pool of rich dark melted chocolate. The strawberry is captured at the instant of penetration — its upper half still visible, while a symmetrical crown-shaped splash of glossy chocolate erupts around it. Individual chocolate droplets are frozen mid-air in various sizes — tear-shaped drops to tiny spherical mist — each reflecting the flash as a bright white highlight point.\n\nDetails: The strawberry's bumpy texture with tiny yellow seeds individually visible. Water droplets cling to the berry's red skin, creating tiny marbled patterns where water meets cocoa. The chocolate is thick, viscous, intense 70% cacao with visible sheen. The splash crown has six distinct arms tapering to thin tendrils. A few bright red strawberry flesh fragments are suspended in the air alongside the chocolate droplets.\n\nBackground: Pure black void — all attention focused on the physics of impact.", toolId: "image-generator" },
  { src: insp28, label: "Stone titan awakening", prompt: "Style & Lighting: Epic fantasy digital painting with film poster production quality. Vertical towering composition emphasizing massive scale. Cold moonlight from above, warm firelight from below, and eerie green-cyan bioluminescence from the subject itself. Heavy atmospheric perspective with layers of mist creating depth. Palette: deep forest greens, midnight blacks, warm amber, silver-white highlights.\n\nSubject: An ancient titan — a colossus made of living stone and ancient tree roots — slowly standing up from a mountain it has been sleeping inside for millennia. The mountain's surface cracks and splits as the titan rises, sending avalanches of rock cascading down its emerging shoulders. Its body is a fusion of geological and botanical: massive granite slabs form its torso, bound together by enormous tree roots thick as river cables that serve as tendons and muscles. Hollow eye sockets glow with cyan-green bioluminescent energy. A fully grown ancient oak tree grows from its right shoulder.\n\nDetails: The titan's emerging hand is the size of a football field. Waterfalls cascade from crevices in its body. Birds erupt from the breaking mountainside. At its feet, a medieval village with thatched roofs and a stone church provides devastating scale. Villagers with torches look up in terror. Moss and small bushes cover its body from centuries of dormancy. Glowing cyan veins pulse through cracks in stone skin.\n\nSky: Roiling storm clouds part directly above the titan's head, with a single shaft of moonlight illuminating its face.", toolId: "image-generator" },
  { src: insp29, label: "Luxury EDC flat lay", prompt: "Style & Lighting: Luxurious flat-lay product photography with monochromatic scheme and extreme geometric precision. Camera positioned directly overhead (90-degree angle). Broad, soft, even lighting from a massive overhead softbox minimizing shadows while defining edges. Color palette strictly limited to matte black, brushed gold, and crisp white. Every element placed with obsessive precision following golden ratio proportions.\n\nSubject: A curated collection of luxury gentleman's everyday carry on a matte black leather surface with subtle pebble grain. Items: a mechanical Swiss watch with midnight blue dial and gold indices (leather strap artfully curled), gold-rimmed aviator sunglasses folded closed, matte black smartphone face down, slim black leather cardholder slightly open revealing three cards, a fountain pen in black lacquer with gold trim (cap removed), a black moleskine with gold-embossed monogram, car keys with matte black fob and gold keyring, a small ceramic espresso cup with perfect golden crema, AirPods case in matte black.\n\nDetails: Each item casts minimal soft shadow. The watch shows 10:10. The cardholder shows the edge of a black Amex card. The fountain pen's gold nib catches a bright specular highlight. The espresso crema has a perfect rosetta swirl. A single white gardenia flower, perfectly centered, adds organic softness.\n\nComposition: Items arranged in a loose diagonal grid with careful negative space creating rhythm.", toolId: "image-generator" },
  { src: insp30, label: "Underwater Roman arch", prompt: "Style & Lighting: Ethereal underwater fine art photography with a dreamlike, painterly quality. Crystal-clear tropical water with extraordinary visibility. Natural sunlight creates dramatic crepuscular rays — shafts of white-gold light fanning out from the surface. The water shifts from warm turquoise near surface to deeper teal and eventually indigo in the depths. The mood is serene, otherworldly, and spiritual.\n\nSubject: A massive ancient stone archway (reminiscent of Roman ruins) standing perfectly intact on a white sand ocean floor at approximately 40 feet depth. The archway is colonized by vibrant coral — brain coral in mustard yellow, staghorn coral in pale lavender, fan coral in electric orange. Through the arch, a massive school of silver barracuda forms a tornado-like spiral (bait ball), their bodies catching sunlight and creating a dazzling shimmering vortex.\n\nDetails: The stone archway shows carved Roman-style acanthus leaf capitals, worn smooth by centuries but still recognizable. Sea anemones in fluorescent pink cluster in carved crevices. A large green sea turtle swims through the arch. The white sand floor is dotted with partially buried amphora. A lone lionfish hovers near the base with striped fins fanned dramatically. A diver observes from a respectful distance.\n\nAtmosphere: Cathedral-like scale combined with the living light show creates a sense of sacred underwater temple.", toolId: "image-generator" },
  { src: insp31, label: "Parisian grande dame", prompt: "Style & Lighting: Moody atmospheric portrait photography with vintage analog quality — mimicking medium format Kodak Tri-X 400 pushed to 1600 ISO black and white, then selectively hand-colored (early 20th century photochrom technique). Primarily monochrome with selective color: only warm golden-amber tones and deep crimson reds rendered in color. Single window casting soft directional Vermeer-like light. Heavy film grain throughout.\n\nSubject: An elderly woman (approximately 85 years old) sitting in a worn leather armchair in a grand but faded Parisian apartment. She's dressed impeccably — black silk blouse with pearl buttons, silver-white hair pinned in an elegant chignon with a tortoiseshell comb. She holds a cigarette in a long ivory holder, thin trail of smoke rising in a lazy spiral. Her expression is amused defiance — a slight smirk, one eyebrow raised, eyes sharp behind round gold-rimmed spectacles.\n\nDetails: The apartment tells a lifetime of stories: a grand marble fireplace mantel holds framed photographs (in black and white within the black and white image — a meta-photographic effect). Heavy velvet curtains frame the window. Bookshelves stuffed to overflowing. A half-empty bottle of Bordeaux and crystal glass with crimson residue sit on a side table (wine rendered in selective red color). A large impressionist oil painting hangs behind her. The leather armchair shows decades of beautiful patina — worn and cracked where her arms have rested thousands of times.\n\nAtmosphere: The quiet power and dignity of a life fully lived — someone who has outlasted all her contemporaries.", toolId: "image-generator" },
];

const VIDEO_ITEMS: GalleryItem[] = [
  { src: vid1Thumb, videoUrl: vid1Video.url, label: "Space battle cockpit", prompt: "A cinematic scene of a futuristic spaceship cockpit with a pilot looking out at a nebula, sci-fi movie still, dramatic lighting, widescreen anamorphic look", toolId: "text-to-video" },
  { src: vid18Thumb, videoUrl: vid18Video.url, label: "Lavender golden hour", prompt: "A beautiful woman walking through a field of lavender at golden hour, her white dress flowing in the wind, cinematic slow motion", toolId: "text-to-video" },
  { src: vid8Thumb, videoUrl: vid8Video.url, label: "Bioluminescent whale", prompt: "A massive bioluminescent whale breaching from dark ocean at night near an industrial shipyard, neon teal veins glowing, cinematic VFX shot, rain and lightning", toolId: "text-to-video" },
  { src: vid19Thumb, videoUrl: vid19Video.url, label: "Cinematic explosion", prompt: "A massive explosion in slow motion with debris and fire, action movie VFX shot, dark background, dramatic lighting", toolId: "text-to-video" },
  { src: vid2Thumb, videoUrl: vid2Video.url, label: "Robot encounter", prompt: "Action movie scene, group of people standing in a futuristic white room with a small pink robot, cinematic wide shot, sci-fi thriller atmosphere", toolId: "text-to-video" },
  { src: vid20Thumb, videoUrl: vid20Video.url, label: "Epic wave surfing", prompt: "Aerial cinematic shot of a lone surfer riding a massive wave, drone footage, crystal blue ocean, epic nature documentary", toolId: "text-to-video" },
  { src: vid9Thumb, videoUrl: vid9Video.url, label: "Night car chase", prompt: "Fast-paced car chase through narrow European streets at night, sparks flying, motion blur, adrenaline action movie still, widescreen cinematic", toolId: "text-to-video" },
  { src: vid21Thumb, videoUrl: vid21Video.url, label: "Royal cat", prompt: "A cat sitting regally on a velvet throne wearing a tiny crown, funny pet video, soft studio lighting, royal aesthetic", toolId: "text-to-video" },
  { src: vid3Thumb, videoUrl: vid3Video.url, label: "Arctic expedition", prompt: "Snowy mountain landscape with a lone figure running through deep snow, avalanche in background, cinematic action shot, dramatic scale, epic movie scene", toolId: "text-to-video" },
  { src: vid22Thumb, videoUrl: vid22Video.url, label: "Molten gold pour", prompt: "Pouring molten gold into an ornate mold, satisfying close-up shot, sparks and glow, luxury craftsmanship, cinematic slow motion", toolId: "text-to-video" },
  { src: vid10Thumb, videoUrl: vid10Video.url, label: "Astronaut in space", prompt: "Astronaut floating in space with Earth reflected in helmet visor, stars and nebula behind, ultra realistic, IMAX movie still quality", toolId: "text-to-video" },
  { src: vid23Thumb, videoUrl: vid23Video.url, label: "City rising", prompt: "A hyperlapse of a futuristic city being built from the ground up, construction timelapse, dramatic clouds rolling, epic scale", toolId: "text-to-video" },
  { src: vid4Thumb, videoUrl: vid4Video.url, label: "Cyberpunk transit", prompt: "Neon-lit cyberpunk bus driving through a rainy night city, reflections on wet asphalt, dystopian atmosphere, cinematic color grading, movie still", toolId: "text-to-video" },
  { src: vid24Thumb, videoUrl: vid24Video.url, label: "Warehouse dancer", prompt: "A dancer performing contemporary ballet in an abandoned warehouse, dramatic shaft of light from window, dust particles floating, emotional cinematic", toolId: "text-to-video" },
  { src: vid11Thumb, videoUrl: vid11Video.url, label: "Gladiator arena", prompt: "Ancient Roman gladiator arena with thousands of spectators, dramatic overhead view, dust and sand, epic historical movie scene, golden hour lighting", toolId: "text-to-video" },
  { src: vid25Thumb, videoUrl: vid25Video.url, label: "Luxury watch macro", prompt: "Close-up of a luxury mechanical watch with exposed gears ticking, macro product video, dark background, dramatic lighting reflecting off metal", toolId: "text-to-video" },
  { src: vid5Thumb, videoUrl: vid5Video.url, label: "Retro phone booth", prompt: "Close up of a retro neon phone booth at night with people inside, 80s vibe, rain, colorful reflections, cinematic street photography", toolId: "text-to-video" },
  { src: vid26Thumb, videoUrl: vid26Video.url, label: "Ice cave drone", prompt: "A drone flying through a massive ice cave with blue glowing walls, adventure exploration footage, breathtaking natural wonder", toolId: "text-to-video" },
  { src: vid12Thumb, videoUrl: vid12Video.url, label: "Haute couture runway", prompt: "Luxury fashion runway show with dramatic spotlights, model walking in avant-garde haute couture, smoke machine, dark elegant atmosphere, fashion week", toolId: "text-to-video" },
  { src: vid27Thumb, videoUrl: vid27Video.url, label: "Paris saxophone rain", prompt: "A street musician playing saxophone on a rainy Paris bridge at night, neon reflections in puddles, moody cinematic atmosphere, slow motion raindrops", toolId: "text-to-video" },
  { src: vid13Thumb, videoUrl: vid13Video.url, label: "Wolf under aurora", prompt: "A wolf howling on a cliff edge under northern lights aurora borealis, snow falling, dramatic wildlife cinematography, epic nature documentary", toolId: "text-to-video" },
  { src: vid14Thumb, videoUrl: vid14Video.url, label: "Medieval siege", prompt: "Massive medieval castle siege with catapults firing and fire arrows in the night sky, epic battle scene, Lord of the Rings style cinematography", toolId: "text-to-video" },
  { src: vid6Thumb, videoUrl: vid6Video.url, label: "Floating tech", prompt: "Sleek white laptop floating in a minimalist white void with dramatic shadow, product photography, ultra clean, futuristic tech shot", toolId: "text-to-video" },
  { src: vid15Thumb, videoUrl: vid15Video.url, label: "Underwater ruins", prompt: "Underwater city ruins with ancient Greek columns covered in coral and schools of colorful fish, volumetric light rays, cinematic deep sea exploration", toolId: "text-to-video" },
  { src: vid7Thumb, videoUrl: vid7Video.url, label: "Glamorous event", prompt: "Two elegant women at a glamorous event in pink tulle dresses, luxury hotel lobby, golden lighting, editorial fashion photography", toolId: "text-to-video" },
  { src: vid16Thumb, videoUrl: vid16Video.url, label: "Michelin star plating", prompt: "Professional chef plating an exquisite dish with tweezers, steam rising, close-up food photography, Michelin star kitchen, dramatic lighting", toolId: "text-to-video" },
  { src: vid17Thumb, videoUrl: vid17Video.url, label: "Shibuya crossing", prompt: "Time-lapse style photo of a bustling Tokyo Shibuya crossing at night, thousands of people with motion trails, long exposure, city energy, cinematic", toolId: "text-to-video" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Video Card with hover-to-play ── */
function VideoCard({
  item,
  onSelect,
}: {
  item: GalleryItem;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current && item.videoUrl) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [item.videoUrl]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-[14px] bg-[#111] cursor-pointer w-full text-left"
    >
      <img
        src={item.src}
        alt={item.label}
        loading="lazy"
        className={cn(
          "w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]",
          isPlaying && "invisible"
        )}
      />
      {item.videoUrl && (
        <video
          ref={videoRef}
          src={item.videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            isPlaying ? "visible" : "invisible"
          )}
        />
      )}
      <div
        className={cn(
          "absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/[0.12] transition-opacity duration-300",
          isPlaying ? "opacity-0" : "opacity-100"
        )}
      >
        <Play className="h-3 w-3 text-white fill-white" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <p className="text-[11px] text-white/80 font-medium leading-snug">{item.label}</p>
      </div>
      <div className="absolute inset-0 rounded-[14px] border border-white/[0.04] transition-all duration-300 group-hover:border-[#3b82f6]/40 group-hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.25)]" />
    </button>
  );
}

/* ── Preview Modal ── */
function PreviewModal({
  item,
  tab,
  onClose,
  onUse,
}: {
  item: GalleryItem;
  tab: Tab;
  onClose: () => void;
  onUse: () => void;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(item.prompt);
    toast.success("Prompt copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[680px] max-h-[90vh] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0c0c0f] shadow-2xl flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.1] text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex-shrink-0">
          {tab === "video" && item.videoUrl ? (
            <video src={item.videoUrl} autoPlay muted loop playsInline className="w-full max-h-[400px] object-cover" />
          ) : (
            <img src={item.src} alt={item.label} className="w-full max-h-[400px] object-cover" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0c0c0f] to-transparent" />
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
              {tab === "image" ? "Image" : "Video"} Prompt
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{item.label}</h3>
          </div>

          <div className="relative rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
            <p className="text-[13px] text-white/70 leading-relaxed pr-8">{item.prompt}</p>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              title="Copy prompt"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onUse}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Use This Prompt
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Gallery ── */
export function InspirationsGallery() {
  const [tab, setTab] = useState<Tab>("image");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const navigate = useNavigate();
  const items = tab === "image" ? IMAGE_ITEMS : VIDEO_ITEMS;

  const handleUse = (item: GalleryItem) => {
    setSelected(null);
    navigate(`/studio/${item.toolId}`, {
      replace: true,
      state: { prefillPrompt: item.prompt },
    });
  };

  return (
    <motion.section variants={fadeUp} className="mb-14">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
          Inspirations
        </h2>
        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
          <button
            onClick={() => setTab("image")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === "image" ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white/70"
            )}
          >
            <Image className="h-3.5 w-3.5" /> Image
          </button>
          <button
            onClick={() => setTab("video")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === "video" ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white/70"
            )}
          >
            <Video className="h-3.5 w-3.5" /> Video
          </button>
        </div>
      </div>

      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
        {items.map((item, i) => (
          <motion.div
            key={`${tab}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.5) }}
            className="mb-3 break-inside-avoid"
          >
            {tab === "video" ? (
              <VideoCard item={item} onSelect={() => setSelected(item)} />
            ) : (
              <button
                onClick={() => setSelected(item)}
                className="group relative overflow-hidden rounded-[14px] bg-[#111] cursor-pointer w-full text-left"
              >
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-[11px] text-white/80 font-medium leading-snug">{item.label}</p>
                </div>
                <div className="absolute inset-0 rounded-[14px] border border-white/[0.04] transition-all duration-300 group-hover:border-[#3b82f6]/40 group-hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.25)]" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <PreviewModal
            item={selected}
            tab={tab}
            onClose={() => setSelected(null)}
            onUse={() => handleUse(selected)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
