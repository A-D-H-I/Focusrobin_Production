import { getAvailableBrands } from "../src/app/actions/getAvailableBrands";
async function test() {
  const brands = await getAvailableBrands("sunglasses");
  console.log("BRANDS:", brands);
}
test();
