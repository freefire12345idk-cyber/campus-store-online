import { NextResponse } from "next/server";

// Performance monitoring middleware
export function withPerformanceMonitoring(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const startTime = Date.now();
    const url = req.url;
    
    try {
      // Log request start
      console.log(`[${new Date().toISOString()}] ${req.method} ${url} - START`);
      
      // Execute the handler
      const response = await handler(req, ...args);
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      console.log(`[${new Date().toISOString()}] ${req.method} ${url} - ${response.status} - ${duration}ms`);
      
      // Log slow requests (>1000ms)
      if (duration > 1000) {
        console.warn(`SLOW REQUEST: ${req.method} ${url} took ${duration}ms`);
      }
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Server-Timestamp', new Date().toISOString());
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] ${req.method} ${url} - ERROR - ${duration}ms`, error);
      throw error;
    }
  };
}

// Health check endpoint for load balancing
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
