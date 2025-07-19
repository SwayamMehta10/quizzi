import { NextRequest, NextResponse } from 'next/server';

interface RequestValidationOptions {
  allowedMethods?: string[];
  requiredHeaders?: string[];
  maxRequestSize?: number;
  rateLimitPerMinute?: number;
}

class RequestValidator {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();

  static validate(request: NextRequest, options: RequestValidationOptions = {}) {
    const {
      allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
      requiredHeaders = ['content-type'],
      maxRequestSize = 1024 * 1024, // 1MB
      rateLimitPerMinute = 60
    } = options;

    // Method validation
    if (!allowedMethods.includes(request.method)) {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Header validation
    for (const header of requiredHeaders) {
      if (!request.headers.get(header)) {
        return NextResponse.json({ error: `Missing required header: ${header}` }, { status: 400 });
      }
    }

    // Rate limiting
    const clientId = this.getClientId(request);
    const now = Date.now();

    const clientData = this.requestCounts.get(clientId) || { count: 0, resetTime: now + 60000 };
    
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + 60000;
    }

    clientData.count++;
    this.requestCounts.set(clientId, clientData);

    if (clientData.count > rateLimitPerMinute) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Content-Length validation
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxRequestSize) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    return null; // No validation errors
  }

  private static getClientId(request: NextRequest): string {
    // Use IP address as client identifier
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  static cleanupOldEntries() {
    const now = Date.now();
    for (const [clientId, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(clientId);
      }
    }
  }
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  RequestValidator.cleanupOldEntries();
}, 5 * 60 * 1000);

export { RequestValidator };
