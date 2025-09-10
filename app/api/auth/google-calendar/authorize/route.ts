import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    
    return NextResponse.json({ 
      success: true, 
      authUrl 
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate authorization URL' 
      },
      { status: 500 }
    );
  }
}