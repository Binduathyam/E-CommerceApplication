// config/productConfig.ts
// Same product configuration as the web AddProduct page.

export type Field = { name: string; label: string; placeholder: string };
export type VariantField = { key: string; label: string; placeholder: string };

const F = (name: string, label: string, placeholder: string): Field => ({
  name,
  label,
  placeholder,
});

const V = (key: string, label: string, placeholder: string): VariantField => ({
  key,
  label,
  placeholder,
});

/* ---------- CATEGORY -> PRODUCT TYPE ---------- */

export const productTypes: Record<string, string[]> = {
  Electronics: [
    'Smartphone', 'Laptop', 'Tablet', 'Smart Watch', 'Headphones',
    'Bluetooth Speaker', 'Camera', 'Keyboard', 'Mouse',
  ],
  Fashion: ['Bangles', 'Saree', 'Kurti', 'T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Handbag'],
  Home: ['Sofa', 'Bed', 'Dining Table', 'Chair', 'Table Lamp', 'Wall Clock', 'Curtains', 'Carpet'],
  Beauty: ['Face Wash', 'Moisturizer', 'Sunscreen', 'Lipstick', 'Foundation', 'Perfume', 'Shampoo', 'Hair Oil'],
  Sports: [
    'Cricket Bat', 'Cricket Ball', 'Football', 'Basketball',
    'Tennis Racket', 'Badminton Racket', 'Sports Shoes', 'Gym Equipment',
  ],
  Accessories: ['Watch', 'Sunglasses', 'Wallet', 'Belt', 'Backpack', 'Jewellery', 'Mobile Cover', 'Keychain'],
};

/* ---------- PRODUCT TYPE -> SPECIFIC FIELDS ---------- */

const model = F('model', 'Model', 'Enter model name');
const color = F('color', 'Color', 'Enter color');
const warranty = F('warranty', 'Warranty', 'e.g. 1 Year');
const gender = F('gender', 'Gender', 'Men / Women / Unisex');
const occasion = (p: string) => F('occasion', 'Occasion', p);
const dimensions = F('dimensions', 'Dimensions', 'Enter dimensions');

