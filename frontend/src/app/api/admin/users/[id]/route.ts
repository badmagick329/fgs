import { updateSuperAdminSchema } from '@/types';
import { AdminActionError } from '@/types/auth';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const { id } = await Promise.resolve(context.params);
  const targetAdminId = Number(id);
  if (!Number.isInteger(targetAdminId) || targetAdminId <= 0) {
    return NextResponse.json(
      { ok: false, message: 'Invalid admin id.' },
      { status: 400 }
    );
  }

  try {
    await adminManagementService.removeAdminUserWithGuards({
      actingAdminId: Number(auth.payload.sub),
      targetAdminId,
    });

    const res = NextResponse.json({ ok: true });
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  } catch (error) {
    const message =
      error instanceof AdminActionError
        ? error.message
        : 'Failed to remove admin.';
    const status = error instanceof AdminActionError ? error.status : 500;
    const res = NextResponse.json({ ok: false, message }, { status });
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const { id } = await Promise.resolve(context.params);
  const targetAdminId = Number(id);
  if (!Number.isInteger(targetAdminId) || targetAdminId <= 0) {
    return NextResponse.json(
      { ok: false, message: 'Invalid admin id.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSuperAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  try {
    const updatedAdmin = await adminManagementService.updateAdminSuperStatusWithGuards({
      actingAdminId: Number(auth.payload.sub),
      targetAdminId,
      isSuperAdmin: parsed.data.isSuperAdmin,
    });

    const res = NextResponse.json({
      ok: true,
      data: {
        id: updatedAdmin.id,
        is_super_admin: updatedAdmin.is_super_admin,
      },
    });
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  } catch (error) {
    const message =
      error instanceof AdminActionError
        ? error.message
        : 'Failed to update admin role.';
    const status = error instanceof AdminActionError ? error.status : 500;
    const res = NextResponse.json({ ok: false, message }, { status });
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }
}



