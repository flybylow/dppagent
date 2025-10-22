import { NextRequest, NextResponse } from 'next/server'
import { scrapeDpp, saveToDatabase } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Scrape the DPP
    const scrapeResult = await scrapeDpp(url)

    // Save to database if successful
    let savedId = null
    if (scrapeResult.success) {
      const saveResult = await saveToDatabase(url, scrapeResult)
      if (saveResult.success) {
        savedId = saveResult.id
      }
    } else {
      // Save failed attempts too (for tracking)
      await saveToDatabase(url, scrapeResult)
    }

    return NextResponse.json({
      ...scrapeResult,
      savedId,
      message: scrapeResult.success 
        ? 'DPP scraped and saved successfully' 
        : 'Failed to scrape DPP'
    })

  } catch (error: any) {
    console.error('Scrape API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