export const productFields: Record<string, Field[]> = {
  /* ELECTRONICS */
  Smartphone: [
    model, color,
    F('ram', 'RAM', 'e.g. 8 GB'),
    F('storage', 'Storage', 'e.g. 128 GB'),
    F('displaySize', 'Display Size', 'e.g. 6.5 inches'),
    F('battery', 'Battery Capacity', 'e.g. 5000 mAh'),
    F('operatingSystem', 'Operating System', 'e.g. Android 15'),
    warranty,
  ],
  Laptop: [
    model,
    F('processor', 'Processor', 'e.g. Intel Core i5'),
    F('ram', 'RAM', 'e.g. 16 GB'),
    F('storage', 'Storage', 'e.g. 512 GB SSD'),
    F('graphics', 'Graphics', 'e.g. NVIDIA RTX 4050'),
    F('screenSize', 'Screen Size', 'e.g. 15.6 inches'),
    F('operatingSystem', 'Operating System', 'e.g. Windows 11'),
    F('battery', 'Battery', 'Enter battery details'),
    warranty,
  ],
  Tablet: [
    model, color,
    F('ram', 'RAM', 'e.g. 8 GB'),
    F('storage', 'Storage', 'e.g. 256 GB'),
    F('displaySize', 'Display Size', 'e.g. 11 inches'),
    F('battery', 'Battery Capacity', 'e.g. 8000 mAh'),
    F('operatingSystem', 'Operating System', 'e.g. Android'),
    warranty,
  ],
  'Smart Watch': [
    model, color,
    F('displayType', 'Display Type', 'e.g. AMOLED'),
    F('displaySize', 'Display Size', 'e.g. 1.9 inches'),
    F('batteryLife', 'Battery Life', 'e.g. 7 Days'),
    F('waterResistance', 'Water Resistance', 'e.g. IP68'),
    F('connectivity', 'Connectivity', 'e.g. Bluetooth, Wi-Fi'),
    warranty,
  ],
  Headphones: [
    model, color,
    F('type', 'Headphone Type', 'e.g. Over Ear'),
    F('connectivity', 'Connectivity', 'e.g. Bluetooth 5.3'),
    F('batteryLife', 'Battery Life', 'e.g. 40 Hours'),
    F('noiseCancellation', 'Noise Cancellation', 'e.g. Active Noise Cancellation'),
    warranty,
  ],
  'Bluetooth Speaker': [
    model, color,
    F('powerOutput', 'Power Output', 'e.g. 20 W'),
    F('connectivity', 'Connectivity', 'e.g. Bluetooth 5.3'),
    F('batteryLife', 'Battery Life', 'e.g. 12 Hours'),
    F('waterResistance', 'Water Resistance', 'e.g. IP67'),
    warranty,
  ],
  Camera: [
    F('model', 'Model', 'Enter camera model'),
    F('cameraType', 'Camera Type', 'e.g. DSLR / Mirrorless'),
    F('resolution', 'Resolution', 'e.g. 24 MP'),
    F('sensorType', 'Sensor Type', 'e.g. CMOS'),
    F('lensMount', 'Lens Mount', 'Enter lens mount'),
    F('videoResolution', 'Video Resolution', 'e.g. 4K'),
    warranty,
  ],
  Keyboard: [
    F('model', 'Model', 'Enter keyboard model'),
    F('keyboardType', 'Keyboard Type', 'e.g. Mechanical'),
    F('switchType', 'Switch Type', 'e.g. Blue Switch'),
    F('connectivity', 'Connectivity', 'e.g. USB / Wireless'),
    color,
    F('backlight', 'Backlight', 'e.g. RGB'),
    warranty,
  ],
  Mouse: [
    F('model', 'Model', 'Enter mouse model'),
    F('mouseType', 'Mouse Type', 'e.g. Gaming / Wireless'),
    F('connectivity', 'Connectivity', 'e.g. Bluetooth / USB'),
    F('dpi', 'DPI', 'e.g. 1600 DPI'),
    color,
    warranty,
  ],

  /* FASHION */
  Bangles: [
    F('material', 'Material', 'e.g. Gold / Silver / Glass'),
    F('bangleType', 'Bangle Type', 'e.g. Kada / Bracelet'),
    color,
    F('design', 'Design', 'Describe the design'),
    occasion('e.g. Wedding / Party'),
    F('packOf', 'Pack of', 'e.g. 2'),
  ],
  Saree: [
    F('fabric', 'Fabric', 'e.g. Silk / Cotton'),
    F('sareeLength', 'Saree Length', 'e.g. 5.5 meters'),
    F('blouseIncluded', 'Blouse Included', 'Yes / No'),
    F('pattern', 'Pattern', 'e.g. Printed / Embroidered'),
    color,
    occasion('e.g. Wedding / Festival'),
  ],
  Kurti: [
    F('fabric', 'Fabric', 'e.g. Cotton'),
    color,
    F('pattern', 'Pattern', 'e.g. Printed'),
    F('sleeveType', 'Sleeve Type', 'e.g. Full Sleeve'),
    occasion('e.g. Casual'),
  ],
  'T-Shirt': [
    color,
    F('fabric', 'Fabric', 'e.g. Cotton'),
    F('pattern', 'Pattern', 'e.g. Printed / Solid'),
    F('fit', 'Fit', 'e.g. Regular / Slim'),
    gender,
  ],
  Jeans: [
    color,
    F('fabric', 'Fabric', 'e.g. Denim'),
    F('fit', 'Fit', 'e.g. Slim / Regular'),
    F('pattern', 'Pattern', 'e.g. Solid'),
    gender,
  ],
  Dress: [
    color,
    F('fabric', 'Fabric', 'e.g. Cotton'),
    F('pattern', 'Pattern', 'e.g. Printed'),
    F('dressLength', 'Dress Length', 'e.g. Knee Length'),
    occasion('e.g. Party'),
  ],
  Shoes: [
    color,
    F('material', 'Material', 'e.g. Leather / Synthetic'),
    F('pattern', 'Pattern', 'e.g. Solid'),
    F('closure', 'Closure Type', 'e.g. Lace-Up / Slip-On'),
    occasion('e.g. Casual / Sports'),
    gender,
  ],
  Handbag: [
    F('material', 'Material', 'e.g. Leather'),
    F('bagType', 'Bag Type', 'e.g. Shoulder Bag'),
    color,
    F('closure', 'Closure Type', 'e.g. Zip'),
    F('compartments', 'Compartments', 'e.g. 3'),
    occasion('e.g. Casual'),
  ],

  /* HOME */
  Sofa: [
    F('material', 'Material', 'e.g. Fabric / Leather'),
    F('seatingCapacity', 'Seating Capacity', 'e.g. 3 Seater'),
    color,
    F('shape', 'Shape', 'e.g. L-Shape'),
    dimensions,
  ],
  Bed: [
    F('material', 'Material', 'e.g. Wood'),
    F('bedSize', 'Bed Size', 'e.g. Queen / King'),
    color,
    dimensions,
  ],
  'Dining Table': [
    F('material', 'Material', 'e.g. Wood'),
    F('seatingCapacity', 'Seating Capacity', 'e.g. 6 Seater'),
    F('shape', 'Shape', 'e.g. Rectangular'),
    color,
    dimensions,
  ],
  Chair: [
    F('material', 'Material', 'e.g. Wood / Plastic'),
    color,
    F('chairType', 'Chair Type', 'e.g. Office / Dining'),
    dimensions,
  ],
  'Table Lamp': [
    F('material', 'Material', 'e.g. Metal'),
    F('bulbType', 'Bulb Type', 'e.g. LED'),
    F('wattage', 'Wattage', 'e.g. 10W'),
    color,
  ],
  'Wall Clock': [
    F('material', 'Material', 'e.g. Plastic / Wood'),
    F('clockType', 'Clock Type', 'e.g. Analog / Digital'),
    color,
    dimensions,
  ],
  Curtains: [
    F('fabric', 'Fabric', 'e.g. Cotton'),
    F('curtainLength', 'Curtain Length', 'Enter length'),
    color,
    F('pattern', 'Pattern', 'e.g. Printed'),
  ],
  Carpet: [
    F('material', 'Material', 'e.g. Wool'),
    F('size', 'Size', 'e.g. 5 x 7 ft'),
    color,
    F('pattern', 'Pattern', 'e.g. Traditional'),
  ],

  /* BEAUTY */
  'Face Wash': [
    F('skinType', 'Skin Type', 'e.g. Oily / Dry / Normal'),
    F('volume', 'Volume', 'e.g. 100 ml'),
    F('ingredients', 'Key Ingredients', 'Enter key ingredients'),
    F('fragrance', 'Fragrance', 'e.g. Rose / Fragrance Free'),
    F('concern', 'Skin Concern', 'e.g. Acne / Oil Control'),
  ],
  Moisturizer: [
    F('skinType', 'Skin Type', 'e.g. Dry / Oily'),
    F('volume', 'Volume', 'e.g. 50 g'),
    F('ingredients', 'Key Ingredients', 'Enter ingredients'),
    F('spf', 'SPF', 'e.g. SPF 30'),
  ],
  Sunscreen: [
    F('spf', 'SPF', 'e.g. SPF 50'),
    F('skinType', 'Skin Type', 'e.g. All Skin Types'),
    F('volume', 'Volume', 'e.g. 50 ml'),
    F('waterResistant', 'Water Resistant', 'Yes / No'),
  ],
  Lipstick: [
    F('shade', 'Shade', 'Enter shade name'),
    F('finish', 'Finish', 'e.g. Matte / Glossy'),
    color,
    F('volume', 'Net Quantity', 'e.g. 4 g'),
  ],
  Foundation: [
    F('shade', 'Shade', 'Enter shade'),
    F('skinType', 'Skin Type', 'e.g. Dry / Oily'),
    F('finish', 'Finish', 'e.g. Matte / Natural'),
    F('volume', 'Net Quantity', 'e.g. 30 ml'),
  ],
  Perfume: [
    F('fragranceType', 'Fragrance Type', 'e.g. Eau de Parfum'),
    F('volume', 'Volume', 'e.g. 100 ml'),
    gender,
    F('fragranceNotes', 'Fragrance Notes', 'Enter fragrance notes'),
  ],
  Shampoo: [
    F('hairType', 'Hair Type', 'e.g. Dry / Oily'),
    F('volume', 'Volume', 'e.g. 200 ml'),
    F('ingredients', 'Key Ingredients', 'Enter ingredients'),
    F('concern', 'Hair Concern', 'e.g. Dandruff / Hair Fall'),
  ],
  'Hair Oil': [
    F('hairType', 'Hair Type', 'e.g. All Hair Types'),
    F('volume', 'Volume', 'e.g. 200 ml'),
    F('ingredients', 'Key Ingredients', 'Enter ingredients'),
    F('concern', 'Hair Concern', 'e.g. Hair Fall'),
  ],

  /* SPORTS */
  'Cricket Bat': [
    F('material', 'Material', 'e.g. English Willow'),
    F('batSize', 'Bat Size', 'e.g. Full Size'),
    F('weight', 'Weight', 'e.g. 1.2 kg'),
    F('gripType', 'Grip Type', 'Enter grip type'),
    F('playerLevel', 'Player Level', 'e.g. Professional'),
  ],
  'Cricket Ball': [
    F('material', 'Material', 'e.g. Leather'),
    F('ballType', 'Ball Type', 'e.g. Red / White'),
    F('weight', 'Weight', 'e.g. 156 g'),
    F('packOf', 'Pack of', 'e.g. 1'),
  ],
  Football: [
    F('material', 'Material', 'e.g. PU Leather'),
    F('footballSize', 'Football Size', 'e.g. Size 5'),
    color,
    F('playingSurface', 'Playing Surface', 'e.g. Grass / Turf'),
  ],
  Basketball: [
    F('material', 'Material', 'e.g. Rubber'),
    F('basketballSize', 'Basketball Size', 'e.g. Size 7'),
    color,
    F('playingSurface', 'Playing Surface', 'e.g. Indoor / Outdoor'),
  ],
  'Tennis Racket': [
    F('material', 'Material', 'e.g. Graphite'),
    F('weight', 'Weight', 'e.g. 300 g'),
    F('headSize', 'Head Size', 'e.g. 100 sq in'),
    F('gripSize', 'Grip Size', 'e.g. 4 3/8'),
  ],
  'Badminton Racket': [
    F('material', 'Material', 'e.g. Carbon Fiber'),
    F('weight', 'Weight', 'e.g. 85 g'),
    F('flexibility', 'Flexibility', 'e.g. Medium'),
    F('gripSize', 'Grip Size', 'Enter grip size'),
  ],
  'Sports Shoes': [
    F('shoeSize', 'Shoe Size', 'e.g. 6 / 7 / 8 / 9'),
    color,
    F('material', 'Material', 'Enter material'),
    F('shoeType', 'Shoe Type', 'e.g. Running'),
    gender,
  ],
  'Gym Equipment': [
    F('equipmentType', 'Equipment Type', 'e.g. Dumbbell / Treadmill'),
    F('material', 'Material', 'Enter material'),
    F('weightCapacity', 'Weight Capacity', 'Enter capacity'),
    dimensions,
  ],

  /* ACCESSORIES */
  Watch: [
    F('model', 'Model', 'Enter model'),
    F('dialColor', 'Dial Color', 'Enter dial color'),
    F('strapMaterial', 'Strap Material', 'e.g. Leather'),
    F('watchType', 'Watch Type', 'e.g. Analog / Digital'),
    F('waterResistance', 'Water Resistance', 'e.g. 50 m'),
  ],
  Sunglasses: [
    F('frameMaterial', 'Frame Material', 'e.g. Metal'),
    F('frameColor', 'Frame Color', 'Enter frame color'),
    F('lensColor', 'Lens Color', 'Enter lens color'),
    F('lensType', 'Lens Type', 'e.g. UV Protected'),
    gender,
  ],
  Wallet: [
    F('material', 'Material', 'e.g. Leather'),
    color,
    F('walletType', 'Wallet Type', 'e.g. Bi-fold'),
    F('cardSlots', 'Card Slots', 'e.g. 6'),
    F('compartments', 'Compartments', 'e.g. 2'),
  ],
  Belt: [
    F('material', 'Material', 'e.g. Leather'),
    F('beltSize', 'Belt Size', 'e.g. 32 / 34 / 36'),
    color,
    F('buckleType', 'Buckle Type', 'e.g. Pin Buckle'),
  ],
  Backpack: [
    F('material', 'Material', 'e.g. Polyester'),
    F('capacity', 'Capacity', 'e.g. 25 L'),
    color,
    F('compartments', 'Compartments', 'e.g. 3'),
    F('laptopCompartment', 'Laptop Compartment', 'Yes / No'),
  ],
  Jewellery: [
    F('material', 'Material', 'e.g. Gold / Silver'),
    F('jewelleryType', 'Jewellery Type', 'e.g. Necklace'),
    color,
    occasion('e.g. Wedding'),
  ],
  'Mobile Cover': [
    F('compatibleModel', 'Compatible Model', 'e.g. iPhone 15'),
    F('material', 'Material', 'e.g. Silicone'),
    color,
    F('coverType', 'Cover Type', 'e.g. Shockproof'),
  ],
  Keychain: [
    F('material', 'Material', 'e.g. Metal'),
    F('design', 'Design', 'Enter design'),
    color,
    F('packOf', 'Pack of', 'e.g. 1'),
  ],
};

