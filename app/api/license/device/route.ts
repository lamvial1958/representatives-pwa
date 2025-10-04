import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DeleteDeviceInput, ApiResponse } from "@/lib/license-types"

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse<{ deviceId: string; status: string }>>> {
  try {
    const body: DeleteDeviceInput = await req.json()

    if (!body.deviceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: deviceId',
        code: 'INVALID_INPUT'
      }, { status: 400 })
    }

    // Buscar device
    const device = await prisma.licenseDevice.findUnique({
      where: { deviceId: body.deviceId }
    })

    if (!device) {
      return NextResponse.json({
        success: false,
        error: 'Device not found',
        code: 'DEVICE_NOT_FOUND'
      }, { status: 404 })
    }

    // Marcar como blocked ao invés de deletar (mantém histórico)
    const updated = await prisma.licenseDevice.update({
      where: { deviceId: body.deviceId },
      data: { 
        status: 'blocked',
        lastSeenAt: new Date()
      }
    })

    console.log(`Device ${body.deviceId} blocked`)

    return NextResponse.json({
      success: true,
      data: {
        deviceId: updated.deviceId,
        status: updated.status
      }
    })

  } catch (error: any) {
    console.error('DELETE /api/license/device error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}