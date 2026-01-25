import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionLensImage } from '@/app/actions/prescriptionLensImages';

/**
 * GET /api/prescription-lens-image
 * Fetches the best matching prescription lens image based on query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const lensType = searchParams.get('lensType') || '';
    const lensIndex = searchParams.get('lensIndex');
    const coating = searchParams.get('coating');
    const tintType = searchParams.get('tintType');
    const tintColor = searchParams.get('tintColor');
    const tintShadePercentRaw = searchParams.get('tintShadePercent');
    const tintShadePercent = tintShadePercentRaw ? parseInt(tintShadePercentRaw, 10) : null;
    const tintRecipe = searchParams.get('tintRecipe');
    const photochromicColor = searchParams.get('photochromicColor');
    const polarizedColor = searchParams.get('polarizedColor');
    const frameType = searchParams.get('frameType');
    const isOutdoorRaw = searchParams.get('isOutdoor');
    const isOutdoor = isOutdoorRaw === 'true';

    console.log('[API prescription-lens-image] Request params:', {
      lensType,
      lensIndex,
      coating,
      tintType,
      tintColor,
      photochromicColor,
      polarizedColor,
      isOutdoor
    });

    const result = await getPrescriptionLensImage(
      lensType,
      lensIndex,
      coating,
      tintType,
      tintColor,
      tintShadePercent,
      tintRecipe,
      photochromicColor,
      polarizedColor,
      frameType,
      isOutdoor
    );

    if (result.error) {
      console.error('[API prescription-lens-image] Error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.image) {
      console.log('[API prescription-lens-image] No image found');
      return NextResponse.json({ imageUrl: null }, { status: 200 });
    }

    console.log('[API prescription-lens-image] Found image:', result.image.imageUrl);
    return NextResponse.json({ imageUrl: result.image.imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Error in prescription-lens-image API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

