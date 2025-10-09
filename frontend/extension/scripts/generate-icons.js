import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [32, 48, 128];
const inputIcon = join(__dirname, '..', 'icons', 'icon16.png');

async function generateIcons() {
    try {
        for (const size of sizes) {
            await sharp(inputIcon)
                .resize(size, size)
                .toFile(join(__dirname, '..', 'icons', `icon${size}.png`));
            console.log(`Generated icon${size}.png`);
        }
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();