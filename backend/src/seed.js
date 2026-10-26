const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Product = require('./models/Product');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'glamora';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define products catalog with descriptions, bullet points, categories, and prices
const catalog = [
  // ── WATCHES ─────────────────────────────────────────────────────────────
  {
    sourceFile: 'product-1786783488579.webp',
    cleanName: 'Silver_Vintage_Diamond_Bezel_Rectangular_Watch.webp',
    name: 'Silver Vintage Diamond Bezel Rectangular Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 85,
    discountPrice: 65,
    stock: 18,
    isDeal: true,
    isLatest: true,
    isFeatured: true,
    dealEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: `A timeless rectangular dial timepiece accented with a diamond-studded bezel and polished stainless steel link bracelet. Designed for sophisticated everyday wear and special occasions.

Key Features:
• Elegant rectangular face with crystal-embellished bezel
• Precision Japanese quartz movement for reliable timekeeping
• Polished stainless steel multi-link bracelet with secure deployment clasp
• Scratch-resistant mineral crystal glass
• Water-resistant for daily splash protection`,
  },
  {
    sourceFile: 'product-1786784018363.jpg',
    cleanName: 'Classic_Gold_Octagonal_Quartz_Watch.jpg',
    name: 'Classic Gold Octagonal Quartz Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 95,
    discountPrice: 0,
    stock: 15,
    isDeal: false,
    isLatest: true,
    isFeatured: true,
    description: `A stunning architectural octagonal watch forged in luminous 18K gold-plated stainless steel with a sleek silver sunray dial.

Key Features:
• Distinctive geometric octagonal case with beveled edges
• 18K yellow gold ion plating with high-polish gloss finish
• Accurate quartz mechanism with minimalist gold baton indices
• Breathable engineered jubilee-style steel bracelet
• Sleek profile tailored for modern luxury styling`,
  },
  {
    sourceFile: 'product-1786785247877.jpg',
    cleanName: 'Silver_Black_Enamel_Crystal_Bangle_Watch.jpg',
    name: 'Silver Black Enamel Crystal Bangle Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 75,
    discountPrice: 55,
    stock: 20,
    isDeal: true,
    isLatest: true,
    dealEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    description: `A delicate jewelry watch blending polished black enamel curves with pavé crystal accents around a deep ebony dial.

Key Features:
• Artistic wave-link bracelet combining jet-black enamel and pavé stones
• Deep black dial with clear Arabic numerals and luminous hands
• Jewelry clasp closure offering a seamless bangle silhouette
• Lightweight and hypoallergenic construction
• Perfect fusion of fine jewelry craftsmanship and functional timepiece`,
  },
  {
    sourceFile: 'product-1787476934461.jpg',
    cleanName: 'Vintage_Golden_Emerald_Cut_Dial_Watch.jpg',
    name: 'Vintage Golden Emerald-Cut Dial Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 90,
    discountPrice: 0,
    stock: 14,
    isDeal: false,
    isLatest: true,
    description: `Exuding Parisian mid-century elegance, this watch showcases an emerald-cut beveled bezel enclosing a radiant silver dial with Roman numerals.

Key Features:
• Emerald-cut beveled golden case with vintage Roman numeral markers
• Multi-row polished gold link bracelet for supreme wrist contouring
• Hardened scratch-resistant sapphire-coated glass
• Reliable analog movement with minimal power consumption
• Complements both professional attire and evening jewelry`,
  },
  {
    sourceFile: 'product-1787484713554.webp',
    cleanName: 'Emerald_Green_Dial_Gold_Bracelet_Watch.webp',
    name: 'Emerald Green Dial Gold Bracelet Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 110,
    discountPrice: 85,
    stock: 12,
    isDeal: true,
    isLatest: true,
    isFeatured: true,
    dealEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    description: `A vibrant sunburst emerald green dial housed inside a luxury brushed gold case with diamond hour indices and a solid link bracelet.

Key Features:
• Rich emerald green sunray dial reflecting shifting ambient light
• Faceted diamond-style hour markers with gold-tone leaf hands
• Solid stainless steel links with rich satin and mirror finishes
• Ergonomic double-locking butterfly clasp
• Designed as a bold luxury fashion statement`,
  },
  {
    sourceFile: 'product-1786783565064.webp',
    cleanName: 'Luxury_Pearl_Strand_Bezel_Watch.webp',
    name: 'Luxury Pearl Strand Bezel Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 80,
    discountPrice: 0,
    stock: 16,
    isDeal: false,
    isLatest: false,
    description: `A breathtaking feminine timepiece crafted with a double strand of luminous freshwater-style pearls and a shimmering crystal-encrusted case.

Key Features:
• Double-strand simulated pearl bracelet woven with sparkling crystal rondelles
• Emerald-shaped silver watch face studded with crystal pavé
• Elegant mother-of-pearl inspired dial with diamond indices
• Stretch-resistant jewelry wiring for comfortable fit
• The ultimate accessory for weddings, galas, and festive celebrations`,
  },
  {
    sourceFile: 'product-1787477398601.jpg',
    cleanName: 'Starry_Night_Magnetic_Mesh_Strap_Watch.jpg',
    name: 'Starry Night Magnetic Mesh Strap Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 60,
    discountPrice: 45,
    stock: 25,
    isDeal: true,
    isLatest: true,
    dealEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    description: `A mesmerizing celestial timepiece featuring a glittering starry-sky black dial enclosed in a faceted diamond-cut glass bezel.

Key Features:
• Shimmering starry sky dial that catches light with celestial glitter
• Diamond-faceted crystal glass providing multidimensional brilliance
• Milanese magnetic mesh strap that adjusts instantly to any wrist size
• Sleek matte black ion plating resistant to everyday wear
• Lightweight, breathable, and effortlessly stylish`,
  },
  {
    sourceFile: 'product-1787477139715.webp',
    cleanName: 'Golden_Minimalist_Geometric_Dial_Watch.webp',
    name: 'Golden Minimalist Geometric Dial Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 88,
    discountPrice: 0,
    stock: 15,
    isDeal: false,
    isLatest: false,
    description: `A sleek gold watch with an elongated octagon dial, crisp white face, and minimalist baton markers for understated luxury.

Key Features:
• Geometric angular case with mirror-polished gold finish
• Clean white face with slender gold hands and index markers
• Smooth brushed oyster-style steel bracelet
• Push-button deployment clasp for effortless wear
• Minimalist, versatile aesthetic suited for any wardrobe`,
  },
  {
    sourceFile: 'product-1787478765356.webp',
    cleanName: 'Rose_Gold_Ruby_Sunburst_Dial_Watch.webp',
    name: 'Rose Gold Ruby Sunburst Dial Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 78,
    discountPrice: 58,
    stock: 19,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    description: `Featuring an eye-catching ruby magenta sunburst dial crowned with diamond indices, set within a warm rose gold-plated casing.

Key Features:
• Vibrant ruby red sunburst dial paired with warm rose gold plating
• Clustered crystal diamond hour accents for radiant sparkle
• Classic round bezel with polished three-link bracelet
• Scratch-resistant hardened mineral crystal
• Adds a pop of luxury color to your wrist stack`,
  },
  {
    sourceFile: 'product-1787478796016.png',
    cleanName: 'Two_Tone_Gold_and_Steel_Octagonal_Watch.png',
    name: 'Two-Tone Gold & Steel Octagonal Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 92,
    discountPrice: 0,
    stock: 17,
    isDeal: false,
    isLatest: false,
    description: `An executive two-tone masterpiece featuring an octagonal black-and-gold bezel, ribbed textured dial, and integrated date display.

Key Features:
• Striking two-tone combination of polished gold and stainless steel
• Texturized linear dial with practical 3 o'clock date window
• Distinctive black ceramic-accented octagonal bezel
• High-grade quartz movement engineered for long-term precision
• Premium luxury feel designed for daily executive styling`,
  },
  {
    sourceFile: 'product-1787478919621.jpg',
    cleanName: 'Obsidian_Hexagon_Leather_Strap_Watch.jpg',
    name: 'Obsidian Hexagon Leather Strap Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 65,
    discountPrice: 48,
    stock: 22,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    description: `A bold contemporary timepiece featuring a faceted obsidian crystal bezel, minimalist black dial, and embossed genuine leather strap.

Key Features:
• Architectural hexagonal black crystal with sharp beveled facets
• Ultra-clean dial with rose gold minimalist hands
• Supple black crocodile-embossed genuine leather strap
• Crystal-accented lugs adding subtle brilliance
• Perfect statement piece for modern, monochromatic aesthetics`,
  },
  {
    sourceFile: 'product-1787479017168.webp',
    cleanName: 'His_and_Hers_Dual_Tone_Pair_Watch.webp',
    name: 'His & Hers Luxury Dual-Tone Pair Watch',
    category: 'watches',
    brand: 'Glamora',
    price: 140,
    discountPrice: 110,
    stock: 10,
    isDeal: true,
    isLatest: true,
    isFeatured: true,
    dealEndsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    description: `An exquisite matching couple watch set crafted in silver and gold dual-tone steel with sunburst slate grey dials and date windows.

Key Features:
• Includes coordinated men's and women's luxury timepieces
• Slate grey sunray dials with gold baton indices and calendar display
• Five-link jubilee stainless steel bracelets with folding clasps
• Japanese quartz precision movements inside both watches
• The quintessential gift for weddings, anniversaries, and engagements`,
  },

  // ── RINGS ────────────────────────────────────────────────────────────────
  {
    sourceFile: 'product-1786620715470.jpg',
    cleanName: 'Multi_Layer_Crossover_Baguette_Diamond_Ring.jpg',
    name: 'Multi-Layer Crossover Baguette Diamond Ring',
    category: 'rings',
    brand: 'Glamora',
    price: 65,
    discountPrice: 0,
    stock: 20,
    isDeal: false,
    isLatest: true,
    isFeatured: true,
    description: `A dramatic multi-tier crossover statement ring embellished with a center row of emerald baguette stones framed by micro-pavé halos.

Key Features:
• Wide stacked multi-band design with intertwined crossover silhouette
• Channel-set rectangular baguette crystals with surrounding micro-pavé
• High-luster rhodium-plated sterling silver finish
• Smooth inner band contour for comfortable all-day wear
• Impressive brilliance that shines from every angle`,
  },
  {
    sourceFile: 'product-1786779969522.jpg',
    cleanName: 'Split_Shank_Pave_Halo_Engagement_Ring.jpg',
    name: 'Split Shank Pavé Halo Diamond Engagement Ring',
    category: 'rings',
    brand: 'Glamora',
    price: 75,
    discountPrice: 55,
    stock: 18,
    isDeal: true,
    isLatest: true,
    dealEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: `A romantic engagement ring showcasing a brilliant round cluster center encircled by a halo, flanked by a graceful split-shank pavé band.

Key Features:
• Multi-stone cluster center with the visual impact of a large solitaire
• Delicate split shank lined with sparkling pavé cubic zirconia
• Solid 925 sterling silver construction with anti-tarnish rhodium barrier
• Comfort-fit tapered band ensures exceptional everyday wearability
• Timeless bridal elegance at an accessible luxury price point`,
  },
  {
    sourceFile: 'product-1786780085906.avif',
    cleanName: 'Criss_Cross_Pave_Solitaire_Crystal_Ring.avif',
    name: 'Criss-Cross Pavé Solitaire Crystal Ring',
    category: 'rings',
    brand: 'Glamora',
    price: 70,
    discountPrice: 0,
    stock: 22,
    isDeal: false,
    isLatest: true,
    description: `Featuring a commanding 2-carat look brilliant-cut round solitaire elevated above a sweeping criss-cross pavé ribbon band.

Key Features:
• Eye-catching 4-prong set brilliant-cut center stone
• Crossover entwined shank encrusted with precision pavé stones
• Polished platinum-finish alloy for enduring shine
• High refraction cut mimicking authentic diamond radiance
• Beautiful worn standalone or paired with stacking bands`,
  },
  {
    sourceFile: 'product-1787478288781.png',
    cleanName: 'Classic_6_Prong_Solitaire_Diamond_Ring.png',
    name: 'Classic 6-Prong Solitaire Diamond Ring',
    category: 'rings',
    brand: 'Glamora',
    price: 85,
    discountPrice: 65,
    stock: 15,
    isDeal: true,
    isLatest: true,
    isFeatured: true,
    dealEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    description: `The gold standard of engagement rings: an iconic 6-prong crown securing a radiant solitaire stone with pavé-accented knife-edge shoulders.

Key Features:
• Signature 6-prong high-profile setting maximizes light intake
• Premium AAA cubic zirconia cut to ideal round brilliant proportions
• Pavé-set shoulder stones adding depth and sparkle to the band
• Hypoallergenic, nickel-free silver with bright mirror polish
• Comes in a signature Glamora velvet keepsake presentation box`,
  },
  {
    sourceFile: 'product-1787478404119.jpg',
    cleanName: 'Floral_Cluster_Diamond_Solitaire_Ring.jpg',
    name: 'Floral Cluster Diamond Solitaire Ring',
    category: 'rings',
    brand: 'Glamora',
    price: 68,
    discountPrice: 0,
    stock: 20,
    isDeal: false,
    isLatest: false,
    description: `An enchanting blossom design featuring a round center stone surrounded by eight petal-like diamonds atop a delicate pavé band.

Key Features:
• Floral-inspired halo cluster creating a romantic bouquet silhouette
• Sparkling micro-pavé accents extending halfway down the shank
• 925 sterling silver plated with lustrous rhodium
• Smooth snag-free claw settings protecting delicate fabrics
• Wonderful anniversary or promise ring gift`,
  },
  {
    sourceFile: 'product-1786780607363.jpg',
    cleanName: 'Baguette_Cluster_Platinum_Band_Ring.jpg',
    name: 'Baguette Cluster Platinum Band Ring',
    category: 'rings',
    brand: 'Glamora',
    price: 58,
    discountPrice: 42,
    stock: 24,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    description: `A modern minimalist band crowned with a cluster of graduated baguette-cut and round crystals in a staggered tiara arrangement.

Key Features:
• Contemporary tiara motif with alternating baguette and round stones
• Slender, tapered band engineered for effortless stacking
• Solid platinum-finish sterling silver with smooth rounded edges
• Clean modern aesthetic that pairs seamlessly with classic bands
• Lightweight comfort designed for active everyday wear`,
  },

  // ── GLASSES ──────────────────────────────────────────────────────────────
  {
    sourceFile: 'product-1786781021116.webp',
    cleanName: 'Midnight_Glam_Cat_Eye_Sunglasses.webp',
    name: 'Midnight Glam Cat-Eye Sunglasses',
    category: 'glasses',
    brand: 'Glamora',
    price: 45,
    discountPrice: 32,
    stock: 30,
    isDeal: true,
    isLatest: true,
    isFeatured: true,
    dealEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    description: `Sophisticated oversized cat-eye sunglasses featuring gloss-black acetate frames, gold temple bar accents, and smoke-tint lenses.

Key Features:
• Flattering winged cat-eye silhouette that complements all face shapes
• UV400 polarized lenses blocking 100% of UVA and UVB radiation
• Gold-tone metal temple inserts for high-end luxury appeal
• Reinforced five-barrel metal hinges for long-lasting durability
• Includes protective hard case and microfiber cleaning cloth`,
  },
  {
    sourceFile: 'product-1786781084450.jpg',
    cleanName: 'Rose_Gold_Hexagonal_Gradient_Sunglasses.jpg',
    name: 'Rose Gold Hexagonal Gradient Sunglasses',
    category: 'glasses',
    brand: 'Glamora',
    price: 48,
    discountPrice: 0,
    stock: 26,
    isDeal: false,
    isLatest: true,
    description: `Chic geometric sunglasses showcasing a rose gold wire frame, sparkling textured outer rims, and soothing gradient violet lenses.

Key Features:
• Modern hexagonal silhouette with fine jewelry-inspired wire detailing
• Gradient purple-to-pink tint lenses providing crystal-clear vision
• Soft adjustable silicone nose pads for a custom non-slip fit
• Lightweight alloy frame ensuring zero pressure during extended wear
• Full UV400 sun protection for bright outdoor days`,
  },
  {
    sourceFile: 'product-1787479233360.jpg',
    cleanName: 'Geometric_Hexagonal_Wire_Frame_Sunglasses.jpg',
    name: 'Geometric Hexagonal Wire-Frame Sunglasses',
    category: 'glasses',
    brand: 'Glamora',
    price: 42,
    discountPrice: 29,
    stock: 28,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    description: `Retro-inspired round-hexagonal sunglasses crafted with an ultra-light gold metal frame and dark graphite polarized lenses.

Key Features:
• Subtle hexagonal round shape offering a modern twist on classic wire frames
• Glare-reducing polarized lenses ideal for driving and summer travel
• Slim twisted-metal temple arms with comfortable acetate tips
• Corrosion-resistant gold electroplating
• Unisex design versatile for any casual or vacation ensemble`,
  },

  // ── BRACELETS ────────────────────────────────────────────────────────────
  {
    sourceFile: 'product-1786779609048.jpg',
    cleanName: 'Rose_Gold_Infinity_Charm_Bolo_Bracelet.jpg',
    name: 'Rose Gold Infinity Charm Bolo Bracelet',
    category: 'bracelets',
    brand: 'Glamora',
    price: 50,
    discountPrice: 0,
    stock: 25,
    isDeal: false,
    isLatest: true,
    isFeatured: true,
    description: `A meaningful infinity symbol adorned with shimmering pavé crystals on an adjustable rose gold bolo slider box chain.

Key Features:
• Sparkling infinity motif symbolizing eternal love and connection
• Bezel-set round crystal links flanking the focal center
• Smooth glide bolo slider stopper fitting any wrist from 5.5 to 9 inches
• Warm 18K rose gold plating with protective e-coating against tarnish
• Beautiful standalone piece or addition to a layered bracelet stack`,
  },
  {
    sourceFile: 'product-1786778934933.webp',
    cleanName: 'Ruby_Crystal_Tulip_Vine_Bracelet.webp',
    name: 'Ruby Crystal Tulip Vine Bracelet',
    category: 'bracelets',
    brand: 'Glamora',
    price: 65,
    discountPrice: 48,
    stock: 20,
    isDeal: true,
    isLatest: true,
    dealEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: `An organic botanical vine bracelet featuring faceted ruby red crystal blossoms paired with emerald green marquise leaves on a gold branch.

Key Features:
• Whimsical floral vine link design capturing nature's beauty
• Rich ruby-red oval crystals alternating with vivid emerald crystal leaves
• 18K gold-plated brass with double safety foldover clasp
• Articulated flexible links that drape comfortably around the wrist
• Exceptional statement jewelry for festive gatherings and evening dinners`,
  },
  {
    sourceFile: 'product-1786779663200.jpg',
    cleanName: 'Dual_Tone_Infinity_Friendship_Bolo_Bracelets.jpg',
    name: 'Dual Tone Infinity Friendship Bolo Bracelets',
    category: 'bracelets',
    brand: 'Glamora',
    price: 70,
    discountPrice: 52,
    stock: 18,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    description: `A coordinated pair of infinity slider bracelets in brilliant sterling silver and warm rose gold, accented with round bezel crystals.

Key Features:
• Includes both silver and rose gold bracelets in a paired gift set
• Pavé-set infinity centerpieces with graduated bezel-set stone chains
• Fully adjustable bolo drawstring sliding bead fits wrists of all sizes
• High-grade anti-allergic alloy with enduring tarnish resistance
• The ultimate matching friendship or couple gift`,
  },
  {
    sourceFile: 'product-1786779826249.jpg',
    cleanName: 'Rose_Gold_Ruby_Geometric_Link_Bracelet.jpg',
    name: 'Rose Gold Ruby Geometric Link Bracelet',
    category: 'bracelets',
    brand: 'Glamora',
    price: 58,
    discountPrice: 0,
    stock: 22,
    isDeal: false,
    isLatest: false,
    description: `A contemporary link bracelet alternating open diamond pavé squares with baguette-cut synthetic ruby gems on rose gold.

Key Features:
• Openwork geometric square stations encrusted with micro-pavé crystals
• Vivid baguette-cut ruby colored stones adding rich jewel tones
• Secure lobster claw clasp with 2-inch extender chain and charm drop
• Premium rose gold electroplating with ultra-smooth polish
• Sophisticated sparkle for both daytime and evening occasions`,
  },
  {
    sourceFile: 'product-1786781379877.jpg',
    cleanName: 'Aquamarine_Crystal_Heart_Silver_Bracelet.jpg',
    name: 'Aquamarine Crystal Heart Sterling Silver Bracelet',
    category: 'bracelets',
    brand: 'Glamora',
    price: 54,
    discountPrice: 38,
    stock: 21,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    description: `A dainty sterling silver link chain centered by a serene sea-blue aquamarine faceted crystal heart flanked by round bezel crystals.

Key Features:
• Radiant heart-cut aquamarine crystal focal stone
• Sparkling bezel-set side crystals on a classic link chain
• Solid 925 sterling silver with rhodium coating for longevity
• Adjustable length with spring ring clasp
• Thoughtful gift for March birthdays, anniversaries, or self-indulgence`,
  },

  // ── EARRINGS ─────────────────────────────────────────────────────────────
  {
    sourceFile: 'product-1787478073162.webp',
    cleanName: 'Gunmetal_Pave_Crystal_Teardrop_Earrings.webp',
    name: 'Gunmetal Pavé Crystal Teardrop Earrings',
    category: 'earrings',
    brand: 'Glamora',
    price: 46,
    discountPrice: 34,
    stock: 25,
    isDeal: true,
    isLatest: true,
    isFeatured: true,
    dealEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    description: `Dramatic open teardrop drop earrings completely encrusted with faceted charcoal hematite and gunmetal crystals.

Key Features:
• Open teardrop silhouette adorned with full pavé textured stones
• Unique gunmetal antique finish offering an edgy, luxurious allure
• Secure post back with comfort bullet friction clutches
• Lightweight hollow-back design preventing earlobe drag
• Pairs effortlessly with little black dresses and gala attire`,
  },
  {
    sourceFile: 'product-1787478116705.jpg',
    cleanName: 'Gold_Twisted_Rope_Hoop_Earrings.jpg',
    name: '14K Gold Twisted Rope Hoop Earrings',
    category: 'earrings',
    brand: 'Glamora',
    price: 38,
    discountPrice: 0,
    stock: 30,
    isDeal: false,
    isLatest: true,
    description: `Classic French rope twisted hoops forged in gleaming 14K gold plating with comfortable saddle-back clasps.

Key Features:
• Braided rope texture reflecting light from every dimension
• 20mm everyday hoop diameter suitable for any look
• Secure click-top saddle closure with curved ear wire
• Hypoallergenic and nickel-free for sensitive ears
• A foundational jewelry staple essential for every collection`,
  },
  {
    sourceFile: 'product-1787478214020.webp',
    cleanName: 'Sterling_Silver_Classic_Huggie_Hoop_Earrings.webp',
    name: 'Sterling Silver Classic Polished Huggie Hoop Earrings',
    category: 'earrings',
    brand: 'Glamora',
    price: 34,
    discountPrice: 24,
    stock: 32,
    isDeal: true,
    isLatest: false,
    dealEndsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    description: `Timeless small polished tube hoops made in pure sterling silver with secure click-lock hinge closures.

Key Features:
• High-shine mirror polished surface with clean minimalist lines
• 15mm snug huggie profile perfect for first or second lobe piercings
• Easy click-lock hinged wire ensuring worry-free wear
• Genuine 925 sterling silver stamped for authenticity
• Water-friendly, sleep-friendly, and perfect for 24/7 wear`,
  },

  // ── NECKLACES ────────────────────────────────────────────────────────────
  {
    sourceFile: 'product-1793028369788.jpeg',
    cleanName: 'Oval_Solitaire_Diamond_Pendant_Necklace.jpeg',
    name: 'Oval Solitaire Diamond Pendant Necklace',
    category: 'necklaces',
    brand: 'Glamora',
    price: 72,
    discountPrice: 0,
    stock: 20,
    isDeal: false,
    isLatest: true,
    isFeatured: true,
    description: `An elegant 4-prong oval brilliant solitaire diamond pendant suspended on a shimmering sterling silver cable chain.

Key Features:
• Spectacular 2.5-carat look oval-cut cubic zirconia with fiery brilliance
• Classic 4-prong basket setting allowing maximum light transmission
• Delicate 16-18 inch adjustable cable chain with lobster clasp
• High-polish rhodium finish preventing discoloration and skin irritation
• The quintessential everyday luxury pendant for all occasions`,
  },
  {
    sourceFile: 'product-1787477792746.webp',
    cleanName: 'Magnetic_Folding_Four_Leaf_Clover_Heart_Necklace.webp',
    name: 'Magnetic Folding Four-Leaf Clover Heart Necklace',
    category: 'necklaces',
    brand: 'Glamora',
    price: 62,
    discountPrice: 45,
    stock: 24,
    isDeal: true,
    isLatest: true,
    dealEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: `A magical convertible necklace: wear it closed as a lucky four-leaf clover, or open it up into four connected sparkling hearts.

Key Features:
• Innovative magnetic transformation: 2 stunning styles in 1 piece
• Pavé-set crystal hearts in rich 18K yellow gold plating
• Precision embedded micro-magnets hold the clover shape securely
• 18-inch fine link chain with lobster clasp and extender
• Symbolic of hope, faith, love, and luck — an unforgettable gift`,
  },
  {
    sourceFile: 'product-1787479107351.webp',
    cleanName: 'Golden_Filigree_Bead_Freshwater_Pearl_Necklace.webp',
    name: 'Golden Filigree Bead & Freshwater Pearl Necklace',
    category: 'necklaces',
    brand: 'Glamora',
    price: 78,
    discountPrice: 0,
    stock: 16,
    isDeal: false,
    isLatest: false,
    description: `A vintage-inspired station necklace alternating hand-selected creamy freshwater pearls with intricate golden filigree lace beads.

Key Features:
• Luminous cultured freshwater pearls with natural organic luster
• Handcrafted open filigree gold beads with antique lace detailing
• 24-inch opera length that can be worn long or doubled up
• Durable hand-strung wire with 18K gold-plated toggle closure
• Brings royal, heirloom-quality sophistication to any outfit`,
  },
];

