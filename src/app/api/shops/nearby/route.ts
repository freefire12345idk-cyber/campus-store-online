import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withCache, rateLimiter } from "@/lib/cache";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');
    const collegeId = url.searchParams.get('collegeId');

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimiter.isAllowed(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
    }

    // Cache nearby shops for 5 minutes
    const cacheKey = `shops:nearby:${lat}:${lng}:${collegeId || 'all'}`;
    
    return withCache(
      cacheKey,
      async () => {
        // Optimized query with only necessary fields
        const shops = await prisma.shop.findMany({
          where: {
            isApproved: true,
            ...(collegeId && {
              shopOwner: {
                collegeDeliveries: {
                  some: { collegeId }
                }
              }
            })
          },
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            phone: true,
            shopPhoto: true,
            owner: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          take: 50 // Limit results for performance
        });

        // Filter by distance (simplified for performance)
        const nearbyShops = shops.filter(shop => {
          const distance = calculateDistance(lat, lng, shop.latitude, shop.longitude);
          return distance <= 10; // 10km radius
        }).slice(0, 20).map(shop => ({
          ...shop,
          shopOwner: shop.owner ? {
            id: shop.owner.id,
            name: shop.owner.user?.name || 'Unknown'
          } : null
        }));

        return NextResponse.json(nearbyShops);
      },
      5 * 60 * 1000 // 5 minutes
    );
  } catch (error) {
    console.error("Error finding nearby shops:", error);
    return NextResponse.json({ error: "Failed to find shops" }, { status: 500 });
  }
}

// Optimized distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
