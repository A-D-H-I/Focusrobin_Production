import { getAvailableFrameColors } from "./src/app/actions/getAvailableColors";

async function run() {
  const eyeglassesColors = await getAvailableFrameColors('eyeglasses');
  console.log("Eyeglasses Colors:", JSON.stringify(eyeglassesColors, null, 2));
}

run();
