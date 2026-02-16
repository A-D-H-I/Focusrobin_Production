
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLOR_PALETTE: Record<string, string> = {
    "Black": "#000000",
    "Tortoise": "linear-gradient(45deg, #3E2723 25%, #5D4037 25%, #5D4037 50%, #3E2723 50%, #3E2723 75%, #5D4037 75%, #5D4037 100%)",
    "Brown": "#5D4037",
    "Blue": "#1E3A8A",
    "Grey": "#808080",
    "Clear": "#F3F4F6", // Light grey for visibility
    "Gold": "linear-gradient(135deg, #FFD700 0%, #FDB931 100%)",
    "Silver": "linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)",
    "Rose Gold": "linear-gradient(135deg, #B76E79 0%, #E0C0C0 100%)",
    "Green": "#2E7D32",
    "Red": "#C62828",
    "Yellow": "#FBC02D",
    "Pink": "#E91E63",
    "Purple": "#7B1FA2",
    "Orange": "#EF6C00",
    "White": "#FFFFFF",
    "Beige": "#F5F5DC",
    "Burgundy": "#800020",
    "Gunmetal": "#546E7A",
    "Tortoise/Gold": "linear-gradient(90deg, #3E2723 50%, #FFD700 50%)",
    "Black/Gold": "linear-gradient(90deg, #000000 50%, #FFD700 50%)",
    "Black/Silver": "linear-gradient(90deg, #000000 50%, #C0C0C0 50%)",
    "Multi": "linear-gradient(45deg, #FF0000, #00FF00, #0000FF)",
    "Transparent": "linear-gradient(45deg, #e6e6e6 25%, transparent 25%, transparent 75%, #e6e6e6 75%, #e6e6e6), linear-gradient(45deg, #e6e6e6 25%, transparent 25%, transparent 75%, #e6e6e6 75%, #e6e6e6) 10px 10px", // Checkerboard pattern
};

// CSS background-size for checkerboard
// background-color: #fff;
// background-size: 20px 20px;

async function main() {
    console.log('Starting ColorFamily seed...');

    for (const [name, hex] of Object.entries(COLOR_PALETTE)) {
        // Check if it's a gradient or simple hex
        // For our DB, 'hex' field will store the CSS value (which can be a gradient string)
        // We called it 'hex' in model, but strictly speaking it's 'value' or 'css'. 
        // The model field comment says "Base color code (e.g., #123456)", but implementation plan said "Hex Color".
        // For gradients, we should store the gradient string in 'hex' column or add a new column?
        // Let's store the full CSS value in 'hex' column for now as it makes frontend easy (just style={{background: hex}}).
        // Or should we support both?
        // The current filters use style={{ background: color.hex }} so storing gradient string there works.

        await prisma.colorFamily.upsert({
            where: { name },
            update: {
                hex: hex,
            },
            create: {
                name,
                hex,
            },
        });
        console.log(`Upserted ColorFamily: ${name}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
