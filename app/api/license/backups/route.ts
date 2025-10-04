import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { BackupMetadata, ApiResponse } from "@/lib/license-types"

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<BackupMetadata[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')
    const licenseId = searchParams.get('licenseId')

    if (!deviceId && !licenseId) {
      return NextResponse.json({
        success: false,
        error: 'Missing query parameter: deviceId or licenseId',
        code: 'INVALID_INPUT'
      }, { status: 400 })
    }

    // Construir filtro
    const where: any = {}
    if (deviceId) where.deviceId = deviceId
    if (licenseId) where.licenseId = licenseId

    // Buscar backups
    const backups = await prisma.licenseBackup.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Mapear para BackupMetadata
    const metadata: BackupMetadata[] = backups.map(backup => {
      let preview = undefined
      
      try {
        const snapshot = JSON.parse(backup.snapshot)
        preview = {
          licenseKey: snapshot.license?.licenseKey,
          type: snapshot.license?.type,
          deviceId: snapshot.device?.deviceId
        }
      } catch {
        // Snapshot inválido, preview vazio
      }

      return {
        id: backup.id,
        createdAt: backup.createdAt.toISOString(),
        reason: backup.reason as any,
        preview
      }
    })

    return NextResponse.json({
      success: true,
      data: metadata
    })

  } catch (error: any) {
    console.error('GET /api/license/backups error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}