/* ---------- PRODUCT VARIANT CONFIGURATION ---------- */

export const variantConfig: Record<string, VariantField[]> = {
  /* ELECTRONICS */
  Smartphone: [V('color', 'Color', 'e.g. Black'), V('ram', 'RAM', 'e.g. 8GB'), V('storage', 'Storage', 'e.g. 128GB')],
  Laptop: [
    V('color', 'Color', 'e.g. Silver'),
    V('ram', 'RAM', 'e.g. 16GB'),
    V('storage', 'Storage', 'e.g. 512GB SSD'),
    V('processor', 'Processor', 'e.g. Intel Core i5'),
  ],
  Tablet: [V('color', 'Color', 'e.g. Grey'), V('ram', 'RAM', 'e.g. 8GB'), V('storage', 'Storage', 'e.g. 128GB')],
  'Smart Watch': [V('color', 'Color', 'e.g. Black'), V('strap', 'Strap', 'e.g. Silicone'), V('size', 'Size', 'e.g. 44mm')],
  Headphones: [V('color', 'Color', 'e.g. Black'), V('type', 'Type', 'e.g. Wireless')],
  'Bluetooth Speaker': [V('color', 'Color', 'e.g. Black'), V('power', 'Power', 'e.g. 20W')],
  Camera: [V('color', 'Color', 'e.g. Black'), V('lens', 'Lens', 'e.g. 18-55mm'), V('storage', 'Storage', 'e.g. 128GB')],
  Keyboard: [V('color', 'Color', 'e.g. Black'), V('type', 'Type', 'e.g. Mechanical')],
  Mouse: [V('color', 'Color', 'e.g. Black'), V('type', 'Type', 'e.g. Wireless')],

  /* FASHION */
  Bangles: [V('size', 'Bangle Size', 'e.g. 2.4'), V('color', 'Color', 'e.g. Gold')],
  Saree: [V('color', 'Color', 'e.g. Red'), V('fabric', 'Fabric', 'e.g. Silk')],
  Kurti: [V('size', 'Size', 'e.g. M'), V('color', 'Color', 'e.g. Blue')],
  'T-Shirt': [V('size', 'Size', 'e.g. M'), V('color', 'Color', 'e.g. Black')],
  Jeans: [V('size', 'Waist Size', 'e.g. 32'), V('color', 'Color', 'e.g. Blue')],
  Dress: [V('size', 'Size', 'e.g. M'), V('color', 'Color', 'e.g. Red')],
  Shoes: [V('size', 'Shoe Size', 'e.g. 8'), V('color', 'Color', 'e.g. White')],
  'Sports Shoes': [V('size', 'Shoe Size', 'e.g. 9'), V('color', 'Color', 'e.g. Black')],
  Handbag: [V('color', 'Color', 'e.g. Brown'), V('material', 'Material', 'e.g. Leather')],
  Belt: [V('size', 'Size', 'e.g. 32'), V('color', 'Color', 'e.g. Black')],

  /* HOME */
  Sofa: [V('color', 'Color', 'e.g. Grey'), V('seatingCapacity', 'Seating Capacity', 'e.g. 3 Seater')],
  Bed: [V('size', 'Bed Size', 'e.g. Queen'), V('color', 'Color', 'e.g. Brown')],
  'Dining Table': [V('seatingCapacity', 'Seating Capacity', 'e.g. 6 Seater'), V('color', 'Color', 'e.g. Brown')],
  Chair: [V('color', 'Color', 'e.g. Black')],
  'Table Lamp': [V('color', 'Color', 'e.g. White')],
  'Wall Clock': [V('color', 'Color', 'e.g. Brown')],
  Curtains: [V('color', 'Color', 'e.g. Blue'), V('length', 'Length', 'e.g. 7 ft')],
  Carpet: [V('size', 'Carpet Size', 'e.g. 5 x 7 ft'), V('color', 'Color', 'e.g. Beige')],

  /* BEAUTY */
  'Face Wash': [V('volume', 'Volume', 'e.g. 100 ml')],
  Moisturizer: [V('volume', 'Volume', 'e.g. 50 ml')],
  Sunscreen: [V('volume', 'Volume', 'e.g. 50 ml')],
  Lipstick: [V('shade', 'Shade', 'e.g. Rose Pink')],
  Foundation: [V('shade', 'Shade', 'e.g. Natural Beige')],
  Perfume: [V('volume', 'Volume', 'e.g. 100 ml')],
  Shampoo: [V('volume', 'Volume', 'e.g. 200 ml')],
  'Hair Oil': [V('volume', 'Volume', 'e.g. 200 ml')],

  /* SPORTS */
  'Cricket Bat': [V('batSize', 'Bat Size', 'e.g. Full Size'), V('weight', 'Weight', 'e.g. 1.2 kg')],
  'Cricket Ball': [V('ballType', 'Ball Type', 'e.g. Leather')],
  Football: [V('size', 'Football Size', 'e.g. Size 5'), V('color', 'Color', 'e.g. White')],
  Basketball: [V('size', 'Basketball Size', 'e.g. Size 7'), V('color', 'Color', 'e.g. Orange')],
  'Tennis Racket': [V('gripSize', 'Grip Size', 'e.g. G3'), V('weight', 'Weight', 'e.g. 300 g')],
  'Badminton Racket': [V('gripSize', 'Grip Size', 'e.g. G5'), V('weight', 'Weight', 'e.g. 85 g')],
  'Gym Equipment': [V('weightCapacity', 'Weight Capacity', 'e.g. 100 kg')],

  /* ACCESSORIES */
  Watch: [V('color', 'Color', 'e.g. Black')],
  Sunglasses: [V('frameColor', 'Frame Color', 'e.g. Black'), V('lensColor', 'Lens Color', 'e.g. Grey')],
  Wallet: [V('color', 'Color', 'e.g. Brown')],
  Backpack: [V('color', 'Color', 'e.g. Black'), V('capacity', 'Capacity', 'e.g. 30 L')],
  Jewellery: [V('color', 'Color', 'e.g. Gold')],
  'Mobile Cover': [V('compatibleModel', 'Compatible Model', 'e.g. iPhone 17'), V('color', 'Color', 'e.g. Black')],
  Keychain: [V('color', 'Color', 'e.g. Silver')],
};

/* ---------- GST ---------- */

export const GST_RATES: Record<string, number> = {
  Smartphone: 18,
  Laptop: 18,
  Tablet: 18,
  TV: 18,

  'T-Shirt': 5,
  Jeans: 5,
  Kurti: 5,
  Dress: 5,

  Shoes: 18,
  Bangles: 5,
  Jewellery: 3,

  'Tennis Racket': 12,
  'Badminton Racket': 12,
  'Gym Equipment': 18,

  Watch: 18,
  Sunglasses: 18,
  Wallet: 18,
  Backpack: 18,
  'Mobile Cover': 18,
  Keychain: 18,
};

/* ---------- PRODUCT TYPES THAT SUPPORT VARIANTS ---------- */

export const productsWithVariants: string[] = [
  'Smartphone',
  'Laptop',
  'Bangles',
  'Kurti',
  'T-Shirt',
  'Jeans',
  'Dress',
  'Shoes',
];

/* Product types where images are uploaded per variant */
export const VARIANT_IMAGE_TYPES: string[] = ['Smartphone', 'Laptop'];
