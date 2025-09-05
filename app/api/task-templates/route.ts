import { NextRequest, NextResponse } from 'next/server'
import { getTaskTemplates, createTaskTemplate, DEFAULT_TEMPLATES } from '@/lib/task-templates'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    
    if (!householdId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Household ID is required' 
      }, { status: 400 })
    }

    const templates = await getTaskTemplates(householdId)
    
    return NextResponse.json({ 
      success: true, 
      templates 
    })
  } catch (error) {
    console.error('Error fetching task templates:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch task templates' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { householdId, userId, ...templateData } = body

    if (!householdId || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Household ID and User ID are required' 
      }, { status: 400 })
    }

    const templateId = await createTaskTemplate({
      ...templateData,
      householdId,
      createdBy: userId,
    })

    return NextResponse.json({ 
      success: true, 
      templateId 
    })
  } catch (error) {
    console.error('Error creating task template:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create task template' 
    }, { status: 500 })
  }
}

// Initialize default templates for a household
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { householdId, userId } = body

    if (!householdId || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Household ID and User ID are required' 
      }, { status: 400 })
    }

    // Check if default templates already exist
    const existingTemplates = await getTaskTemplates(householdId)
    const hasDefaultTemplates = existingTemplates.some(t => t.isDefault)

    if (hasDefaultTemplates) {
      return NextResponse.json({ 
        success: true, 
        message: 'Default templates already exist' 
      })
    }

    // Create default templates
    const templatePromises = DEFAULT_TEMPLATES.map(template => 
      addDoc(collection(db, 'taskTemplates'), {
        ...template,
        householdId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )

    await Promise.all(templatePromises)

    return NextResponse.json({ 
      success: true, 
      message: 'Default templates created successfully' 
    })
  } catch (error) {
    console.error('Error initializing default templates:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize default templates' 
    }, { status: 500 })
  }
} 