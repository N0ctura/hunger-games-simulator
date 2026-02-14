const https = require('https');

const assets = [
  // Mannequin
  { name: 'body-3x', url: 'https://cdn2.wolvesville.com/bodyPaints/body-skin-1.avatar-large@3x.png' },
  { name: 'head-3x', url: 'https://cdn2.wolvesville.com/bodyPaints/head-skin-1.avatar-large@3x.png' },
  
  // Full Canvas Candidates (based on ratio ~0.66)
  { name: 'hat-full-2x', url: 'https://cdn2.wolvesville.com/avatarItems/luv-jetaime-hat-female.avatar-large@2x.png' }, 
  { name: 'hat-full-3x', url: 'https://cdn2.wolvesville.com/avatarItems/luv-jetaime-hat-female.avatar-large@3x.png' },

  // Cropped Candidates
  { name: 'hair-cropped-2x', url: 'https://cdn2.wolvesville.com/avatarItems/bp33-welcomestore-hair-male.avatar-large@2x.png' },
  { name: 'shirt-cropped-2x', url: 'https://cdn2.wolvesville.com/avatarItems/summonersoul-shirt.avatar-large@2x.png' },
  { name: 'eyes-cropped-2x', url: 'https://cdn2.wolvesville.com/avatarItems/gudnite-onlys-eyes-male.avatar-large@2x.png' },
  { name: 'mouth-cropped-2x', url: 'https://cdn2.wolvesville.com/avatarItems/gudnite-onlys-mouth-male.avatar-large@2x.png' },
  
  // Special
  { name: 'store-hair-1x', url: 'https://cdn.wolvesville.com/avatarItems/woetothedreamers-hair.store.png' }
];

// Expected Sacred Dimensions @1x
const SACRED_W = 209;
const SACRED_H = 314;

function getDimensions(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        const fallbackUrl = url.replace('cdn2.wolvesville.com', 'cdn.wolvesville.com');
        if (url !== fallbackUrl) {
            https.get(fallbackUrl, (res2) => {
                if (res2.statusCode !== 200) {
                     reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                     return;
                }
                processResponse(res2, resolve, reject);
            }).on('error', reject);
            return;
        }
        reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        return;
      }
      processResponse(res, resolve, reject);
    }).on('error', reject);
  });
}

function processResponse(res, resolve, reject) {
    const chunks = [];
    res.on('data', (chunk) => {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1024) {
        res.destroy();
    }
    });

    res.on('close', () => {
    const buffer = Buffer.concat(chunks);
    try {
        if (buffer.length < 24) {
             reject(new Error('Buffer too small'));
             return;
        }
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        resolve({ width, height });
    } catch (e) {
        reject(e);
    }
    });
}

async function run() {
  console.log('Analyzing Asset Dimensions & Density Scaling');
  console.log('Sacred Canvas: 209x314 (@1x)');
  console.log('--------------------------------------------------------------------------------');
  
  for (const asset of assets) {
    try {
      const dims = await getDimensions(asset.url);
      const ratio = dims.width / dims.height;
      const isSacredRatio = Math.abs(ratio - 0.6656) < 0.05; // Loosened tolerance
      
      // Determine density
      let density = 1;
      if (asset.url.includes('@3x')) density = 3;
      if (asset.url.includes('@2x')) density = 2;
      
      // Calculate Scaled Dimensions (to @1x)
      const scaledW = dims.width / density;
      const scaledH = dims.height / density;
      
      // Difference from Sacred Canvas
      const diffW = scaledW - SACRED_W;
      const diffH = scaledH - SACRED_H;
      
      console.log(`[${asset.name}]`);
      console.log(`  Raw: ${dims.width}x${dims.height} (Ratio: ${ratio.toFixed(3)})`);
      console.log(`  Density: @${density}x -> Scaled: ${scaledW.toFixed(1)}x${scaledH.toFixed(1)}`);
      console.log(`  Type: ${isSacredRatio ? 'FULL CANVAS (Candidate)' : 'CROPPED'}`);
      console.log(`  Diff from 209x314: W: ${diffW.toFixed(1)}px, H: ${diffH.toFixed(1)}px`);
      
      if (isSacredRatio) {
          console.log(`  Suggestion: Center (left: -${(diffW/2).toFixed(1)}px, top: -${(diffH/2).toFixed(1)}px)`);
      } else {
          console.log(`  Suggestion: Needs Offset`);
      }
      console.log('--------------------------------------------------------------------------------');
      
    } catch (err) {
      console.error(`${asset.name}: Error - ${err.message}`);
    }
  }
}

run();
