import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const p = await prisma.product.findFirst({ select: { slug: true } });
  const px = await prisma.prescriptionGlasses.findFirst({ select: { slug: true } });
  
  if (p) {
    console.log("Sun:", p.slug);
    const res = await fetch(`http://localhost:3000/shop/${p.slug}`);
    const html = await res.text();
    console.log("Sun HTML tags:", html.indexOf('Tags'), html.indexOf('Polarized lenses'));
  }
  if (px) {
    console.log("Px:", px.slug);
    const res = await fetch(`http://localhost:3000/shop/${px.slug}`);
    const html = await res.text();
    console.log("Px HTML tags:", html.indexOf('Tags'), html.indexOf('Polarized lenses'));
  }
}
run();
