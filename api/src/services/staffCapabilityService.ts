import prisma from '../utils/prisma';

export async function tenantUsesStaffServiceAssignments(tenantId: string): Promise<boolean> {
  const assignments = await prisma.staffServizio.count({
    where: { staff: { tenantId } },
  });

  return assignments > 0;
}

export async function staffCanPerformService(
  tenantId: string,
  staffId: string,
  servizioId: string
): Promise<boolean> {
  const usesAssignments = await tenantUsesStaffServiceAssignments(tenantId);
  if (!usesAssignments) return true;

  const assignment = await prisma.staffServizio.findFirst({
    where: {
      staffId,
      servizioId,
      staff: { tenantId },
      servizio: { tenantId },
    },
  });

  return Boolean(assignment);
}

export async function assignServiceToAllStaff(tenantId: string, servizioId: string): Promise<void> {
  const staffList = await prisma.staff.findMany({
    where: { tenantId, attivo: true },
    select: { id: true },
  });

  if (staffList.length === 0) return;

  await prisma.staffServizio.createMany({
    data: staffList.map((staff) => ({ staffId: staff.id, servizioId })),
    skipDuplicates: true,
  });
}