const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'avif') return 'image/avif';
  return 'application/octet-stream';
};

async function runMigration() {
  console.log('--- STARTING BULK PRODUCT MIGRATION ---');
  console.log('Connecting to MongoDB at:', process.env.MONGO_URI ? 'URI set' : 'URI missing');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  const newProductsDir = path.resolve(__dirname, '../../new-products');

  // Step 1: Upload each image with its clean product name to Supabase
  console.log('\n--- UPLOADING IMAGES TO SUPABASE (RENAMED WITH PRODUCT NAMES) ---');
  const uploadedMap = new Map(); // cleanName -> publicUrl

  for (const item of catalog) {
    const srcPath = path.join(newProductsDir, item.sourceFile);
    if (!fs.existsSync(srcPath)) {
      console.error(`Error: source file ${item.sourceFile} does not exist in new-products/`);
      continue;
    }

    if (uploadedMap.has(item.cleanName)) {
      console.log(`[Already uploaded] ${item.cleanName}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(srcPath);
    const mimeType = getMimeType(item.cleanName);

    console.log(`Uploading: ${item.cleanName} (${fileBuffer.length} bytes, ${mimeType})...`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(item.cleanName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload ${item.cleanName}:`, error.message);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(item.cleanName);

    const publicUrl = urlData.publicUrl;
    console.log(`-> Public URL: ${publicUrl}`);
    uploadedMap.set(item.cleanName, publicUrl);
  }

  // Step 2: Delete old products from database
  console.log('\n--- DELETING OLD PRODUCTS FROM DATABASE ---');
  const deleteResult = await Product.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} old products from MongoDB.`);

  // Step 3: Insert new products
  console.log('\n--- INSERTING NEW PRODUCTS ---');
  const docsToInsert = catalog.map((item) => {
    const publicUrl = uploadedMap.get(item.cleanName);
    return {
      name: item.name,
      description: item.description,
      price: item.price,
      discountPrice: item.discountPrice,
      category: item.category,
      brand: item.brand,
      stock: item.stock,
      rating: 4.8,
      numReviews: Math.floor(Math.random() * 20) + 5,
      isDeal: item.isDeal || false,
      isLatest: item.isLatest || false,
      isFeatured: item.isFeatured || false,
      dealEndsAt: item.dealEndsAt || null,
      images: [
        {
          url: publicUrl,
          isMain: true,
        },
      ],
    };
  });

  const inserted = await Product.insertMany(docsToInsert);
  console.log(`Successfully inserted ${inserted.length} new products into MongoDB!`);

  console.log('\n--- PRODUCTS SUMMARY BY CATEGORY ---');
  const catCount = {};
  inserted.forEach((p) => {
    catCount[p.category] = (catCount[p.category] || 0) + 1;
  });
  console.table(catCount);

  await mongoose.disconnect();
  console.log('MongoDB disconnected. Migration complete!');
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});

