import { NextRequest, NextResponse } from 'next/server'
import { deleteDpp } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'DPP ID is required' },
        { status: 400 }
      )
    }

    const result = await deleteDpp(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'DPP deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

