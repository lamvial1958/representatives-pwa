import { NextResponse } from "next/server"
import { PolicyResponse, ApiResponse } from "@/lib/license-types"

export async function GET(): Promise<NextResponse<ApiResponse<PolicyResponse>>> {
  try {
    const policy: PolicyResponse = {
      fingerprintTolerance: parseFloat(process.env.LICENSE_FP_TOLERANCE || '0.90'),
      graceDays: parseInt(process.env.LICENSE_GRACE_DAYS || '3'),
      allowTrial: process.env.LICENSE_ALLOW_TRIAL === 'true',
      trialDays: parseInt(process.env.LICENSE_TRIAL_DAYS || '30')
    }

    return NextResponse.json({
      success: true,
      data: policy
    })
  } catch (error: any) {
    console.error('GET /api/license/policy error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}